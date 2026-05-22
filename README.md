# Galaxy Toyota — CTDMS Auto-Punch RPA System
### Enterprise Salesforce-to-CTDMS Decoupled RPA Orchestration Console

This repository represents a high-fidelity client simulation demo showcasing a production-style Robotic Process Automation (RPA) solution. It synchronizes leads qualified inside Salesforce CRM with the legacy Toyota Dealer Management Portal (CTDMS) in under 90 seconds.

---

## 🛠️ Technology Stack

* **Frontend Dashboard**: Next.js 14, TypeScript, HSL Tailored HSL Colors, Cyber-Dark UI Glassmorphism.
* **Orchestrator Backend**: Node.js + Express, Socket.IO Real-time Channels, BullMQ Queue Controller.
* **Database Ledger**: PostgreSQL Transaction Tables & Immutable Audits.
* **Headless Automation**: Playwright (PID Browser Handshake & Typing).

---

## 📂 Enterprise Repository Architecture

```bash
├── apps/                 # Future frontend extensions
├── services/
│   └── backend/         # Express API Gateway, Socket.IO, BullMQ
│       ├── src/server.ts # REST Routes & Event Handlers
│       └── tsconfig.json
├── worker/              # Playwright Headless Automation Worker
│   ├── src/rpa_worker.ts# Playwright Punch scripts
│   └── tsconfig.json
├── shared/              # Shared TypeScript data models
│   └── types.ts
├── infra/
│   └── db/              # PostgreSQL Schema initialization
│       └── schema.sql
├── docs/                # Architecture and Integration designs
│   ├── architecture.md  # System Pillars & Diagrams
│   ├── api_flow.md      # Webhook Protocols & Event Contracts
│   └── demo_instructions.md # 90-Second presentation scripts
├── bot/                 # Polling simulation scripts
│   └── rpa_bot_agent.js
└── package.json         # Unified dependency configurations
```

---

## 🚀 Execution & Demo Start Guide

To run this magnificent dashboard and active bot simulator:

### 1. Install & Ingest Base Dependencies
```bash
npm install
```

### 2. Run the Next.js Dev Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 3. Run the Standalone RPA Polling Bot
```bash
node bot/rpa_bot_agent.js
```

---

## 📅 The 90-Second presentation Flow

1. **CRM Ingestion**: View the **Salesforce Lightning Lead Table** on the left. Click **"Qualify & Auto-Punch"** for *Vikram Malhotra*.
2. **Decoupled Queue**: Emphasize that Salesforce events are captured in `< 200ms` and placed in the **BullMQ Queue**, remaining 100% interactive.
3. **Bot Visualizer**: Watch the **Headless Chrome Visualizer** on the right. Monitor the fields being filled, values verified, and boxes checked in real-time.
4. **SLA Validation**: Review the **SLA Countdown Clock** (target `< 90s`). The transaction completes in **46 seconds**!
5. **Screenshot Proofs**: Click the generated **"📷 View Screenshot"** button to overlay pre-submit input audits and confirmation receipts.
6. **Incident Escalation**: Select a simulated "Selector UI Changed" fault from the controller. Trigger a qualified lead and demonstrate the **SLA Breach Alert & WhatsApp escalation** sent to the IT Director in `< 2s` with a live 4-hour countdown recovery SLA.
# Demo-RPA
