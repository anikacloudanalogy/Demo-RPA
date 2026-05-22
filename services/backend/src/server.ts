import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Pool } from 'pg';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://galaxy_admin:admin_secret_key@localhost:5432/toyota_rpa_db';

// ----------------------------------------------------
// DATABASE & REDIS / BULLMQ INITIALIZATION & FALLBACK
// ----------------------------------------------------
let dbPool: Pool | null = null;
let rpaQueue: Queue | null = null;
let isDbMocked = false;
let isQueueMocked = false;

// Mock database in-memory ledger
const mockLeads: Record<string, any> = {
  "SF-LEAD-00891": {
    id: "SF-LEAD-00891",
    name: "Rahul Sharma",
    mobile: "+91 98102 34567",
    alt_mobile: "+91 99102 34567",
    city: "New Delhi",
    showroom_code: "DEL-01 (South Delhi)",
    model_interest: "Toyota Fortuner",
    lead_source: "Google Search",
    finance_required: true,
    exchange_required: false,
    test_drive_required: true,
    budget: "₹52,00,000",
    rpa_status: "Success",
    ctdms_id: "ENQ-2026-94821",
    error_message: null
  },
  "SF-LEAD-00892": {
    id: "SF-LEAD-00892",
    name: "Priya Patel",
    mobile: "+91 98980 12345",
    alt_mobile: "",
    city: "Ahmedabad",
    showroom_code: "AHM-03 (S.G. Road)",
    model_interest: "Toyota Innova Hycross",
    lead_source: "Newspaper Ad",
    finance_required: false,
    exchange_required: true,
    test_drive_required: false,
    budget: "₹32,00,000",
    rpa_status: "Success",
    ctdms_id: "ENQ-2026-94793",
    error_message: null
  },
  "SF-LEAD-00893": {
    id: "SF-LEAD-00893",
    name: "Amit Verma",
    mobile: "+91 95600 12344",
    alt_mobile: "",
    city: "Noida",
    showroom_code: "",
    model_interest: "Toyota Glanza",
    lead_source: "Referral",
    finance_required: true,
    exchange_required: true,
    test_drive_required: true,
    budget: "₹9,50,000",
    rpa_status: "Failed",
    ctdms_id: null,
    error_message: "Validation Failed: Required field [Showroom Code] is missing."
  },
  "SF-LEAD-00894": {
    id: "SF-LEAD-00894",
    name: "Vikram Malhotra",
    mobile: "+91 95600 78912",
    alt_mobile: "+91 98111 22233",
    city: "Gurugram",
    showroom_code: "GUR-02 (Sohna Road)",
    model_interest: "Toyota Camry Hybrid",
    lead_source: "Facebook Portal",
    finance_required: true,
    exchange_required: true,
    test_drive_required: true,
    budget: "₹46,00,000",
    rpa_status: "Idle",
    ctdms_id: null,
    error_message: null
  }
};

const mockAuditLogs: Array<any> = [
  { lead_id: "SF-LEAD-00891", action: "Lead qualified inside Salesforce CRM", actor: "SALESFORCE", status: "INFO", created_at: new Date() },
  { lead_id: "SF-LEAD-00891", action: "Queue job locked by Bot Agent Node 03", actor: "BOT", status: "INFO", created_at: new Date() },
  { lead_id: "SF-LEAD-00891", action: "Auto-Punch completed successfully: ENQ-2026-94821", actor: "BOT", status: "SUCCESS", created_at: new Date() },
  { lead_id: "SF-LEAD-00893", action: "Lead qualified inside Salesforce CRM", actor: "SALESFORCE", status: "INFO", created_at: new Date() },
  { lead_id: "SF-LEAD-00893", action: "Job qualification aborted: [Showroom Code] is missing", actor: "ORCHESTRATOR", status: "ERROR", created_at: new Date() }
];

const mockScreenshots: Array<any> = [
  { lead_id: "SF-LEAD-00891", type: "BEFORE_SUBMIT", file_path: "/screenshots/SF-LEAD-00891_before.png" },
  { lead_id: "SF-LEAD-00891", type: "CONFIRMATION", file_path: "/screenshots/SF-LEAD-00891_confirm.png" }
];

// Initialize DB Connection
try {
  dbPool = new Pool({ connectionString: DATABASE_URL });
  console.log("PostgreSQL pool initialized successfully.");
} catch (e) {
  console.warn("PostgreSQL connection failed, enabling UI in-memory database mock fallback.");
  isDbMocked = true;
}

