/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ConsoleView } from './components/ConsoleView';
import { LiveIngestView } from './components/LiveIngestView';
import { CorpusView } from './components/CorpusView';
import { CartridgeView } from './components/CartridgeView';
import { GateTelemetryView } from './components/GateTelemetryView';
import { EnvelopesView } from './components/EnvelopesView';
import { ReceiptView } from './components/ReceiptView';
import { HandoffModal } from './components/HandoffModal';
import { JobCandidate, RawJobInput, TravelingEnvelope, CompletionReceipt } from './types/scout';
import { processLiveJobToEnvelope, generateLiveCompletionReceipt } from './services/scoutEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('console');
  const [candidates, setCandidates] = useState<JobCandidate[]>([]);
  const [envelopes, setEnvelopes] = useState<TravelingEnvelope[]>([]);
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState<string>('');
  const [lastIngestedEnvelopeId, setLastIngestedEnvelopeId] = useState<string>('');
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Dynamic live receipt generated from actual candidates & envelopes
  const [receipt, setReceipt] = useState<CompletionReceipt>(() => 
    generateLiveCompletionReceipt([], [])
  );

  // Update live receipt whenever candidates or envelopes change
  useEffect(() => {
    const updated = generateLiveCompletionReceipt(candidates, envelopes);
    setReceipt(updated);
  }, [candidates, envelopes]);

  const handleIngestJob = async (input: RawJobInput) => {
    setIsProcessing(true);
    try {
      const { candidate, envelope } = await processLiveJobToEnvelope(
        input,
        candidates.length,
        "live-intake-corpus"
      );

      setCandidates(prev => [candidate, ...prev]);

      if (envelope) {
        setEnvelopes(prev => [envelope, ...prev]);
        setSelectedEnvelopeId(envelope.envelope_id);
        setLastIngestedEnvelopeId(envelope.envelope_id);
      }
    } catch (err) {
      console.error("Live Ingestion error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInspectEnvelope = (envelopeId: string) => {
    setSelectedEnvelopeId(envelopeId);
    setActiveTab('envelopes');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar (Universal 3-Zone Contract) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReceiptModal={() => setIsHandoffModalOpen(true)}
        receipt={receipt}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'console' && (
          <ConsoleView
            candidates={candidates}
            envelopes={envelopes}
            receipt={receipt}
            onSelectTab={setActiveTab}
            onSelectEnvelope={handleInspectEnvelope}
          />
        )}

        {activeTab === 'ingest' && (
          <LiveIngestView
            onIngest={handleIngestJob}
            isProcessing={isProcessing}
            onOpenEnvelope={handleInspectEnvelope}
            lastIngestedEnvelopeId={lastIngestedEnvelopeId}
          />
        )}

        {activeTab === 'corpus' && (
          <CorpusView 
            candidates={candidates}
            onInspectEnvelope={handleInspectEnvelope}
            onNavigateToIngest={() => setActiveTab('ingest')}
          />
        )}

        {activeTab === 'envelopes' && (
          <EnvelopesView 
            envelopes={envelopes}
            initialEnvelopeId={selectedEnvelopeId}
            onNavigateToIngest={() => setActiveTab('ingest')}
          />
        )}

        {activeTab === 'telemetry' && (
          <GateTelemetryView 
            candidates={candidates}
            onNavigateToIngest={() => setActiveTab('ingest')}
          />
        )}

        {activeTab === 'receipt' && (
          <ReceiptView receipt={receipt} />
        )}

        {activeTab === 'cartridge' && (
          <CartridgeView />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Spatial DNA</span>
            <span> </span>
            <span>Scout Stage v2.2.0</span>
            <span> </span>
            <span className="text-emerald-400">Stop Condition Satisfied</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Commit: <strong className="text-slate-400">{receipt.commit_sha.slice(0, 7)}</strong></span>
            <span> </span>
            <span>Tag: <strong className="text-slate-400">{receipt.git_tag}</strong></span>
            <span> </span>
            <span className="text-cyan-400">current_stage: "b"</span>
          </div>
        </div>
      </footer>

      {/* Handoff Verification Modal */}
      <HandoffModal
        isOpen={isHandoffModalOpen}
        onClose={() => setIsHandoffModalOpen(false)}
        onViewReceipt={() => setActiveTab('receipt')}
        onViewEnvelopes={() => setActiveTab('envelopes')}
        receipt={receipt}
        envelopesCount={envelopes.length}
      />
    </div>
  );
}
