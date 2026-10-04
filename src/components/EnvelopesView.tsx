import React, { useState } from 'react';
import {
  FileText, Copy, Check, Download, Layers, Database, Lock, CheckCircle2, PlusCircle, Play, FastForward
} from 'lucide-react';
import { FOURTEEN_SEMANTIC_CATEGORIES } from '../data/scoutData';
import { TravelingEnvelope } from '../types/scout';

interface EnvelopesViewProps {
  envelopes: TravelingEnvelope[];
  initialEnvelopeId?: string;
  onNavigateToIngest: () => void;
  onAdvancePipeline?: (envId: string) => Promise<void>;
  isAdvancing?: boolean;
}

export const EnvelopesView: React.FC<EnvelopesViewProps> = ({
  envelopes,
  initialEnvelopeId,
  onNavigateToIngest,
  onAdvancePipeline,
  isAdvancing = false,
}) => {
  const [selectedEnvId, setSelectedEnvId] = useState<string>(
    initialEnvelopeId || envelopes[0]?.envelope_id || ''
  );
  const [viewMode, setViewMode] = useState<'STRUCTURED' | 'JSON'>('STRUCTURED');
  const [activeCategory, setActiveCategory] = useState<string>('Employment Type');
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [copiedSource, setCopiedSource] = useState<boolean>(false);

  const currentEnvelope: TravelingEnvelope | undefined =
    envelopes.find(e => e.envelope_id === selectedEnvId) || envelopes[0];

  const handleCopyJson = () => {
    if (!currentEnvelope) return;
    navigator.clipboard.writeText(JSON.stringify(currentEnvelope, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopySourceText = () => {
    if (!currentEnvelope) return;
    navigator.clipboard.writeText(currentEnvelope.payload.scout.original_target_source.source_text);
    setCopiedSource(true);
    setTimeout(() => setCopiedSource(false), 2000);
  };

  const handleDownloadEnvelope = () => {
    if (!currentEnvelope) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentEnvelope, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${currentEnvelope.persistent.target_identity.job_id}_${currentEnvelope.payload.scout.Observation_ID}.envelope.v2.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (envelopes.length === 0 || !currentEnvelope) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Traveling Envelope Inspector & Audit
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Zero envelopes sealed. Ingest a live job posting to generate an authentic Traveling Envelope v0.2.
            </p>
          </div>
        </div>

        <div className="border border-dashed border-slate-800 rounded-lg p-12 text-center space-y-3 bg-slate-900/20">
          <p className="text-sm text-slate-300 font-medium">
            No Traveling Envelopes available.
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Traveling Envelopes are emitted strictly when an accepted job observation completes Scout intake and Section 8 source preservation.
          </p>
          <button
            onClick={onNavigateToIngest}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ingest Live Job</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Selector & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span>TRAVELING ENVELOPE v0.2.0</span>
            <span className="text-slate-600"> </span>
            <span className="text-emerald-400">PRIMARY HANDOFF OBJECT</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 mt-1">
            Traveling Envelope Inspector & Audit
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Self-contained, downstream-ready handoff envelopes carrying Section 8 immutable source text and Path B atomic facts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-md">
            <button
              onClick={() => setViewMode('STRUCTURED')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'STRUCTURED'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Structured Audit
            </button>
            <button
              onClick={() => setViewMode('JSON')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'JSON'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Contract JSON
            </button>
          </div>

          <button
            onClick={handleCopyJson}
            className="p-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Copy full JSON"
          >
            {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          {onAdvancePipeline && currentEnvelope.stage_state.current_stage !== 'stop_before_resume_factory' && (
            <button
              onClick={() => onAdvancePipeline(currentEnvelope.envelope_id)}
              disabled={isAdvancing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded transition-colors cursor-pointer"
              title="Execute B1 through B5 straight-through"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>{isAdvancing ? 'Executing Pipeline...' : 'Advance B1 → B5'}</span>
            </button>
          )}

          <button
            onClick={handleDownloadEnvelope}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
            title="Download envelope JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Envelope</span>
          </button>
        </div>
      </div>

      {/* Envelopes Switcher Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-850">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          Envelopes ({envelopes.length}):
        </span>
        {envelopes.map((env) => (
          <button
            key={env.envelope_id}
            onClick={() => setSelectedEnvId(env.envelope_id)}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentEnvelope.envelope_id === env.envelope_id
                ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-300 font-semibold shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            {env.persistent.target_identity.job_id} — {env.payload.scout.Observation_ID.slice(-6)}
          </button>
        ))}
      </div>

      {viewMode === 'JSON' ? (
        <div className="border border-slate-800 bg-slate-950 rounded-lg p-4 font-mono text-xs overflow-x-auto relative">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-slate-400">
            <span>{currentEnvelope.envelope_id} — Schema v0.2.0</span>
            <button
              onClick={handleCopyJson}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedJson ? 'Copied to clipboard' : 'Copy JSON'}
            </button>
          </div>
          <pre className="text-slate-300 leading-relaxed max-h-[700px] overflow-y-auto">
            {JSON.stringify(currentEnvelope, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Envelope Identification Banner */}
          <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <span className="font-semibold">{currentEnvelope.envelope_id}</span>
                  <span className="text-slate-600"> </span>
                  <span className="text-emerald-400">STATUS: {currentEnvelope.stage_state.status.toUpperCase()}</span>
                  <span className="text-slate-600"> </span>
                  <span className="text-amber-400">CURRENT_STAGE: "{currentEnvelope.stage_state.current_stage}"</span>
                </div>
                <h2 className="text-lg font-bold text-slate-100 mt-1">
                  {currentEnvelope.persistent.target_identity.job_title}
                </h2>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                  <span>{currentEnvelope.persistent.target_identity.company}</span>
                  <span> </span>
                  <span>{currentEnvelope.persistent.target_identity.location}</span>
                  <span> </span>
                  <span className="text-slate-300">{currentEnvelope.persistent.target_identity.compensation}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono shrink-0">
                <div className="p-2 bg-slate-950/60 border border-slate-800 rounded">
                  <span className="text-slate-500 block text-[10px]">Observation ID</span>
                  <span className="text-cyan-300 font-semibold">{currentEnvelope.payload.scout.Observation_ID}</span>
                </div>
                <div className="p-2 bg-slate-950/60 border border-slate-800 rounded">
                  <span className="text-slate-500 block text-[10px]">Contract Schema</span>
                  <span className="text-slate-200 font-semibold">{currentEnvelope.schema_version}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 8 Source-Preservation Amendment Block */}
          <div className="border border-cyan-900/40 bg-slate-900/40 rounded-lg p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Section 8 Source-Preservation Amendment Block
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Immutable original target source text preserved upstream with authentic SHA-256 hash. Zero metadata fabrication.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopySourceText}
                  className="px-2.5 py-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 border border-cyan-800/40 rounded transition-colors cursor-pointer"
                >
                  {copiedSource ? 'Copied Source' : 'Copy Verbatim Source'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded">
                <span className="text-slate-500 block text-[10px]">Source SHA-256 Hash (Web Crypto)</span>
                <span className="text-slate-300 text-[11px] truncate block" title={currentEnvelope.payload.scout.original_target_source.source_hash}>
                  {currentEnvelope.payload.scout.original_target_source.source_hash}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded">
                <span className="text-slate-500 block text-[10px]">Capture Timestamp</span>
                <span className="text-slate-300 text-[11px] block">
                  {currentEnvelope.payload.scout.original_target_source.capture_timestamp}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded">
                <span className="text-slate-500 block text-[10px]">Preservation Status</span>
                <span className="text-emerald-400 text-[11px] block flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> is_preserved_source: true
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {currentEnvelope.payload.scout.original_target_source.source_text}
            </div>
            <div className="text-[11px] text-slate-500 italic">
              Note: {currentEnvelope.payload.scout.original_target_source.preservation_note}
            </div>
          </div>

          {/* Path A vs Path B Processing Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Path A */}
            <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  Path A: Structured Preservation
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Runner-established fields passed through to downstream stages without modification.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-slate-950/60 border border-slate-800 rounded">
                  <span className="text-slate-500 block text-[10px]">Observation_ID</span>
                  <span className="text-cyan-300">{currentEnvelope.payload.scout.Observation_ID}</span>
                </div>
                <div className="p-2 bg-slate-950/60 border border-slate-800 rounded">
                  <span className="text-slate-500 block text-[10px]">Collection_Date</span>
                  <span className="text-slate-200">{currentEnvelope.payload.scout.collection_date}</span>
                </div>
                <div className="p-2 bg-slate-950/60 border border-slate-800 rounded">
                  <span className="text-slate-500 block text-[10px]">Employer</span>
                  <span className="text-slate-200">{currentEnvelope.payload.scout.employer}</span>
                </div>
                <div className="p-2 bg-slate-950/60 border border-slate-800 rounded">
                  <span className="text-slate-500 block text-[10px]">Location</span>
                  <span className="text-slate-200">{currentEnvelope.payload.scout.city}, {currentEnvelope.payload.scout.state} {currentEnvelope.payload.scout.zip}</span>
                </div>
                <div className="p-2 bg-slate-950/60 border border-slate-800 rounded col-span-2">
                  <span className="text-slate-500 block text-[10px]">Deduplication Key (SHA-256)</span>
                  <span className="text-slate-400 text-[11px] truncate block">
                    {currentEnvelope.payload.scout.deduplication_key}
                  </span>
                </div>
              </div>
            </div>

            {/* Path B */}
            <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Path B: 12-Rule Semantic Decomposition ({currentEnvelope.payload.scout.atomic_statements.length} Atoms)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Discrete atomic statements stripped of marketing fluff and pronouns.
                </p>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {currentEnvelope.payload.scout.atomic_statements.map((stmt, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-950/60 border border-slate-800/80 rounded text-xs text-slate-200 flex items-start gap-2"
                  >
                    <span className="font-mono text-cyan-400 text-[11px] shrink-0 mt-0.5">
                      #{idx + 1}
                    </span>
                    <span className="flex-1">{stmt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* The 14 Semantic Categories Explorer */}
          <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">
                  The 14 Semantic Categories (Exact-String References)
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  ENVOY 2 Decomposition Matrix
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Every category entry is an exact-string reference to an approved member of <code className="font-mono text-cyan-400">atomic_statements</code>.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {FOURTEEN_SEMANTIC_CATEGORIES.map((cat) => {
                const count = (currentEnvelope.payload.scout.semantic_categories as any)[cat]?.length || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-cyan-950/60 text-cyan-300 font-semibold border border-cyan-800/60'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                    <span className={`ml-1.5 font-mono text-[10px] ${count > 0 ? 'text-cyan-400 font-bold' : 'text-slate-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded min-h-[100px]">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">
                Category: <strong className="text-slate-300">{activeCategory}</strong>
              </div>
              {((currentEnvelope.payload.scout.semantic_categories as any)[activeCategory]?.length || 0) === 0 ? (
                <div className="text-xs text-slate-500 italic py-2">
                  No statements indexed under {activeCategory} for this candidate record.
                </div>
              ) : (
                <div className="space-y-2">
                  {((currentEnvelope.payload.scout.semantic_categories as any)[activeCategory] as string[]).map((stmt, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded text-xs text-cyan-200 font-sans">
                      {stmt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stage Payload Inspector & Isolation Matrix */}
          <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                Pipeline Stage Payloads (Scout → B1 → B2 → B3 → B4 → B5)
              </h3>
              <span className="text-[11px] font-mono text-emerald-400">
                ACTIVE: {currentEnvelope.stage_state.current_stage.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Each stage appends its verified cryptographic payload without altering upstream facts. Downstream slots remain null until reached.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs font-mono pt-1">
              {(['b', 'b1', 'b2', 'b3', 'b4', 'b5'] as const).map((slot) => {
                const val = (currentEnvelope.payload as any)[slot];
                const isPopulated = val !== null && val !== undefined;
                return (
                  <div key={slot} className={`p-2 rounded text-center border ${isPopulated ? 'bg-cyan-950/40 border-cyan-700/60' : 'bg-slate-950 border-slate-800'}`}>
                    <span className="text-slate-400 block text-[10px]">payload.{slot}</span>
                    <span className={`font-semibold ${isPopulated ? 'text-cyan-300' : 'text-slate-600'}`}>
                      {isPopulated ? 'POPULATED' : 'null'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* B1 Target Primitives */}
            {currentEnvelope.payload.b1 && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-2 text-xs">
                <div className="flex items-center justify-between text-cyan-400 font-mono">
                  <span className="font-semibold">B1 Decouple Envelope</span>
                  <span>Airlock: {currentEnvelope.payload.b1.b1_header.candidate_blind_airlock}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Primitives: Hard Gates ({currentEnvelope.payload.b1.operational_primitives.hard_candidate_gates.length}), Contextual ({currentEnvelope.payload.b1.operational_primitives.contextual_conditions.length}), Duties ({currentEnvelope.payload.b1.operational_primitives.required_role_responsibilities.length})
                </div>
              </div>
            )}

            {/* B2 Target Tree */}
            {currentEnvelope.payload.b2 && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-2 text-xs">
                <div className="flex items-center justify-between text-emerald-400 font-mono">
                  <span className="font-semibold">B2 Target Tree</span>
                  <span>Tree ID: {currentEnvelope.payload.b2.tree_id} (Frozen: {currentEnvelope.payload.b2.frozen ? 'TRUE' : 'FALSE'})</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Total Addressable Nodes: {currentEnvelope.payload.b2.total_nodes} | Mandatory Gates: {currentEnvelope.payload.b2.gate_count}
                </div>
              </div>
            )}

            {/* B3 Spatial Bindings */}
            {currentEnvelope.payload.b3 && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-2 text-xs">
                <div className="flex items-center justify-between text-indigo-400 font-mono">
                  <span className="font-semibold">B3 Spatial DNA Bindings</span>
                  <span>Total Bindings: {currentEnvelope.payload.b3.total_bindings}</span>
                </div>
              </div>
            )}

            {/* B4 Truth Gate */}
            {currentEnvelope.payload.b4 && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-2 text-xs">
                <div className="flex items-center justify-between text-amber-400 font-mono">
                  <span className="font-semibold">B4 Truth Gate Audit</span>
                  <span>Admitted for B5: {currentEnvelope.payload.b4.admitted_for_b5 ? 'YES' : 'NO'}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  PASS: {currentEnvelope.payload.b4.disposition_summary.pass_count} | QUALIFIED: {currentEnvelope.payload.b4.disposition_summary.qualified_count} | UNRESOLVED: {currentEnvelope.payload.b4.disposition_summary.unresolved_count} | VIOLATIONS: {currentEnvelope.payload.b4.disposition_summary.hard_gate_violations}
                </div>
              </div>
            )}

            {/* B5 Semantic Core */}
            {currentEnvelope.payload.b5 && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-2 text-xs">
                <div className="flex items-center justify-between text-purple-400 font-mono">
                  <span className="font-semibold">B5 Semantic Core</span>
                  <span>Owner Prism: {currentEnvelope.payload.b5.owner_prism}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Posture: {currentEnvelope.payload.b5.presentation_geometry.posture} | Foreground Assertions: {currentEnvelope.payload.b5.semantic_priorities.foreground.length}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
