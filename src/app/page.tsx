"use client";

import React, { useState, useEffect, useRef } from 'react';

// --- HARMONIOUS MOCK DATA ---
const DEFAULT_LEADS = [
  {
    id: "SF-LEAD-00891",
    name: "Rahul Sharma",
    mobile: "+91 98102 34567",
    altMobile: "+91 99102 34567",
    city: "New Delhi",
    showroomCode: "DEL-01 (South Delhi)",
    modelInterest: "Toyota Fortuner",
    leadSource: "Google Search",
    financeRequired: true,
    exchangeRequired: false,
    testDriveRequired: true,
    budget: "₹52,0,000",
    rpaStatus: "Success",
    ctdmsId: "ENQ-2026-94821",
    errorMessage: null,
    durationMs: 44800
  },
  {
    id: "SF-LEAD-00892",
    name: "Priya Patel",
    mobile: "+91 98980 12345",
    altMobile: "",
    city: "Ahmedabad",
    showroomCode: "AHM-03 (S.G. Road)",
    modelInterest: "Toyota Innova Hycross",
    leadSource: "Newspaper Ad",
    financeRequired: false,
    exchangeRequired: true,
    testDriveRequired: false,
    budget: "₹32,0,000",
    rpaStatus: "Success",
    ctdmsId: "ENQ-2026-94793",
    errorMessage: null,
    durationMs: 42100
  },
  {
    id: "SF-LEAD-00893",
    name: "Amit Verma",
    mobile: "+91 95600 12344",
    altMobile: "",
    city: "Noida",
    showroomCode: "",
    modelInterest: "Toyota Glanza",
    leadSource: "Referral",
    financeRequired: true,
    exchangeRequired: true,
    testDriveRequired: true,
    budget: "₹9,50,000",
    rpaStatus: "Failed",
    ctdmsId: null,
    errorMessage: "Validation Failed: Required field [Showroom Code] is missing.",
    durationMs: null
  },
  {
    id: "SF-LEAD-00894",
    name: "Vikram Malhotra",
    mobile: "+91 95600 78912",
    altMobile: "+91 98111 22233",
    city: "Gurugram",
    showroomCode: "GUR-02 (Sohna Road)",
    modelInterest: "Toyota Camry Hybrid",
    leadSource: "Facebook Portal",
    financeRequired: true,
    exchangeRequired: true,
    testDriveRequired: true,
    budget: "₹46,0,000",
    rpaStatus: "Idle",
    ctdmsId: null,
    errorMessage: null,
    durationMs: null
  }
];

const INITIAL_LOGS = [
  { time: "14:10:01", leadId: "SF-LEAD-00891", text: "CRM qualification triggered. Published Platform Event SF_Lead_Status_Change_PE__e.", actor: "SF", type: "info" },
  { time: "14:10:02", leadId: "SF-LEAD-00891", text: "BullMQ queue locked job. Pushed transaction to PostgreSQL ledger.", actor: "SYS", type: "info" },
  { time: "14:10:08", leadId: "SF-LEAD-00891", text: "Bot Node 03 successfully initialized browser form entry.", actor: "BOT", type: "info" },
  { time: "14:10:46", leadId: "SF-LEAD-00891", text: "Form entry punch completed. Saved verification screenshots. Returned Enquiry ID: ENQ-2026-94821.", actor: "BOT", type: "success" },
  { time: "14:12:30", leadId: "SF-LEAD-00893", text: "CRM qualification aborted. Validation Failed: Required field [Showroom Code] is missing.", actor: "SYS", type: "error" }
];

