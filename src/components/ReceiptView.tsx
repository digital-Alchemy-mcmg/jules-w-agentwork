import React, { useState } from 'react';
import { Download, Copy, Check, ShieldCheck, GitCommit, GitBranch, Terminal, Hash } from 'lucide-react';
import { CompletionReceipt } from '../types/scout';
import { STOP_CONDITION_CRITERIA, TWELVE_ATOMIC_RULES } from '../data/scoutData';

interface ReceiptViewProps {
  receipt: CompletionReceipt;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({ receipt }) => {
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'RECEIPT' | 'CRITERIA' | 'RULES'>('RECEIPT');

  const handleCopyReceipt = () => {
    navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const handleDownloadReceipt = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(receipt, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "SCOUT_STAGE_COMPLETION_RECEIPT_V2.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span>DURABLE COMPLETION RECEIPT</span>
            <span className="text-slate-600"> </span>
            <span className="text-emerald-400">STAGE: SCOUT (DONE)</span>
            <span className="text-slate-600"> </span>
            <span className="text-amber-400">STOP CONDITION: SATISFIED</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 mt-1">
            Scout Stage Completion Receipt & Audit Gate
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Machine-readable checkpoint receipt documenting repository commits, cryptographic SHA-256 artifacts, and the verified stop condition boundary.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-md">
            <button
              onClick={() => setActiveSubTab('RECEIPT')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeSubTab === 'RECEIPT'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Receipt JSON
            </button>
            <button
              onClick={() => setActiveSubTab('CRITERIA')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeSubTab === 'CRITERIA'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stop Condition (6/6)
            </button>
            <button
              onClick={() => setActiveSubTab('RULES')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeSubTab === 'RULES'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              The 12 Rules
            </button>
          </div>

          <button
            onClick={handleCopyReceipt}
            className="p-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Copy receipt JSON"
          >
            {copiedReceipt ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownloadReceipt}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Receipt</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'RECEIPT' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded space-y-1">
              <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                Repository & Tag
              </div>
              <div className="text-slate-200 font-semibold text-xs">
                {receipt.repository}
              </div>
              <div className="text-[11px] text-cyan-300">
                {receipt.branch}   {receipt.git_tag}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded space-y-1">
              <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
                Commit SHA
              </div>
              <div className="text-slate-200 font-semibold text-xs truncate" title={receipt.commit_sha}>
                {receipt.commit_sha}
              </div>
              <div className="text-[11px] text-emerald-400">
                Frozen at Scout Output Boundary
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded space-y-1">
              <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                Execution Mode & Status
              </div>
              <div className="text-slate-200 font-semibold text-xs">
                Runner {receipt.runner_id} ({receipt.execution_mode})
              </div>
              <div className="text-[11px] text-slate-400">
                {receipt.accepted_envelopes_count} accepted / {receipt.total_jobs_processed} processed
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono">
            <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              Verified Workbench Execution Command
            </div>
            <div className="text-cyan-300 overflow-x-auto">
              {receipt.workbench_command}
            </div>
          </div>

          <div className="border border-slate-800 bg-slate-950 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-slate-400">
              <span>SCOUT_STAGE_COMPLETION_RECEIPT_V2.json</span>
              <button
                onClick={handleCopyReceipt}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedReceipt ? 'Copied to clipboard' : 'Copy JSON'}
              </button>
            </div>
            <pre className="text-slate-300 leading-relaxed max-h-[600px] overflow-y-auto">
              {JSON.stringify(receipt, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === 'CRITERIA' && (
        <div className="space-y-4">
          <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Stop Condition Audit Verification Matrix
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Execution has halted strictly at the Scout output boundary (current_stage: "b").
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1">
                6/6 SATISFIED
              </span>
            </div>
            <div className="space-y-3 text-xs">
              {STOP_CONDITION_CRITERIA.map((criterion, idx) => (
                <div key={idx} className="p-4 bg-slate-950/70 border border-slate-800 rounded space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-sm">
                      {idx + 1}. {criterion.title}
                    </span>
                    <span className="px-2 py-0.5 font-mono text-[11px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 rounded">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{criterion.requirement}</p>
                  <div className="text-[11px] font-mono text-cyan-400 pt-1 border-t border-slate-900">
                    Audit Evidence: {criterion.evidence}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'RULES' && (
        <div className="space-y-4">
          <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5">
            <div className="border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-base font-semibold text-slate-100">
                The 12 Atomic Decomposition Rules (Path B Engine)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Strict decomposition rules enforced by ENVOY 2 to convert unstructured target text into atomic statements.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {TWELVE_ATOMIC_RULES.map((rule) => (
                <div key={rule.id} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-semibold text-[11px]">
                      Rule {rule.id.toString().padStart(2, '0')}
                    </span>
                    <span className="font-semibold text-slate-200">{rule.name}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{rule.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
