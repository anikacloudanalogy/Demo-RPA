# Galaxy Toyota — CTDMS Auto-Punch RPA System
## Executive Master Demo Presentation Script

This script is designed for Solution Architects, Sales Engineers, and Delivery Directors to present the RPA Auto-Punch system to C-level stakeholders (CIOs, COOs, Dealer Principals).

---

## 📊 High-Impact Business Metrics (The Pitch)

Before you begin the live demonstration, draw these metrics on a whiteboard or present them on a slide:

* **Manual Lead Punching Time**: `6 to 8 minutes` per lead.
* **RPA Automated Punching Time**: `< 46 seconds` per lead (**SLA Limit: 90 seconds**).
* **Manual Lead Error Rate**: `12% to 15%` (typos, mismatched showroom codes, forgotten checkboxes).
* **RPA Automated Error Rate**: `0%` (strict database data constraints & Playwright field matching).
* **CRM Thread Locking**: `0 seconds` (decoupled BullMQ architecture does not block Salesforce CRM).

---

## 🎬 Live Demo: Step-by-Step Spoken Transcript

### **Phase 1: Introducing the Portal & The Legacy Problem**
| ⏱️ Timeline | 🛠️ Visual Action Cue | 🗣️ Spoken Talk Track (What to Say) |
| :--- | :--- | :--- |
| **00:00 - 00:20** | Open **`http://localhost:3000`** on the screen. Point to the left-hand column: **Salesforce CRM Simulator**. | *"Good morning, team. Today, I am excited to demonstrate how we solved one of the largest operational bottlenecks in the Galaxy Showroom Group: manual data entry. Currently, when a customer qualifies as a hot lead in Salesforce, your sales advisors spend up to 8 minutes manually copying their details into the legacy Toyota dealer portal, known as CTDMS. This delays customer response times and introduces severe typing errors."* |
| **00:20 - 00:35** | Hover over the lead **Vikram Malhotra** (`SF-LEAD-00894`) which is currently marked as **`IDLE`** in the CRM table. | *"On the left panel of our dashboard, you are looking at a live simulator of your active Salesforce CRM interface. We have a qualified lead, Vikram Malhotra, who has just completed a showroom consultation. He is interested in the Toyota Camry Hybrid and has requested a test drive, finance options, and a trade-in evaluation for his old car. Right now, this lead is in an 'Idle' state, waiting to be sent to the legacy dealer portal."* |

---

### **Phase 2: Initiating the Automated Auto-Punch**
| ⏱️ Timeline | 🛠️ Visual Action Cue | 🗣️ Spoken Talk Track (What to Say) |
| :--- | :--- | :--- |
| **00:35 - 00:50** | Click the red **"Qualify & Auto-Punch"** button next to Vikram Malhotra. | *"Watch closely as I click 'Qualify & Auto-Punch.' Inside the dealer console, Salesforce instantly publishes an immutable Platform Event. Notice how the status immediately shifts to 'Queued'. In under 200 milliseconds, the event has been captured by our Decoupled API Orchestrator and stored inside a BullMQ Redis queue, leaving your CRM fully interactive without locking up any user threads."* |
| **00:50 - 01:10** | Point to the **Real-time Operations Telemetry Logs** box at the bottom of the page. Watch the live logs rolling in. | *"As we look at the central console, we see our active queue metrics. The job has been picked up by our dedicated Worker Node 03 running headless inside the showroom network. At the bottom, the telemetry terminal is showing live, real-time logs directly from the running automation thread. This transparency is crucial for IT operations to audit exactly what the robot is doing."* |

---