export default function Home() {
  // State variables
  const [leads, setLeads] = useState(DEFAULT_LEADS);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [activeLead, setActiveLead] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState("Standby. Awaiting Salesforce qualified events...");
  const [selectedScreenshotType, setSelectedScreenshotType] = useState<string | null>(null);
  const [selectedScreenshotLead, setSelectedScreenshotLead] = useState<any>(null);
  
  // Failure simulation variables
  const [failMode, setFailMode] = useState<string>("none"); // "none", "timeout", "selector"
  const [showWhatsAppAlert, setShowWhatsAppAlert] = useState(false);
  const [whatsAppText, setWhatsAppText] = useState("");
  const [whatsAppLeadId, setWhatsAppLeadId] = useState("");
  
  // Drawer states
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadMobile, setNewLeadMobile] = useState("");
  const [newLeadCity, setNewLeadCity] = useState("Gurugram");
  const [newLeadShowroom, setNewLeadShowroom] = useState("GUR-02 (Sohna Road)");
  const [newLeadModel, setNewLeadModel] = useState("Toyota Innova Hycross");

  // SLA Counter
  const [slaTimeRemaining, setSlaTimeRemaining] = useState(90);
  const slaTimerRef = useRef<any>(null);
  
  // Custom Live Typing state
  const [typingField, setTypingField] = useState<string | null>(null);
  const [typingVal, setTypingVal] = useState<string>("");

  // System statistics
  const totalJobs = leads.length;
  const successJobs = leads.filter(l => l.rpaStatus === "Success").length;
  const failedJobs = leads.filter(l => l.rpaStatus === "Failed").length;
  const successRate = totalJobs ? Math.round((successJobs / (totalJobs - leads.filter(l => l.rpaStatus === "Idle").length)) * 100) : 100;
  const activeQueueCount = leads.filter(l => l.rpaStatus === "Queued" || l.rpaStatus === "Processing").length;

  // Add customized telemetry logger
  const addLog = (text: string, leadId: string, actor: string = "BOT", type: string = "info") => {
    const timeStr = new Date().toLocaleTimeString();
    setLogs(prev => [
      { time: timeStr, leadId, text, actor, type },
      ...prev.slice(0, 49) // Cap logs size
    ]);
  };

  // Launch lead qualification flow
  const handleQualifyLead = async (leadId: string) => {
    if (isProcessing) return;
    
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Simulate callback validation fail (like missing showroom code)
    if (!lead.showroomCode) {
      setLeads(prev => prev.map(l => l.id === leadId ? {
        ...l, 
        rpaStatus: "Failed", 
        errorMessage: "Validation Failed: Required field [Showroom Code] is missing."
      } : l));
      addLog("Job validation failed: Required field [Showroom Code] is missing.", leadId, "SYS", "error");
      return;
    }

    // Set lead status to Queued
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, rpaStatus: "Queued", errorMessage: null } : l));
    addLog(`Lead qualified in CRM. Platform Event published. Added to queue.`, leadId, "SF", "info");

    // Initiate SLA counter
    setSlaTimeRemaining(90);
    clearInterval(slaTimerRef.current);
    slaTimerRef.current = setInterval(() => {
      setSlaTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(slaTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Trigger process punching sequence
    setTimeout(() => {
      runAutomationPunch(lead);
    }, 2000);
  };

  // Primary Simulated Playwright punching flow
  const runAutomationPunch = (lead: any) => {
    setIsProcessing(true);
    setActiveLead(lead);
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, rpaStatus: "Processing" } : l));
    addLog(`Bot Agent Node 03 locked lead transaction from active queue.`, lead.id, "SYS", "info");

    const sequence = [
      { prg: 10, text: "Launching headless Google Chrome (PID 84920)...", field: null, val: "" },
      { prg: 20, text: "Navigating to legacy CTDMS login portal...", field: null, val: "" },
      { prg: 30, text: "Logging in with dealership account srv_toyota_del@galaxy.toyota.com...", field: "Username", val: "srv_toyota_del" },
      { prg: 40, text: "Authentication successful. Accessing 'New Enquiry Form' module...", field: null, val: "" },
      { prg: 50, text: `Typing form elements: CustomerName => "${lead.name}"`, field: "CustomerName", val: lead.name },
      { prg: 65, text: `Typing contact keys: MobileNo => "${lead.mobile}"`, field: "MobileNo", val: lead.mobile },
      { prg: 75, text: `Selecting showroom configuration dropdown...`, field: "ShowroomCode", val: lead.showroomCode },
      { prg: 80, text: `Ticking check-list metrics: Finance => ${lead.financeRequired}, Trade-In => ${lead.exchangeRequired}`, field: "FinanceRequired", val: "Checked" },
      { prg: 90, text: `[Compliance] Captured pre-submission verification screenshot. Clicking #submit.`, field: null, val: "" }
    ];

    sequence.forEach((step, index) => {
      setTimeout(() => {
        setProcessingProgress(step.prg);
        setCurrentStepText(step.text);
        setTypingField(step.field);
        setTypingVal(step.val);
        addLog(step.text, lead.id, "BOT", "info");
      }, index * 1600);
    });

    // Complete transaction
    setTimeout(() => {
      clearInterval(slaTimerRef.current);
      
      if (failMode === "timeout") {
        // Trigger simulated timeout error
        setLeads(prev => prev.map(l => l.id === lead.id ? { 
          ...l, 
          rpaStatus: "Failed", 
          errorMessage: "Gateway Timeout: CTDMS Server failed to respond within 15 seconds." 
        } : l));
        addLog(`❌ RPA Transaction Timeout: CTDMS Server failed to respond.`, lead.id, "BOT", "error");
        
        // Trigger WhatsApp warning escalation
        setWhatsAppText(`⚠️ RPA CRITICAL FAILURE: Gateway Timeout detected on Toyota CTDMS showroom punching portal. Job ID: ${lead.id} (${lead.name}). Recovery SLA: 4 hours.`);
        setWhatsAppLeadId(lead.id);
        setShowWhatsAppAlert(true);
        setIsProcessing(false);
        setActiveLead(null);
      } else if (failMode === "selector") {
        // Trigger simulated UI selector changed error
        setLeads(prev => prev.map(l => l.id === lead.id ? { 
          ...l, 
          rpaStatus: "Failed", 
          errorMessage: "DOM Exception: Selector button#btnSubmitEnquiry was not found on active page." 
        } : l));
        addLog(`❌ RPA DOM Error: Selector #btnSubmitEnquiry not found on page. Portal layout modification suspected.`, lead.id, "BOT", "error");
        
        // Trigger WhatsApp alert
        setWhatsAppText(`🚨 RPA CRITICAL ERROR: Selector #btnSubmitEnquiry not found on Toyota CTDMS. Portal UI has changed! Lead ID: ${lead.id}. Urgent IT restoration required!`);
        setWhatsAppLeadId(lead.id);
        setShowWhatsAppAlert(true);
        setIsProcessing(false);
        setActiveLead(null);
      } else {
        // Success path
        const generatedId = "ENQ-2026-" + Math.floor(100000 + Math.random() * 900000);
        setLeads(prev => prev.map(l => l.id === lead.id ? { 
          ...l, 
          rpaStatus: "Success", 
          ctdmsId: generatedId,
          durationMs: 90 - slaTimeRemaining
        } : l));
        addLog(`🎉 CTDMS Enquiry successfully written back: ${generatedId}`, lead.id, "BOT", "success");
        addLog(`Salesforce Lead records patched successfully. Status written back to CRM.`, lead.id, "SYS", "success");
        setIsProcessing(false);
        setActiveLead(null);
      }
    }, sequence.length * 1600);
  };

  // Add custom new lead creation
  const handleAddNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadMobile) return;

    const newId = "SF-LEAD-00" + (890 + leads.length + 1);
    const newLead = {
      id: newId,
      name: newLeadName,
      mobile: newLeadMobile,
      altMobile: "",
      city: newLeadCity,
      showroomCode: newLeadShowroom,
      modelInterest: newLeadModel,
      leadSource: "Direct CRM Walkin",
      financeRequired: true,
      exchangeRequired: false,
      testDriveRequired: true,
      budget: "₹24,0,000",
      rpaStatus: "Idle",
      ctdmsId: null,
      errorMessage: null,
      durationMs: null
    };

    setLeads(prev => [...prev, newLead]);
    addLog(`New lead ${newId} (${newLeadName}) registered in Salesforce Lightning.`, newId, "SF", "info");
    
    // Clear drawer inputs
    setNewLeadName("");
    setNewLeadMobile("");
    setShowNewLeadModal(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* --- HEADER TITLE SYSTEM --- */}
      <header className="flex justify-between items-center glass-card p-4 border-l-4 border-l-red-500">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-xs uppercase text-red-500 font-bold tracking-wider">Galaxy Showroom Group</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Toyota CTDMS Auto-Punch RPA Orchestrator</h1>
          <p className="text-xs text-slate-400">Production-grade client simulator demonstrating automated Salesforce CRM to Toyota DMS event synchronization.</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-xs text-slate-400">Playwright Node Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold text-emerald-500 uppercase">Worker Node 03 (Active)</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- FLOATING ESCALATION ALERTS (WhatsApp) --- */}
      {showWhatsAppAlert && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex justify-between items-start gap-4 animate-bounce">
          <div className="flex gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-500 text-lg">⚠️</div>
            <div>
              <h4 className="text-sm font-bold text-red-500 uppercase tracking-wide">Critical Infrastructure SLA Escalation</h4>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">{whatsAppText}</p>
              <div className="flex gap-4 items-center mt-3 text-[10px] text-slate-400">
                <span>Receiver: <strong>Santosh Sir (IT Director)</strong></span>
                <span>•</span>
                <span>Countdown Remaining: <strong className="text-red-400 animate-pulse">03h 59m 42s</strong></span>
              </div>
            </div>
          </div>
          <button 
            className="text-xs text-slate-400 hover:text-white bg-slate-800/40 px-3 py-1 rounded-md border border-slate-700"
            onClick={() => setShowWhatsAppAlert(false)}
          >
            Acknowledge Incident
          </button>
        </div>
      )}

      {/* --- MIDDLE TELEMETRY ANALYTICS GRID --- */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="glass-card p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">TOTAL QUEUED JOBS</span>
          <div className="flex justify-between items-end mt-2">
            <span className="text-3xl font-extrabold text-white">{totalJobs}</span>
            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">BullMQ Active</span>
          </div>
        </div>

        <div className="glass-card p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">SLA SUCCESS RATE</span>
          <div className="flex justify-between items-end mt-2">
            <span className="text-3xl font-extrabold text-emerald-500">{successRate}%</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">SLA Met</span>
          </div>
        </div>

        <div className="glass-card p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">ACTIVE BOT CHANNELS</span>
          <div className="flex justify-between items-end mt-2">
            <span className="text-3xl font-extrabold text-white">01 <span className="text-xs font-normal text-slate-400">/ 03</span></span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Node-03 Active</span>
          </div>
        </div>

        <div className="glass-card p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">FAILED OPERATIONS</span>
          <div className="flex justify-between items-end mt-2">
            <span className="text-3xl font-extrabold text-red-500">{failedJobs}</span>
            <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Retries Handled</span>
          </div>
        </div>

      </section>

      {/* --- CORE DOUBLE COLUMNS: CRM SIMULATOR AND BOT ENGINE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- LEFT COL (7 SPAN): SALESFORCE CRM LIGHTNING SIMULATOR --- */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          
          <div className="glass-card p-4 flex-1 flex flex-col gap-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  Salesforce Lightning CRM Simulator
                </h3>
                <p className="text-xs text-slate-400">Simulates dealer leads qualified by CRM Executives.</p>
              </div>
              <button 
                className="bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold px-3 py-1.5 rounded transition border border-indigo-400/20"
                onClick={() => setShowNewLeadModal(true)}
              >
                + Register New CRM Lead
              </button>
            </div>

            {/* CRM Lead List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 font-semibold">
                    <th className="py-2 px-3">Lead ID</th>
                    <th className="py-2 px-3">Customer Name</th>
                    <th className="py-2 px-3">Model Preference</th>
                    <th className="py-2 px-3">Showroom</th>
                    <th className="py-2 px-3">RPA Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-800/20 transition">
                      <td className="py-3 px-3 font-mono text-slate-400 font-semibold">{lead.id}</td>
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-bold text-white">{lead.name}</p>
                          <p className="text-[10px] text-slate-400">{lead.mobile}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-medium">{lead.modelInterest}</td>
                      <td className="py-3 px-3 text-slate-400">{lead.showroomCode || <span className="text-red-500 font-semibold">Missing Code</span>}</td>
                      <td className="py-3 px-3">
                        <span className={`badge badge-${lead.rpaStatus.toLowerCase()}`}>
                          {lead.rpaStatus === "Success" && lead.ctdmsId ? `Written (${lead.ctdmsId})` : lead.rpaStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex gap-2 justify-end">
                          {lead.rpaStatus === "Success" && (
                            <button 
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-1.5 rounded border border-emerald-500/25 text-[10px] px-2 font-semibold"
                              onClick={() => {
                                setSelectedScreenshotLead(lead);
                                setSelectedScreenshotType("confirm");
                              }}
                            >
                              📷 View Screenshot
                            </button>
                          )}
                          {lead.rpaStatus === "Idle" && (
                            <button 
                              className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded transition text-[10px]"
                              disabled={isProcessing}
                              onClick={() => handleQualifyLead(lead.id)}
                            >
                              Qualify & Auto-Punch
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Real-time Telemetry logs console */}
          <div className="glass-card p-4 h-[240px] flex flex-col">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Real-time Operations Telemetry Logs</h4>
            <div className="flex-1 bg-slate-950/60 rounded border border-slate-900 p-3 font-mono text-[10px] overflow-y-auto flex flex-col-reverse gap-2">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 items-start border-l-2 border-slate-800 pl-2">
                  <span className="text-slate-500">[{log.time}]</span>
                  <span className="text-indigo-400 font-semibold">[{log.actor}]</span>
                  <span className={`flex-1 ${
                    log.type === 'error' ? 'text-red-400 font-bold' : 
                    log.type === 'success' ? 'text-emerald-400 font-bold' : 'text-slate-300'
                  }`}>{log.text}</span>
                  {log.leadId && <span className="text-slate-500 bg-slate-900 px-1 rounded">{log.leadId}</span>}
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* --- RIGHT COL (5 SPAN): HEADLESS CHROME SIMULATOR PANE --- */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Visual Playwright Browser Viewport Simulator */}
          <div className={`glass-card p-4 flex-1 flex flex-col gap-4 ${isProcessing ? 'pulse-success' : 'border-slate-800'}`}>
            
            <div className="pb-3 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Headless Chrome Visualizer (PID 84920)</h3>
                <p className="text-[10px] text-slate-400">Interactive simulation of live selector inputs typing.</p>
              </div>
              {isProcessing && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded animate-pulse">PUNCHING ACTIVE</span>
              )}
            </div>

            {/* Simulated Toyota CTDMS GUI screen */}
            <div className="flex-1 bg-[#1e293b] rounded-lg border border-slate-700 overflow-hidden flex flex-col min-h-[300px]">
              
              {/* Chrome Top URL Bar */}
              <div className="bg-[#0f172a] p-2 flex items-center gap-2 border-b border-slate-700">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="flex-1 bg-slate-800 rounded px-2 py-0.5 text-[9px] text-slate-400 font-mono overflow-hidden whitespace-nowrap">
                  {isProcessing && processingProgress >= 20 ? 'https://ctdms.toyota.co.in/enquiry/new' : 'http://localhost:3000/ctdms/login'}
                </div>
              </div>

              {/* CTDMS Simulation GUI Form */}
              <div className="flex-1 p-4 bg-[#f8fafc] text-slate-900 flex flex-col justify-between font-sans relative">
                
                {/* Loader Overlay when loading page */}
                {isProcessing && processingProgress < 40 && (
                  <div className="absolute inset-0 bg-slate-950/80 text-white flex flex-col justify-center items-center gap-3">
                    <span className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">{currentStepText}</span>
                  </div>
                )}

                {/* Legacy DMS Portal layout */}
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#ec1d24] mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-4 w-4 bg-[#ec1d24] flex items-center justify-center text-[10px] text-white font-bold rounded-sm">T</span>
                      <span className="text-xs font-extrabold text-slate-900 tracking-tight">TOYOTA CTDMS PORTAL</span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">SHOWROOM CONSOLE</span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-800 mb-4 border-b border-slate-200 pb-1 flex justify-between">
                    <span>New Lead Enquiry Registration</span>
                    <span className="text-[9px] text-slate-400">DOM Form: form#enquiryForm</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-bold text-slate-500">Customer Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className={`border px-2 py-1 rounded text-slate-800 ${typingField === "CustomerName" ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
                        placeholder="input[id='CustomerName']"
                        value={typingField === "CustomerName" ? typingVal : (activeLead ? activeLead.name : '')}
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-bold text-slate-500">Primary Mobile <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className={`border px-2 py-1 rounded text-slate-800 ${typingField === "MobileNo" ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                        placeholder="input[id='MobileNo']"
                        value={typingField === "MobileNo" ? typingVal : (activeLead ? activeLead.mobile : '')}
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-bold text-slate-500">Dealer Showroom Code <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className={`border px-2 py-1 rounded text-slate-800 ${typingField === "ShowroomCode" ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                        placeholder="input[id='ShowroomCode']"
                        value={activeLead ? activeLead.showroomCode : ''}
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-bold text-slate-500">Model Interest <span className="text-red-500">*</span></label>
                      <select 
                        className="border px-2 py-1 rounded border-slate-300 text-slate-800"
                        disabled
                      >
                        <option>{activeLead ? activeLead.modelInterest : 'select[id="ModelPreference"]'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-4 text-[9px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={activeLead ? activeLead.financeRequired : false} disabled />
                      <span>Finance Required</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={activeLead ? activeLead.exchangeRequired : false} disabled />
                      <span>Exchange Valuer</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={activeLead ? activeLead.testDriveRequired : false} disabled />
                      <span>Test Drive Request</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center border-t border-slate-200 pt-3">
                  <div className="text-[9px] text-slate-400">
                    {activeLead && <span className="text-emerald-600 font-bold">✓ Form fields verified</span>}
                  </div>
                  <button 
                    className="bg-[#ec1d24] text-white font-bold text-[10px] px-4 py-1.5 rounded border border-[#c1151a]"
                    disabled
                  >
                    Submit Enquiry Details
                  </button>
                </div>

              </div>

            </div>

            {/* SLA countdown timer display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/60 rounded border border-slate-800/80 p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-medium">SLA TIMELINE GAUGE</span>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-2xl font-bold font-mono text-indigo-400">{slaTimeRemaining}s <span className="text-xs font-normal text-slate-400">/ 90s</span></span>
                  <div className="h-6 w-12 bg-slate-800 rounded-sm overflow-hidden flex items-end">
                    <div className="w-full bg-indigo-500 transition-all duration-1000" style={{ height: `${(slaTimeRemaining / 90) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/60 rounded border border-slate-800/80 p-3 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-medium">AUTOMATION FAULT CENTER</span>
                <select 
                  className="bg-slate-950 border border-slate-800 text-[10px] rounded p-1 text-slate-300 focus:outline-none focus:border-red-500 mt-2"
                  value={failMode}
                  onChange={(e) => setFailMode(e.target.value)}
                >
                  <option value="none">🟢 Operational Sync (Success)</option>
                  <option value="timeout">🔴 Portal Timeout Fault (SLA Breach)</option>
                  <option value="selector">🔴 DOM Element Selector Altered</option>
                </select>
              </div>
            </div>

          </div>

        </section>

      </div>

      {/* --- CREATE LEAD MODAL DRAWER --- */}
      {showNewLeadModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Create New Salesforce Lead</h3>
              <p className="text-xs text-slate-400">Simulates registering a showroom walk-in lead.</p>
            </div>
            
            <form onSubmit={handleAddNewLead} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Customer Full Name</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Vikram Malhotra" 
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Contact Phone Number</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. +91 95600 78912" 
                  value={newLeadMobile}
                  onChange={(e) => setNewLeadMobile(e.target.value)}
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Showroom Location</label>
                  <select 
                    className="glass-input"
                    value={newLeadShowroom}
                    onChange={(e) => setNewLeadShowroom(e.target.value)}
                  >
                    <option value="GUR-02 (Sohna Road)">Gurugram (Sohna Road)</option>
                    <option value="DEL-01 (South Delhi)">Delhi (Okhla)</option>
                    <option value="AHM-03 (S.G. Road)">Ahmedabad (S.G. Road)</option>
                    <option value="">(Simulate Missing Code Error)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Model Preference</label>
                  <select 
                    className="glass-input"
                    value={newLeadModel}
                    onChange={(e) => setNewLeadModel(e.target.value)}
                  >
                    <option value="Toyota Camry Hybrid">Camry Hybrid</option>
                    <option value="Toyota Fortuner">Fortuner</option>
                    <option value="Toyota Innova Hycross">Innova Hycross</option>
                    <option value="Toyota Glanza">Glanza</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
                <button 
                  type="button" 
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded"
                  onClick={() => setShowNewLeadModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded"
                >
                  Register Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- COMPLIANCE SCREENSHOT VIEWER MODAL --- */}
      {selectedScreenshotType && selectedScreenshotLead && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-4xl w-full flex flex-col gap-4">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">RPA Compliance Screenshot Verification</h3>
                <p className="text-xs text-slate-400">Captured by Playwright Headless Chrome inside showroom network. Lead: <strong>{selectedScreenshotLead.name} ({selectedScreenshotLead.id})</strong></p>
              </div>
              <button 
                className="text-slate-400 hover:text-white bg-slate-800 px-3 py-1 rounded border border-slate-700 text-xs"
                onClick={() => {
                  setSelectedScreenshotType(null);
                  setSelectedScreenshotLead(null);
                }}
              >
                Close Proof Viewer
              </button>
            </div>

            <div className="flex gap-4 mb-2">
              <button 
                className={`text-xs font-semibold px-4 py-2 rounded transition ${selectedScreenshotType === 'confirm' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                onClick={() => setSelectedScreenshotType('confirm')}
              >
                ✓ Confirmation Invoice Screenshot
              </button>
              <button 
                className={`text-xs font-semibold px-4 py-2 rounded transition ${selectedScreenshotType === 'before' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                onClick={() => setSelectedScreenshotType('before')}
              >
                ✓ Form Fields Pre-Submit Screenshot
              </button>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950 flex flex-col items-center justify-center min-h-[400px] p-6 relative">
              
              {/* Top Screenshot Header */}
              <div className="w-full flex justify-between text-[10px] text-slate-400 bg-slate-900 p-2 rounded mb-4 border border-slate-800/80 font-mono">
                <span>File Path: <strong>s3://toyota-rpa-screenshots/{selectedScreenshotLead.id}_{selectedScreenshotType === 'confirm' ? 'success_confirm' : 'before_submit'}.png</strong></span>
                <span>Captured: <strong>{new Date().toLocaleDateString()}</strong></span>
              </div>

              {/* Simulated captured browser screenshot layout */}
              <div className="w-full max-w-2xl bg-white text-slate-900 p-8 rounded-lg shadow-2xl relative font-sans">
                
                {/* Confirmation Receipt View */}
                {selectedScreenshotType === 'confirm' ? (
                  <div className="flex flex-col gap-6 items-center py-6">
                    <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 text-3xl">✓</div>
                    <div className="text-center">
                      <h3 className="text-xl font-extrabold text-slate-900">TOYOTA DMS ENQUIRY SUCCESSFULLY CREATED</h3>
                      <p className="text-xs text-slate-500 mt-1">Transaction recorded on dealership gateway DEL-01-NET</p>
                    </div>
                    <div className="w-full bg-slate-50 rounded border p-4 text-xs grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Enquiry ID Reference</p>
                        <p className="text-base font-extrabold text-indigo-600 mt-1">{selectedScreenshotLead.ctdmsId}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Customer Profile Name</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">{selectedScreenshotLead.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Location</p>
                        <p className="text-sm font-semibold text-slate-800 mt-1">{selectedScreenshotLead.showroomCode}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">SLA Processing Time</p>
                        <p className="text-sm font-semibold text-slate-800 mt-1">{selectedScreenshotLead.durationMs ? `${selectedScreenshotLead.durationMs} seconds` : '46.2 seconds'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Pre-submission Form Entry Screenshot
                  <div>
                    <h3 className="text-sm font-extrabold text-[#ec1d24] pb-2 border-b mb-4 flex justify-between">
                      <span>TOYOTA DEALER MANAGEMENT GATEWAY</span>
                      <span className="text-[9px] text-slate-400">Pre-Submit Audit Proof</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold">CUSTOMER FULL NAME</p>
                        <p className="text-xs text-slate-900 border px-2 py-1 rounded bg-slate-50 mt-1 font-semibold">{selectedScreenshotLead.name}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold">CONTACT MOBILE NUMBER</p>
                        <p className="text-xs text-slate-900 border px-2 py-1 rounded bg-slate-50 mt-1 font-semibold">{selectedScreenshotLead.mobile}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold">SHOWROOM RECRUITMENT CODE</p>
                        <p className="text-xs text-slate-900 border px-2 py-1 rounded bg-slate-50 mt-1 font-semibold">{selectedScreenshotLead.showroomCode}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold">VEHICLE CATALOG INTEREST</p>
                        <p className="text-xs text-slate-900 border px-2 py-1 rounded bg-slate-50 mt-1 font-semibold">{selectedScreenshotLead.modelInterest}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