// Initialize Redis / BullMQ
try {
  const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
  rpaQueue = new Queue('ctdms-punch-queue', { connection });
  console.log("BullMQ Redis connection initialized successfully.");
} catch (e) {
  console.warn("Redis is offline, enabling Queue mock engine fallback.");
  isQueueMocked = true;
}

// ----------------------------------------------------
// REST API CHANNELS & CONTROLLERS
// ----------------------------------------------------

// 1. Get all leads list
app.get('/api/leads', async (req: Request, res: Response) => {
  if (isDbMocked || !dbPool) {
    return res.json(Object.values(mockLeads));
  }
  try {
    const result = await dbPool.query('SELECT * FROM leads ORDER BY updated_at DESC');
    return res.json(result.rows);
  } catch (e) {
    console.error("DB Query error, fallback to mock data:", e);
    return res.json(Object.values(mockLeads));
  }
});

// 2. Qualified Lead Webhook Endpoint (Salesforce simulation)
app.post('/api/leads/qualify', async (req: Request, res: Response) => {
  const leadPayload = req.body;
  const { leadId, name, showroomCode } = leadPayload;

  console.log(`📥 Received qualification event from Salesforce for Lead ID: ${leadId} (${name})`);

  // Validate critical field (showroom code trigger error simulation)
  if (!showroomCode) {
    const errorMsg = "Validation Failed: Required field [Showroom Code] is missing.";
    console.error(`❌ Validation failed for Lead ID: ${leadId}: ${errorMsg}`);
    
    // Update Mock db
    if (mockLeads[leadId]) {
      mockLeads[leadId].rpa_status = "Failed";
      mockLeads[leadId].error_message = errorMsg;
    }
    mockAuditLogs.push({
      lead_id: leadId,
      action: `Job validation failed: ${errorMsg}`,
      actor: "ORCHESTRATOR",
      status: "ERROR",
      created_at: new Date()
    });

    io.emit('telemetry:log', {
      leadId,
      action: `Job qualification aborted: ${errorMsg}`,
      actor: "ORCHESTRATOR",
      status: "ERROR",
      timestamp: new Date()
    });
    
    io.emit('lead:updated', { leadId, rpa_status: "Failed", error_message: errorMsg });

    return res.status(400).json({
      status: "FAILED",
      message: errorMsg
    });
  }

  // Update lead status to Queued
  if (mockLeads[leadId]) {
    mockLeads[leadId].rpa_status = "Queued";
    mockLeads[leadId].error_message = null;
  }
  
  mockAuditLogs.push({
    lead_id: leadId,
    action: "Lead Qualified, Event sent to active orchestrator queue",
    actor: "SALESFORCE",
    status: "INFO",
    created_at: new Date()
  });

  io.emit('telemetry:log', {
    leadId,
    action: "Lead qualified inside Salesforce. RPA Event published.",
    actor: "SALESFORCE",
    status: "INFO",
    timestamp: new Date()
  });

  io.emit('lead:updated', { leadId, rpa_status: "Queued" });

  // Push to BullMQ or trigger simulated bot socket
  if (!isQueueMocked && rpaQueue) {
    await rpaQueue.add('punch-job', leadPayload, { attempts: 3, backoff: 5000 });
  } else {
    // Queue is mocked, run a simulated bot execution thread in 3 seconds
    console.log("Simulating queue dispatch via websocket trigger...");
    setTimeout(() => {
      triggerMockBotPunch(leadPayload);
    }, 3000);
  }

  return res.status(202).json({
    status: "QUEUED",
    message: "Lead qualified and transaction queued.",
    leadId
  });
});

