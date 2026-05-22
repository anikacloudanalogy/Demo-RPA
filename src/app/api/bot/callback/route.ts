import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/app/api/db.json');

function readDb() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return { leads: [] };
  }
}

function writeDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadId, status, enquiryId, errorMessage, durationMs } = body;

    if (!leadId || !status) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const db = readDb();
    const leadIndex = db.leads.findIndex((l: any) => l.id === leadId);

    if (leadIndex === -1) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Update lead values
    db.leads[leadIndex].rpaStatus = status;
    if (enquiryId) db.leads[leadIndex].ctdmsId = enquiryId;
    if (errorMessage) db.leads[leadIndex].errorMessage = errorMessage;
    if (durationMs) db.leads[leadIndex].durationMs = durationMs;

    writeDb(db);

    return NextResponse.json({
      status: "UPDATED",
      message: "Lead callback synchronized with transaction ledger.",
      lead: db.leads[leadIndex]
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}