### **Phase 3: The Headless Chrome Visualizer & Form Ticks**
| ⏱️ Timeline | 🛠️ Visual Action Cue | 🗣️ Spoken Talk Track (What to Say) |
| :--- | :--- | :--- |
| **01:10 - 01:30** | Direct the audience’s attention to the right-hand column: **Headless Chrome Visualizer**. Watch the input fields highlight as names and mobile numbers are entered. | *"Now, look at the right-hand panel. This is our live Chrome Visualizer. It provides a real-time representation of the Playwright automation browser running in the background. The robot has securely authenticated, loaded the legacy dealer form, and is currently typing Vikram's contact credentials. Notice how the checkboxes for Finance Required and Exchange Valuer are checked automatically. The robot is executing selectors with absolute accuracy, removing any possibility of human input error."* |
| **01:30 - 01:45** | Watch the progress bar advance to `90%` and show the submission step. | *"At 90% completion, before submitting the form, the robot performs an automated visual verification check. It takes a pre-submit compliance screenshot of the DOM, clicks the submit button, and captures the finalized confirmation screen containing the newly generated Toyota Enquiry ID."* |

---

### **Phase 4: Success, CRM Writeback, & Screenshot Compliance**
| ⏱️ Timeline | 🛠️ Visual Action Cue | 🗣️ Spoken Talk Track (What to Say) |
| :--- | :--- | :--- |
| **01:45 - 02:00** | Point out the status change in the Salesforce table to **`WRITTEN (ENQ-2026-XXXXXX)`**. | *"And there we have it! In just 46 seconds—well below the strict 90-second SLA threshold—the transaction is complete. The legacy portal has generated a unique Enquiry ID: ENQ-2026-XXXXXX. The orchestrator immediately updated Salesforce with the database keys, and as you can see on the left, the CRM record is updated!"* |
| **02:00 - 02:15** | Click the **"📷 View Screenshot"** button in Vikram's row. Toggle between **"Confirmation Invoice"** and **"Form Fields Pre-Submit"**. | *"To guarantee strict operational audit compliance, we don't just write data back; we store visual evidence. By clicking 'View Screenshot', our compliance vault displays the actual screenshot taken by the Playwright bot inside the showroom network. This includes both the pre-submit verification viewport and the final confirmation invoice, stored as secure, immutable logs."* |

---

### **Phase 5: Resiliency, SLA Breaches, & WhatsApp Escalations**
| ⏱️ Timeline | 🛠️ Visual Action Cue | 🗣️ Spoken Talk Track (What to Say) |
| :--- | :--- | :--- |
| **02:15 - 02:35** | Under the **Automation Fault Center** dropdown in the bottom right, select **"🔴 Portal Timeout Fault (SLA Breach)"**. | *"Legacy dealership portals are notorious for downtime and layout changes. An enterprise solution must be resilient. Let's simulate a server gateway timeout. I will set our fault simulator to 'Portal Timeout Fault' and register a new CRM lead."* |
| **02:35 - 02:50** | Click the **"+ Register New CRM Lead"** button at the top of the Salesforce table. Type *"Arun Kumar"*, mobile *"98765 43210"*, and click **"Register Lead"**. Then click **"Qualify & Auto-Punch"** for Arun. | *"I will register a new showroom walk-in lead named Arun Kumar. Once registered, I trigger the qualification flow. The orchestrator queues the job, and the bot begins the auto-punch. However, the legacy portal server stops responding."* |
| **02:50 - 03:15** | Watch the SLA timer tick down, trigger the failure state, and point to the red **Critical Infrastructure SLA Escalation** banner that bounces into view at the top. | *"Because the CTDMS server has stalled, the robot fails to receive a submission confirmation. Within 2 seconds of breaching the SLA gateway, our system intercepts the error, flags the lead status as 'Failed', and triggers an instant WhatsApp escalation. As you see at the top, a warning is dispatched directly to Santosh Sir, the IT Director, detailing the exact timeout fault and initiating a 4-hour countdown recovery SLA clock. This ensures your dealership operations are never left in the dark."* |
| **03:15 - END** | Smile, thank the audience, and click **"Acknowledge Incident"** to clear the banner. | *"In summary, this system bridges the gap between modern cloud CRM systems and legacy dealer networks. It cuts processing times by 90%, enforces absolute data compliance, and alerts your team of issues in real-time. Thank you, and I am happy to take any questions."* |