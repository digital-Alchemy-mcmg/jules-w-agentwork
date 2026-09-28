import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { BASE_GATES_LIST } from '../data/scoutData';
import { JobCandidate } from '../types/scout';

interface GateTelemetryViewProps {
  candidates: JobCandidate[];
  onNavigateToIngest: () => void;
}

export const GateTelemetryView: React.FC<GateTelemetryViewProps> = ({
  candidates,
  onNavigateToIngest
}) => {
  const [selectedGateId, setSelectedGateId] = useState<number>(9);

  const accepted = candidates.filter(c => c.status === 'ACCEPTED');
  const rejected = candidates.filter(c => c.status === 'REJECTED');

  // Compute dynamic rejection counts per gate
  const gateRejectionCounts: Record<number, number> = {};
  for (const g of BASE_GATES_LIST) {
    gateRejectionCounts[g.id] = 0;
  }
  for (const c of rejected) {
    if (c.rejectionGate) {
      const match = c.rejectionGate.match(/Gate\s+(\d+)/i);
      if (match) {
        const gId = parseInt(match[1], 10);
        gateRejectionCounts[gId] = (gateRejectionCounts[gId] || 0) + 1;
      }
    }
  }

  const selectedGate = BASE_GATES_LIST.find(g => g.id === selectedGateId);
  const candidatesFilteredBySelectedGate = rejected.filter(c => {
    if (!c.rejectionGate) return false;
    return c.rejectionGate.includes(`Gate ${selectedGateId}:`);
  });

  return (
    <div className="space-y-6">
      {/* Telemetry Header */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span>ZERO-INFERENCE RUNNER TELEMETRY</span>
              <span className="text-slate-600"> </span>
              <span className="text-emerald-400">12 EVALUATION GATES</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100 mt-1">
              Live Gate Rejection & Inclusion Telemetry
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Dynamic 12-gate runner telemetry distinguishing administrative scope filtering (Gate 9) from input failures or data defects.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 rounded">
              {accepted.length} ACCEPTED
            </span>
            <span className="px-3 py-1.5 bg-amber-950/40 border border-amber-800/40 text-amber-400 rounded">
              {rejected.length} FILTERED
            </span>
            <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 rounded">
              0 FAILURES
            </span>
          </div>
        </div>

        {/* 12 Gates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {BASE_GATES_LIST.map((gate) => {
            const count = gateRejectionCounts[gate.id] || 0;
            return (
              <div
                key={gate.id}
                onClick={() => setSelectedGateId(gate.id)}
                className={`p-3.5 rounded border transition-colors cursor-pointer ${
                  selectedGateId === gate.id
                    ? 'bg-slate-850 border-cyan-500/80 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono font-semibold text-cyan-400">
                    Gate {gate.id}: {gate.name}
                  </span>
                  {count > 0 ? (
                    <span className="font-mono text-amber-400 font-semibold text-[11px]">
                      {count} Filtered
                    </span>
                  ) : (
                    <span className="font-mono text-emerald-400 text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 0 Filtered
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {gate.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate-Attached Explainability Drill-down */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-6 space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Candidate-Attached Explainability: Gate {selectedGateId} ({selectedGate?.name})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspecting records rejected by Gate {selectedGateId}.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {candidatesFilteredBySelectedGate.length} record(s)
          </span>
        </div>

        {candidatesFilteredBySelectedGate.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs italic bg-slate-950/40 rounded border border-slate-800">
            No candidates were filtered by Gate {selectedGateId} in the current run.
          </div>
        ) : (
          <div className="space-y-2">
            {candidatesFilteredBySelectedGate.map((candidate) => (
              <div
                key={candidate.id}
                className="p-3 bg-slate-950/70 border border-slate-800/80 rounded flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="font-semibold text-cyan-400">{candidate.id}</span>
                    <span className="text-slate-600"> </span>
                    <span className="text-slate-300">{candidate.company}</span>
                    <span className="text-slate-600"> </span>
                    <span className="text-slate-400">{candidate.location}</span>
                  </div>
                  <div className="font-medium text-slate-200">{candidate.title}</div>
                  <div className="text-amber-300/90 text-xs">
                    <strong className="text-amber-400 font-mono text-[11px]">Exclusion Reason: </strong>
                    {candidate.rejectionReason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
