// Shared Enterprise RPA System Data Contracts

export interface SalesforceLead {
  id: string;
  name: string;
  mobile: string;
  altMobile?: string;
  city: string;
  showroomCode: string;
  modelInterest: string;
  leadSource: string;
  financeRequired: boolean;
  exchangeRequired: boolean;
  testDriveRequired: boolean;
  budget?: string;
  rpaStatus: 'Idle' | 'Queued' | 'Processing' | 'Success' | 'Failed';
  ctdmsId?: string | null;
  errorMessage?: string | null;
  durationMs?: number | null;
  updatedAt?: string;
}

export interface BotStatusUpdate {
  leadId: string;
  status: 'Processing' | 'Success' | 'Failed';
  enquiryId?: string;
  errorMessage?: string;
  beforeSubmitScreenshot?: string;
  confirmScreenshot?: string;
  durationMs?: number;
}

export interface TelemetryLog {
  time: string;
  leadId?: string;
  text: string;
  actor: 'SF' | 'SYS' | 'BOT' | 'ORCHESTRATOR';
  type: 'info' | 'success' | 'error';
}
