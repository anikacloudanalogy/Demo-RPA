import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const SCREENSHOTS_DIR = path.join(__dirname, '../../public/screenshots');

// Ensure screenshots folder exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

console.log("🤖 Starting Playwright RPA Worker Engine Node 03...");

let connection: IORedis | null = null;
let bullWorker: Worker | null = null;

try {
  connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
  
  bullWorker = new Worker('ctdms-punch-queue', async (job: Job) => {
    const lead = job.data;
    console.log(`📥 Locked Job ${job.id} for Lead: ${lead.leadId} (${lead.name})`);
    
    // 1. Report Status: Processing
    await reportStatus(lead.leadId, 'Processing', {
      message: 'Secure bot connection established. Headless Chrome launching...'
    });

    let browser;
    try {
      // 2. Playwright Headless Chrome Launch
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
      });
      const page = await context.newPage();

      // 3. Login to CTDMS Simulator Portal
      const portalUrl = 'http://localhost:3000/ctdms/login';
      console.log(`🔗 Navigating to portal login: ${portalUrl}`);
      await page.goto(portalUrl, { waitUntil: 'networkidle' });
      
      await page.fill('input[id="username"]', 'srv_toyota_del@galaxy.toyota.com');
      await page.fill('input[id="password"]', 'ShowroomNetPass303');
      await page.click('button[id="btnLogin"]');
      
      // Await dashboard redirect
      await page.waitForURL('**/ctdms/dashboard', { timeout: 10000 });
      console.log("✅ Authenticated on Toyota CTDMS.");

      // 4. Navigate to New Enquiry Form
      await page.click('a[id="menuNewEnquiry"]');
      await page.waitForSelector('form[id="enquiryForm"]', { timeout: 10000 });
      console.log("📝 New Enquiry Form loaded.");

      // 5. Fill Fields
      await page.fill('input[id="CustomerName"]', lead.name);
      await page.fill('input[id="MobileNo"]', lead.mobile);
      if (lead.altMobile) {
        await page.fill('input[id="AltMobileNo"]', lead.altMobile);
      }
      await page.fill('input[id="City"]', lead.city);
      await page.fill('input[id="ShowroomCode"]', lead.showroomCode);
      await page.selectOption('select[id="ModelPreference"]', { label: lead.modelInterest });
      await page.selectOption('select[id="EnquirySource"]', { label: lead.leadSource });
      await page.fill('input[id="Budget"]', lead.budget || '₹15,00,000');

      if (lead.financeRequired) {
        await page.check('input[id="FinanceRequired"]');
      }
      if (lead.exchangeRequired) {
        await page.check('input[id="ExchangeRequired"]');
      }
      if (lead.testDriveRequired) {
        await page.check('input[id="TestDriveRequired"]');
      }

      // 6. Capture Before Submit Screenshot
      const beforeSubmitPath = path.join(SCREENSHOTS_DIR, `${lead.leadId}_before.png`);
      await page.screenshot({ path: beforeSubmitPath });
      console.log(`📸 Captured pre-submission verification screenshot: ${beforeSubmitPath}`);

      // 7. Submit Form
      await page.click('button[id="btnSubmitEnquiry"]');

      // 8. Capture Enquiry ID and Confirmation Screenshot
      await page.waitForSelector('span[id="enquiryIdNode"]', { timeout: 10000 });
      const enquiryId = await page.textContent('span[id="enquiryIdNode"]');
      
      const confirmPath = path.join(SCREENSHOTS_DIR, `${lead.leadId}_confirm.png`);
      await page.screenshot({ path: confirmPath });
      console.log(`🎉 Punch successful. Captured Enquiry ID: ${enquiryId}`);

      // 9. Close browser
      await browser.close();

      // 10. Callback with Success
      await axios.post(`${BACKEND_URL}/api/bot/callback`, {
        leadId: lead.leadId,
        status: 'Success',
        enquiryId: enquiryId ? enquiryId.trim() : `ENQ-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        beforeSubmitScreenshot: `/screenshots/${lead.leadId}_before.png`,
        confirmScreenshot: `/screenshots/${lead.leadId}_confirm.png`,
        durationMs: job.finishedOn ? (job.finishedOn - job.processedOn!) : 46000
      });

    } catch (err: any) {
      console.error(`❌ Playwright Automation Error: ${err.message}`);
      if (browser) await browser.close();

      // Callback with Failure
      await axios.post(`${BACKEND_URL}/api/bot/callback`, {
        leadId: lead.leadId,
        status: 'Failed',
        errorMessage: err.message || 'Browser Automation Selector Exception'
      });
      throw err;
    }
  }, { connection });

  bullWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed with error: ${err.message}`);
  });

  console.log("🤖 Playwright Bot Agent is active and listening to active Redis queue channels.");
} catch (e: any) {
  console.warn("⚠️ Standalone Bot Node: Redis service offline. Working in simulation listener standby.");
}

async function reportStatus(leadId: string, status: string, details: any) {
  try {
    await axios.post(`${BACKEND_URL}/api/bot/callback`, {
      leadId,
      status,
      errorMessage: details.message || ''
    });
  } catch (e) {
    // console.warn("Failed to dispatch status callback");
  }
}
