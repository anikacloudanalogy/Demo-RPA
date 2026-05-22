/**
 * GALAXY TOYOTA - RPA BOT AGENT
 * 
 * Standalone RPA Bot simulator running on a dedicated showroom server.
 * Connects to the Salesforce/Next.js Orchestrator Queue.
 * Processes leads under 90 seconds.
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';
const POLL_INTERVAL = 3000;

console.log("=========================================================");
console.log("   GALAXY TOYOTA - RPA BOT ENGINE (Dedicated Node 03)    ");
console.log("=========================================================");
console.log("Dedicated Server Service Account: srv_toyota_del@galaxy.toyota.com");
console.log("Toyota Dealer Net Gateway: ACTIVE");
console.log("Status: Standby. Polling orchestrator queue...");

// Core Polling Loop
setInterval(async () => {
  try {
    const leads = await getJson(`${API_BASE}/bot/queue`);
    const queuedLeads = leads.filter(l => l.rpaStatus === 'Queued');
    
    if (queuedLeads.length > 0) {
      const activeJob = queuedLeads[0];
      await processLead(activeJob);
    }
  } catch (e) {
    // Console log polling warnings in grey
    // console.warn("Waiting for Next.js orchestrator server...");
  }
}, POLL_INTERVAL);

async function processLead(lead) {
  console.log(`\n[${new Date().toLocaleTimeString()}] 📥 JOB DETECTED: Pulled job ${lead.id} for ${lead.name} from queue.`);
  console.log(`[RPA] Checking required parameters...`);
  console.log(`[RPA] Validation Passed. Proceeding with CTDMS browser entry.`);
  
  // Update to Processing
  await postJson(`${API_BASE}/bot/callback`, {
    leadId: lead.id,
    status: 'Processing',
    errorMessage: 'Launching headless Google Chrome (PID ' + Math.floor(10000 + Math.random() * 20000) + ')...'
  });

  // Simulate Headless Typing
  const steps = [
    { delay: 1000, log: "Navigating browser window to: http://localhost:3000/ctdms/login" },
    { delay: 3000, log: "Logging into CTDMS with service account srv_toyota_del@galaxy.toyota.com" },
    { delay: 5000, log: "Authentication successful. Navigation: 'New Enquiry Form' fully loaded." },
    { delay: 7000, log: `Typing data inputs sequence: Name => "${lead.name}", Mobile => "${lead.mobile}"` },
    { delay: 9000, log: `Selecting options: Showroom => "${lead.showroomCode}", Model => "${lead.modelInterest}"` },
    { delay: 11000, log: `Activating checklists: Finance => ${lead.financeRequired}, Trade-In => ${lead.exchangeRequired}` },
    { delay: 13000, log: `[Compliance] Captured pre-submission verification screenshot.` },
    { delay: 15000, log: "Clicking submit button... awaiting confirmation dialog." }
  ];

  steps.forEach(step => {
    setTimeout(() => {
      console.log(`[RPA] ${step.log}`);
    }, step.delay);
  });

  // Finalize Submission
  setTimeout(async () => {
    const generatedEnqId = "ENQ-2026-" + Math.floor(100000 + Math.random() * 900000);
    console.log(`[RPA] SUBMISSION SUCCESS. Captured CTDMS Enquiry ID: ${generatedEnqId}`);
    console.log(`[RPA] [Compliance] Captured transaction confirmation receipt screenshot.`);
    console.log(`[RPA] Synchronizing callback back to Salesforce CRM lead record.`);

    await postJson(`${API_BASE}/bot/callback`, {
      leadId: lead.id,
      status: 'Success',
      enquiryId: generatedEnqId,
      durationMs: 16500
    });

    console.log(`[RPA] Lead record updated. Bot returned to standby.`);
  }, 16000);
}

// HTTP Helper Utils
function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const dataStr = JSON.stringify(payload);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': dataStr.length
      }
    };

    const req = http.request(options, (res) => {
      let response = '';
      res.on('data', chunk => response += chunk);
      res.on('end', () => resolve(response));
    });

    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}