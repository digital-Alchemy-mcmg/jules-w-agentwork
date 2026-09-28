import React, { useState } from 'react';
import { RawJobInput } from '../types/scout';
import { Play, Sparkles, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface LiveIngestViewProps {
  onIngest: (job: RawJobInput) => Promise<void>;
  isProcessing: boolean;
  onOpenEnvelope: (envId: string) => void;
  lastIngestedEnvelopeId?: string;
}

const CLEANROOM_SAMPLE_JOB: RawJobInput = {
  id: "JOB-LIVE-001",
  title: "Manufacturing Operations Shift Supervisor",
  company: "Apex Precision Dynamics",
  location: "Auburn Hills, MI 48326",
  minSalary: "$68,000",
  maxSalary: "$78,000",
  payType: "Salary",
  employmentType: "Full-time",
  keyBenefits: "401(k) 5% Match, Blue Cross Blue Shield Health Insurance, Paid Time Off, Dental & Vision Coverage",
  applicationStatus: "Not Applied",
  sourceUrl: "https://careers.apexprecision.com/jobs/mfg-sup-48326",
  vendor: "Direct Employer Career Portal",
  notes: "2nd Shift (3:00 PM - 11:30 PM), Monday to Friday, overtime available",
  rawSourceText: `Manufacturing Operations Shift Supervisor
Apex Precision Dynamics — Auburn Hills, MI 48326
Full-time | $68,000 - $78,000 per year

About the Opportunity:
Join our growing family and dynamic workplace in Auburn Hills! We are looking for a rockstar leader to supervise our high-precision CNC manufacturing operations on second shift.

Key Responsibilities:
• Supervise 25+ precision machining technicians and assembly operators on 2nd shift (3:00 PM to 11:30 PM).
• Ensure shift production targets, scrap reduction metrics, and ISO 9001 compliance standards are achieved.
• Conduct daily pre-shift safety huddles and machine clearance audits.
• Manage shift labor allocation and approve overtime in Kronos timekeeping.
• Coordinate with plant maintenance to execute rapid tool changeovers and minimize spindle downtime.
• Responsible for OSHA incident logging and initial investigation within 24 hours.

Schedule & Working Conditions:
• Monday through Friday, 3:00 PM - 11:30 PM.
• Occasional mandatory Saturday production runs based on automotive OEM delivery schedules.
• Climate-controlled machining facility; steel-toe boots and safety glasses required on floor.
• Must be able to stand and walk on concrete floors up to 8 hours per shift; lift up to 45 pounds.

Qualifications & Experience:
• 3+ years supervisory or team leadership experience in a precision manufacturing, automotive supplier, or industrial plant environment.
• Associate degree in industrial technology or high school diploma with equivalent technical leadership background.
• Demonstrated proficiency with CNC machining workflows, blueprint reading, and SPC quality inspection.
• Strong communication and de-escalation skills; bilingual Spanish is a plus.`
};

export const LiveIngestView: React.FC<LiveIngestViewProps> = ({
  onIngest,
  isProcessing,
  onOpenEnvelope,
  lastIngestedEnvelopeId
}) => {
  const [jobId, setJobId] = useState('JOB-LIVE-001');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Novi, MI 48377');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [payType, setPayType] = useState('Salary');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [sourceUrl, setSourceUrl] = useState('');
  const [vendor, setVendor] = useState('Direct');
  const [notes, setNotes] = useState('');
  const [rawSourceText, setRawSourceText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleLoadSample = () => {
    setJobId(CLEANROOM_SAMPLE_JOB.id);
    setTitle(CLEANROOM_SAMPLE_JOB.title);
    setCompany(CLEANROOM_SAMPLE_JOB.company);
    setLocation(CLEANROOM_SAMPLE_JOB.location);
    setMinSalary(CLEANROOM_SAMPLE_JOB.minSalary || '');
    setMaxSalary(CLEANROOM_SAMPLE_JOB.maxSalary || '');
    setPayType(CLEANROOM_SAMPLE_JOB.payType);
    setEmploymentType(CLEANROOM_SAMPLE_JOB.employmentType);
    setSourceUrl(CLEANROOM_SAMPLE_JOB.sourceUrl || '');
    setVendor(CLEANROOM_SAMPLE_JOB.vendor || '');
    setNotes(CLEANROOM_SAMPLE_JOB.notes || '');
    setRawSourceText(CLEANROOM_SAMPLE_JOB.rawSourceText);
    setValidationError(null);
  };

  const handleClear = () => {
    setJobId(`JOB-LIVE-${Math.floor(100 + Math.random() * 900)}`);
    setTitle('');
    setCompany('');
    setLocation('Novi, MI 48377');
    setMinSalary('');
    setMaxSalary('');
    setPayType('Salary');
    setEmploymentType('Full-time');
    setSourceUrl('');
    setVendor('Direct');
    setNotes('');
    setRawSourceText('');
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError("Job Title is required.");
      return;
    }
    if (!company.trim()) {
      setValidationError("Company / Employer name is required.");
      return;
    }
    if (!rawSourceText.trim()) {
      setValidationError("Raw Job Description text is required. Scout strictly halts if raw text is absent.");
      return;
    }

    setValidationError(null);

    const input: RawJobInput = {
      id: jobId.trim() || `JOB-LIVE-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      company: company.trim(),
      location: location.trim() || "MI",
      minSalary: minSalary.trim(),
      maxSalary: maxSalary.trim(),
      payType,
      employmentType,
      sourceUrl: sourceUrl.trim() || `https://scout-intake.internal/jobs/${jobId.toLowerCase()}`,
      vendor: vendor.trim() || "Direct Ingestion",
      notes: notes.trim(),
      rawSourceText: rawSourceText.trim()
    };

    await onIngest(input);
  };

  return (
    <div className="space-y-6">
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-6 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span>UNFILTERED LIVE INGESTION</span>
              <span className="text-slate-600"> </span>
              <span className="text-emerald-400">AUTHENTIC WEB CRYPTO SHA-256</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100 mt-1">
              Live Job Ingestion & Transformation Engine
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ingest messy, un-calibrated live job descriptions directly from the web. Scout preserves the verbatim source text with real SHA-256 hashing, applies the 12-rule atomic decomposition, and emits a verified Traveling Envelope v0.2.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-800/60 rounded hover:bg-cyan-900/40 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Cleanroom Test Sample</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Clear Fields
            </button>
          </div>
        </div>

        {validationError && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{validationError}</span>
          </div>
        )}

        {lastIngestedEnvelopeId && (
          <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ingested & Sealed Envelope: <strong>{lastIngestedEnvelopeId}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => onOpenEnvelope(lastIngestedEnvelopeId)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-900 bg-cyan-400 rounded hover:bg-cyan-300 transition-colors cursor-pointer"
            >
              Inspect Envelope
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Job Identifier</label>
              <input
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="JOB-LIVE-001"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Job Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Plant Operations Supervisor"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Company / Employer *</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Precision Dynamics Corp"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State or ZIP"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Min Salary / Rate</label>
              <input
                type="text"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                placeholder="$65,000"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Max Salary / Rate</label>
              <input
                type="text"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                placeholder="$80,000"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Pay Type</label>
              <select
                value={payType}
                onChange={(e) => setPayType(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="Salary">Salary</option>
                <option value="Hourly">Hourly</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Source URL / Link</label>
              <input
                type="text"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://company.com/careers/job123"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Shift / Operating Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 2nd shift (3 PM - 11:30 PM), Monday to Friday"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Raw Unedited Job Posting Text * (Section 8 Input)
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                {rawSourceText.length} characters
              </span>
            </div>
            <textarea
              value={rawSourceText}
              onChange={(e) => setRawSourceText(e.target.value)}
              rows={10}
              placeholder="Paste the complete, raw, unedited job description prose directly from the web here..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 leading-relaxed"
              required
            />
            <span className="text-[11px] text-slate-500 italic mt-1 block">
              Section 8 Rule: Complete source text is hashed with authentic SHA-256 and sealed inside the envelope. Downstream stages consume this text directly with zero metadata fabrication.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-slate-900" />
              <span>{isProcessing ? "Processing Live Ingestion..." : "Execute Scout Ingestion"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
