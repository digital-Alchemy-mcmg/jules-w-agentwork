import React, { useState, useEffect } from 'react';
import { JobCandidate, TravelingEnvelope } from '../types/scout';
import { processB1Stage } from '../services/b1Engine';
import { CheckCircle2, ChevronRight, SplitSquareHorizontal } from 'lucide-react';

interface B1ViewProps {
  candidates: JobCandidate[];
  envelopes: TravelingEnvelope[];
}

export const B1View: React.FC<B1ViewProps> = ({ candidates, envelopes }) => {
  const [processedEnvelopes, setProcessedEnvelopes] = useState<TravelingEnvelope[]>([]);
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState<string>('');

  useEffect(() => {
    // Automatically process all available valid 'b' stage envelopes into 'b1'
    const newlyProcessed = envelopes
      .filter(env => env.stage_state.current_stage === 'b')
      .map(env => {
        try {
          return processB1Stage(env);
        } catch (e) {
          console.error("B1 Processing Error", e);
          return null;
        }
      })
      .filter((env): env is TravelingEnvelope => env !== null);

    setProcessedEnvelopes(newlyProcessed);

    if (newlyProcessed.length > 0 && !selectedEnvelopeId) {
      setSelectedEnvelopeId(newlyProcessed[0].envelope_id);
    }
  }, [envelopes]);

  const selectedEnvelope = processedEnvelopes.find(e => e.envelope_id === selectedEnvelopeId);
  const upstreamScoutSource = selectedEnvelope?.payload.scout.original_target_source.source_text || '';
  const b1Source = selectedEnvelope?.payload.b1?.processed_source_text || '';

  const isParityExact = upstreamScoutSource === b1Source && b1Source !== '';

  return (
    <div className="space-y-6">
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <SplitSquareHorizontal className="w-5 h-5 text-cyan-400" />
            B1 Stage: Zero-Hallucination Source Extraction
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Validating the immutability of the Traveling Envelope payload from upstream Scout stage (b) into B1 stage (b1).
            Source text must be extracted into payload.b1 identically without mutation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Envelope Selection List */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4 flex flex-col h-[600px]">
          <h2 className="text-sm font-semibold text-slate-200 mb-4 border-b border-slate-800 pb-2">Processed B1 Envelopes</h2>
          <div className="overflow-y-auto flex-1 space-y-2 pr-2">
            {processedEnvelopes.length === 0 ? (
              <div className="text-xs text-slate-500 italic text-center mt-10">
                No active envelopes. Ingest a job first.
              </div>
            ) : (
              processedEnvelopes.map(env => (
                <button
                  key={env.envelope_id}
                  onClick={() => setSelectedEnvelopeId(env.envelope_id)}
                  className={`w-full text-left p-3 rounded border text-xs cursor-pointer transition-colors ${
                    selectedEnvelopeId === env.envelope_id
                      ? 'bg-slate-800 border-cyan-500/50 text-slate-200'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-mono text-cyan-400 truncate mb-1">{env.envelope_id}</div>
                  <div className="truncate">{env.persistent.target_identity.job_title}</div>
                  <div className="truncate text-slate-500">{env.persistent.target_identity.company}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Source Text Comparison Viewport */}
        <div className="md:col-span-3 border border-slate-800 bg-slate-900/40 rounded-lg flex flex-col h-[600px]">
          {selectedEnvelope ? (
            <>
              <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="text-sm font-semibold text-slate-200">
                  Immutability Inspection: <span className="font-mono text-cyan-400 text-xs ml-2">{selectedEnvelope.envelope_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isParityExact ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" /> EXACT PARITY
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-red-400 bg-red-400/10 border border-red-400/20 rounded">
                      PARITY FAILURE
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 min-h-0 overflow-hidden divide-x divide-slate-800">
                <div className="flex flex-col h-full">
                  <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 shrink-0">
                    <span className="text-xs font-mono text-slate-400">upstream: payload.scout.original_target_source.source_text</span>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {upstreamScoutSource}
                  </div>
                </div>
                <div className="flex flex-col h-full bg-slate-900/20">
                  <div className="px-4 py-2 bg-cyan-950/20 border-b border-slate-800 flex items-center shrink-0">
                     <ChevronRight className="w-3.5 h-3.5 text-cyan-500 mr-2 shrink-0" />
                    <span className="text-xs font-mono text-cyan-300">b1: payload.b1.processed_source_text</span>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {b1Source}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
              Select an envelope to inspect structural parity.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
