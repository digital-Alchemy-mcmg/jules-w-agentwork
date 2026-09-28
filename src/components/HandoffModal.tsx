import React from 'react';
import { X, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { STOP_CONDITION_CRITERIA } from '../data/scoutData';
import { CompletionReceipt } from '../types/scout';

interface HandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt: () => void;
  onViewEnvelopes: () => void;
  receipt: CompletionReceipt;
  envelopesCount: number;
}

export const HandoffModal: React.FC<HandoffModalProps> = ({
  isOpen,
  onClose,
  onViewReceipt,
  onViewEnvelopes,
  receipt,
  envelopesCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span>SCOUT STAGE OUTPUT BOUNDARY</span>
              <span className="text-slate-600"> </span>
              <span className="text-emerald-400">STATE: FROZEN</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              B-Handoff Boundary Verification Gate
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-slate-300">
            <span>Execution Stage State:</span>
            <span className="text-cyan-300 font-semibold">completed_stages: ["scout"]</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Next Eligible Stage:</span>
            <span className="text-amber-400 font-semibold">current_stage: "b"</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Downstream MARA Slots:</span>
            <span className="text-emerald-400 font-semibold">payload.b ... b5 = null</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Stop Condition Status:</span>
            <span className="text-emerald-400 font-semibold">SATISFIED (6/6 Criteria)</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Live Envelopes Generated:</span>
            <span className="text-cyan-400 font-semibold">{envelopesCount} Sealed</span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 block">
            Verification Checklist:
          </span>
          <div className="space-y-1.5 text-xs">
            {STOP_CONDITION_CRITERIA.map((criterion, idx) => (
              <div key={idx} className="p-2.5 bg-slate-950/60 border border-slate-800 rounded flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="font-medium text-slate-200">{criterion.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{criterion.requirement}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Tag: {receipt.git_tag}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onViewEnvelopes();
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded transition-colors cursor-pointer"
            >
              Browse Envelopes ({envelopesCount})
            </button>
            <button
              onClick={() => {
                onClose();
                onViewReceipt();
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
            >
              View Full Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
