import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/app/api/db.json');

function readDb() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return jsonParseClean(data);
  } catch (e) {
    return { leads: [] };
  }
}

function writeDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function jsonParseClean(str: string) {
  try {
    return JSON.parse(str);
  } catch (e) {
    // Basic repair if corrupted
    return { leads: [] };
  }
}

// GET: Return all leads / queue statistics
export async function GET() {
  const db = readDb();
  return NextResponse.json(db.leads);
}

// POST: Qualify a lead and add it to queue
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { leadId, showroomCode } = payload;
    
    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    const db = readDb();
    const leadIndex = db.leads.findIndex((l: any) => l.id === leadId);

    if (leadIndex === -1) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Trigger missing field validation
    if (!showroomCode) {
      const errorMsg = "Validation Failed: Required field [Showroom Code] is missing.";
      db.leads[leadIndex].rpaStatus = "Failed";
      db.leads[leadIndex].errorMessage = errorMsg;
      writeDb(db);
      return NextResponse.json({ status: "Failed", message: errorMsg }, { status: 400 });
    }

    // Update status to Queued
    db.leads[leadIndex].rpaStatus = "Queued";
    db.leads[leadIndex].errorMessage = null;
    db.leads[leadIndex].ctdmsId = null;
    writeDb(db);

    return NextResponse.json({
      status: "Queued",
      message: "Lead successfully qualified and added to orchestrator queue.",
      lead: db.leads[leadIndex]
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}