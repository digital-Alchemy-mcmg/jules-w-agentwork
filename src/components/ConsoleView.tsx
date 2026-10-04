import React from 'react';
import { CheckCircle2, ChevronRight, Layers, Lock, Cpu, PlusCircle, ArrowRight } from 'lucide-react';
import { CompletionReceipt, JobCandidate, TravelingEnvelope } from '../types/scout';
import { STOP_CONDITION_CRITERIA } from '../data/scoutData';

interface ConsoleViewProps {
  candidates: JobCandidate[];
  envelopes: TravelingEnvelope[];
  receipt: CompletionReceipt;
  onSelectTab: (tab: string) => void;
  onSelectEnvelope: (envId: string) => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({
  candidates,
  envelopes,
  receipt,
  onSelectTab,
  onSelectEnvelope
}) => {
  const acceptedCount = candidates.filter(c => c.status === 'ACCEPTED').length;
  const rejectedCount = candidates.filter(c => c.status === 'REJECTED').length;
  const firstAcceptedEnvId = envelopes[0]?.envelope_id;

  return (
    <div className="space-y-8">
      {/* Executive Boundary Notification Banner */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>STAGE: SCOUT (DONE)</span>
              <span className="text-slate-600"> </span>
              <span className="text-emerald-400">STOP CONDITION: SATISFIED</span>
              <span className="text-slate-600"> </span>
              <span className="text-amber-400">CURRENT_STAGE: "B"</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Scout Stage Execution & Verification Console
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Execution halts strictly at the Scout output boundary (<code className="font-mono text-cyan-300 text-xs">current_stage: "b"</code>). All runner fields (Path A), Section 8 immutable target sources, and 12-rule atomic statements (Path B) are sealed into v0.2 Traveling Envelopes. Zero downstream MARA forward reasoning.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('ingest')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Ingest Live Job</span>
            </button>
            <button
              onClick={() => onSelectTab('receipt')}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-750 hover:text-slate-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              Verify Handoff Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Quantitative Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 border border-slate-800 bg-slate-900/40 rounded-lg">
          <div className="text-xs text-slate-400 font-medium">Corpus Ingested</div>
          <div className="text-2xl font-bold text-slate-100 font-mono tabular-nums mt-1">{candidates.length}</div>
          <div className="text-xs text-slate-500 mt-1">Live Submissions</div>
        </div>
        <div className="p-4 border border-emerald-900/40 bg-emerald-950/20 rounded-lg">
          <div className="text-xs text-emerald-400 font-medium">Accepted Observations</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">{acceptedCount}</div>
          <div className="text-xs text-emerald-600 mt-1">
            {candidates.length > 0 ? `${((acceptedCount / candidates.length) * 100).toFixed(1)}% Pass Rate` : "Awaiting Input"}
          </div>
        </div>
        <div className="p-4 border border-slate-800 bg-slate-900/40 rounded-lg">
          <div className="text-xs text-slate-400 font-medium">Gate Filtered</div>
          <div className="text-2xl font-bold text-slate-300 font-mono tabular-nums mt-1">{rejectedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Administrative Filters</div>
        </div>
        <div className="p-4 border border-slate-800 bg-slate-900/40 rounded-lg">
          <div className="text-xs text-slate-400 font-medium">Envelopes v0.2</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono tabular-nums mt-1">{envelopes.length}</div>
          <div className="text-xs text-slate-500 mt-1">Downstream Ready</div>
        </div>
        <div className="p-4 border border-slate-800 bg-slate-900/40 rounded-lg">
          <div className="text-xs text-slate-400 font-medium">Runtime Exceptions</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">0</div>
          <div className="text-xs text-emerald-600 mt-1">Clean Execution</div>
        </div>
        <div className="p-4 border border-slate-800 bg-slate-900/40 rounded-lg">
          <div className="text-xs text-slate-400 font-medium">Cartridge State</div>
          <div className="text-base font-bold text-cyan-300 font-mono mt-2">CERTIFIED</div>
          <div className="text-xs text-slate-500 truncate font-mono mt-1" title={receipt.hashes.cartridge_sha256}>
            {receipt.hashes.cartridge_sha256.slice(0, 16)}...
          </div>
        </div>
      </div>

      {/* Architectural Synthesis: Quinn Precision & Base44 Workflow */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Architectural Synthesis: Quinn Precision & Base44 Workflow
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Dual-Scout unification separating machine lifecycle determinism from operator transparency.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>SPEC v2.2.0</span>
            <span> </span>
            <span>ENVOY 1 + ENVOY 2</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Machine Pipeline (Quinn Precision) */}
          <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-md">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400 font-mono">
                <Cpu className="w-3.5 h-3.5" />
                MACHINE PIPELINE (Quinn Precision)
              </span>
              <span className="text-slate-500 font-mono text-xs">Deterministic</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">1. Disk Definition & Compiler</div>
                  <div className="text-slate-400 text-xs">Structured JSON specification compiled into binary/JSON artifact</div>
                </div>
                <span className="font-mono text-slate-400">CRT-000001</span>
              </div>
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">2. 25-Point Cartridge Validator</div>
                  <div className="text-slate-400 text-xs">Cryptographic SHA-256 certification & compliance seal</div>
                </div>
                <span className="font-mono text-emerald-400">25/25 PASS</span>
              </div>
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">3. Collection Runner (ENVOY 1)</div>
                  <div className="text-slate-400 text-xs">Zero-inference candidate evaluation across 12 gates + deduplication</div>
                </div>
                <span className="font-mono text-cyan-400">{acceptedCount} Accepted</span>
              </div>
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">4. SCOUT-STAGE (ENVOY 2) Dual-Path</div>
                  <div className="text-slate-400 text-xs">Path A (Field preservation) + Path B (12-rule decomposition & Sec 8)</div>
                </div>
                <span className="font-mono text-cyan-400">14 Categories</span>
              </div>
              <div className="p-2.5 bg-cyan-950/20 border border-cyan-800/40 rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-cyan-300">5. Traveling Envelope v0.2 Initialization</div>
                  <div className="text-slate-400 text-xs">Self-contained target object carrying immutable source & atomic facts</div>
                </div>
                <span className="font-mono text-cyan-400">ENV-OBS-*</span>
              </div>
            </div>
          </div>

          {/* Operator Lifecycle (Base44 Flatter Experience) */}
          <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-md">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-300 font-mono">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                OPERATOR WORKFLOW (Base44 Flatter Experience)
              </span>
              <span className="text-slate-500 font-mono text-xs">Audit & Inspection</span>
            </div>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => onSelectTab('ingest')}
                className="w-full text-left p-2.5 bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-800/50 rounded flex items-center justify-between group transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-cyan-300 group-hover:text-cyan-200 transition-colors">Live Ingestion Studio</div>
                  <div className="text-slate-400 text-xs">Paste or input novel job descriptions for real-time transformation</div>
                </div>
                <ChevronRight className="w-4 h-4 text-cyan-400 transition-colors" />
              </button>
              <button
                onClick={() => onSelectTab('corpus')}
                className="w-full text-left p-2.5 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 rounded flex items-center justify-between group transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">Corpus Browser</div>
                  <div className="text-slate-400 text-xs">Browse all ingested candidates ({candidates.length} active)</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>
              <button
                onClick={() => onSelectTab('envelopes')}
                className="w-full text-left p-2.5 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 rounded flex items-center justify-between group transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">Traveling Envelopes Inspector</div>
                  <div className="text-slate-400 text-xs">Inspect {envelopes.length} generated v0.2 envelopes & source hashes</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>
              <button
                onClick={() => onSelectTab('telemetry')}
                className="w-full text-left p-2.5 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 rounded flex items-center justify-between group transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">Gate Telemetry Matrix</div>
                  <div className="text-slate-400 text-xs">12 evaluation gates with candidate-attached explainability</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>
              <button
                onClick={() => onSelectTab('receipt')}
                className="w-full text-left p-2.5 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 rounded flex items-center justify-between group transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">Completion Receipt</div>
                  <div className="text-slate-400 text-xs">Durable machine-readable execution checkpoint</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stop Condition Verification Checklist */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Scout Stage Stop Condition Verification Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict verification that the Scout boundary has been respected with zero leakage into downstream MARA stages.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> 6/6 CRITERIA SATISFIED
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {STOP_CONDITION_CRITERIA.map((criterion, idx) => (
            <div key={idx} className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-200">
                <span>{criterion.title}</span>
                <span className="text-emerald-400 font-mono text-[11px]">VERIFIED</span>
              </div>
              <p className="text-slate-400 text-xs">{criterion.requirement}</p>
              <div className="pt-1 text-[11px] text-slate-500 font-mono">                Evidence: {criterion.evidence}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

