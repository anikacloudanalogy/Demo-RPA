-- GALAXY TOYOTA RPA SYSTEM - ENTERPRISE SCHEMAS (POSTGRESQL)
-- Production-style DB initialization script for Salesforce-CTDMS Sync

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SALESFORCE LEAD SIMULATOR STORE
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    alt_mobile VARCHAR(20),
    city VARCHAR(50) NOT NULL,
    showroom_code VARCHAR(50) NOT NULL,
    model_interest VARCHAR(50) NOT NULL,
    lead_source VARCHAR(50) NOT NULL,
    finance_required BOOLEAN DEFAULT FALSE,
    exchange_required BOOLEAN DEFAULT FALSE,
    test_drive_required BOOLEAN DEFAULT FALSE,
    budget VARCHAR(50),
    rpa_status VARCHAR(20) DEFAULT 'Idle', -- 'Idle', 'Queued', 'Processing', 'Success', 'Failed'
    ctdms_id VARCHAR(50),
    error_message TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. AUDIT LOGGING STORE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(50) NOT NULL, -- 'SALESFORCE', 'ORCHESTRATOR', 'BOT'
    status VARCHAR(20) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. SCREENSHOT PROOFS LEDGER
CREATE TABLE IF NOT EXISTS screenshot_proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'BEFORE_SUBMIT', 'CONFIRMATION', 'ERROR'
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create optimized indices for dashboard sorting
CREATE INDEX IF NOT EXISTS idx_leads_rpa_status ON leads(rpa_status);
CREATE INDEX IF NOT EXISTS idx_audit_lead_id ON audit_logs(lead_id);