// 3. Bot Callback Hook (Success / Failure reporting)
app.post('/api/bot/callback', (req: Request, res: Response) => {
  const { leadId, status, enquiryId, beforeSubmitScreenshot, confirmScreenshot, errorMessage, durationMs } = req.body;
  console.log(`🤖 Callback received from RPA Bot. Status: ${status}, Lead ID: ${leadId}`);

  if (mockLeads[leadId]) {
    mockLeads[leadId].rpa_status = status;
    mockLeads[leadId].ctdms_id = enquiryId || null;
    mockLeads[leadId].error_message = errorMessage || null;
  }

  mockAuditLogs.push({
    lead_id: leadId,
    action: status === 'Success' ? `CTDMS form successfully written. ID: ${enquiryId}` : `RPA transaction failed: ${errorMessage}`,
    actor: "BOT",
    status: status === 'Success' ? "SUCCESS" : "ERROR",
    created_at: new Date()
  });

  if (beforeSubmitScreenshot) {
    mockScreenshots.push({ lead_id: leadId, type: "BEFORE_SUBMIT", file_path: beforeSubmitScreenshot });
  }
  if (confirmScreenshot) {
    mockScreenshots.push({ lead_id: leadId, type: "CONFIRMATION", file_path: confirmScreenshot });
  }

  io.emit('telemetry:log', {
    leadId,
    action: status === 'Success' 
      ? `RPA Auto-Punch complete. Written back CTDMS Enquiry ID: ${enquiryId}` 
      : `RPA Execution Failure: ${errorMessage}`,
    actor: "BOT",
    status: status === 'Success' ? "SUCCESS" : "ERROR",
    timestamp: new Date()
  });

  io.emit('lead:updated', { leadId, rpa_status: status, ctdms_id: enquiryId, error_message: errorMessage, durationMs });

  return res.status(200).json({ status: "UPDATED", message: "CRM systems fully synchronized." });
});

// 4. Audit Logs API
app.get('/api/logs', (req: Request, res: Response) => {
  return res.json(mockAuditLogs);
});

// ----------------------------------------------------
// REALTIME SIMULATION FOR PRESENTATION MODE
// ----------------------------------------------------
function triggerMockBotPunch(lead: any) {
  const leadId = lead.leadId;
  const steps = [
    { delay: 1000, action: "Locking lead job from high-priority queue...", status: "INFO" },
    { delay: 2000, action: "Executing secure network routing. Initializing Chrome Webdriver (PID 4920)...", status: "INFO" },
    { delay: 4000, action: "Navigating to dealer portal URL: https://ctdms.toyota.co.in/login", status: "INFO" },
    { delay: 6000, action: "Authentication successful. Accessing showroom application portal...", status: "INFO" },
    { delay: 8000, action: "Filling form inputs: CustomerName => " + lead.name + ", City => " + lead.city, status: "INFO" },
    { delay: 10000, action: "Filling checkbox checklists: Finance => " + lead.financeRequired + ", Trade-In => " + lead.exchangeRequired, status: "INFO" },
    { delay: 12000, action: "Capturing pre-submission screenshot proof: /screenshots/" + leadId + "_before.png", status: "SUCCESS" },
    { delay: 14000, action: "Clicking primary submission node #submitEnquiry. Loading confirmation dialog...", status: "INFO" },
    { delay: 16000, action: "SUBMISSION CONFIRMED. Captured Enquiry ID: ENQ-2026-" + Math.floor(10000 + Math.random() * 90000), status: "SUCCESS" },
    { delay: 17000, action: "Capturing validation confirmation receipt screenshot: /screenshots/" + leadId + "_confirm.png", status: "SUCCESS" }
  ];

  io.emit('bot:status', { leadId, status: 'Processing' });
  if (mockLeads[leadId]) mockLeads[leadId].rpa_status = "Processing";
  io.emit('lead:updated', { leadId, rpa_status: "Processing" });

  steps.forEach((step, index) => {
    setTimeout(() => {
      io.emit('telemetry:log', {
        leadId,
        action: `[RPA Bot Agent Node 03] ${step.action}`,
        actor: "BOT",
        status: step.status,
        timestamp: new Date()
      });

      // On final step, send API callback
      if (index === steps.length - 1) {
        const generatedEnqId = "ENQ-2026-" + Math.floor(10000 + Math.random() * 90000);
        
        if (mockLeads[leadId]) {
          mockLeads[leadId].rpa_status = "Success";
          mockLeads[leadId].ctdms_id = generatedEnqId;
        }

        mockAuditLogs.push({
          lead_id: leadId,
          action: `CTDMS form successfully written. ID: ${generatedEnqId}`,
          actor: "BOT",
          status: "SUCCESS",
          created_at: new Date()
        });

        io.emit('lead:updated', { 
          leadId, 
          rpa_status: "Success", 
          ctdms_id: generatedEnqId,
          durationMs: 17200
        });

        io.emit('bot:status', { leadId: null, status: 'Standby' });
      }
    }, step.delay);
  });
}

// ----------------------------------------------------
// WEBSOCKET HANDSHAKES
// ----------------------------------------------------
io.on('connection', (socket) => {
  console.log(`🔌 Client dashboard connected: ${socket.id}`);
  socket.emit('system:status', { status: 'Operational', workerCount: 1, redis: isQueueMocked ? 'Offline (Mock Mode)' : 'Connected' });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🔥 Orchestrator Server running on port ${PORT}`);
});