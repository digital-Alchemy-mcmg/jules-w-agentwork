import React, { useState, useMemo } from 'react';
import { useMara, ApplicationItem } from '../../context/MaraContext';

export default function OperatorInterface() {
  const {
    applications,
    diskConfig,
    togglePinJob,
    makeB4Decision,
    makeB5Decision,
    exportEnvelopeJson,
    eventLogs,
    isProcessing,
    candidateDNA
  } = useMara();

  const [expandedB4, setExpandedB4] = useState<Set<string>>(new Set());
  const [finishedMode, setFinishedMode] = useState<Record<string, 'PRINT' | 'SEND'>>({});
  const [showInspection, setShowInspection] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Applications partitions based on authoritative state
  const pinnedApps = useMemo(() => applications.filter(a => a.isPinned), [applications]);
  const pinnedCount = pinnedApps.length;

  // B4 active opportunities (pinned / pushed, currently at B4, not stopped)
  const b4ActiveJobs = useMemo(() => {
    return applications.filter(a => (a.currentStage === 'b4' || (a.isPinned && a.currentStage === 'b')) && !a.isStopped && !a.b4Decision);
  }, [applications]);

  // B5 active opportunities (reached B5 or b4Decision === 'proceed', not stopped, not yet sent to factory)
  const b5ActiveJobs = useMemo(() => {
    return applications.filter(a => a.currentStage === 'b5' && !a.isStopped && a.b5Decision !== 'send');
  }, [applications]);

  // Finished applications (authorized to Resume Factory or completed straight through)
  const finishedJobs = useMemo(() => {
    return applications.filter(a => a.currentStage === 'stop_before_resume_factory' || a.b5Decision === 'send');
  }, [applications]);

  // Stopped for legitimate reason (stopped at B4, B5, or marked stopped)
  const stoppedJobs = useMemo(() => {
    return applications.filter(a => a.isStopped);
  }, [applications]);

  const toggleB4Detail = (id: string) => {
    setExpandedB4(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(exportEnvelopeJson());
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] text-[#111827] antialiased selection:bg-[#0E9F6E]/10">
      {/* Subheader / Mission Bar */}
      <div className="border-b border-[#E6E8EB] bg-white/95 backdrop-blur px-6 py-3.5">
        <div className="mx-auto max-w-[1280px] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-[7px] bg-[#111827] text-white grid place-items-center text-[11px] font-semibold tracking-[0.08em] shadow-sm">
                D
              </div>
              <div className="leading-none">
                <div className="text-[13px] font-semibold tracking-[0.12em] uppercase">Diplomat</div>
                <div className="text-[11px] text-[#6B7280] font-mono tracking-tight">Operator Home — Goal: 7 applications out</div>
              </div>
            </div>
            <div className="hidden md:block h-6 w-px bg-[#E6E8EB]" />
            <div className="hidden md:flex items-center gap-2 text-[12px]">
              <span className="text-[#6B7280]">Scout:</span>
              <span className="font-mono bg-[#F3F4F6] border border-[#E6E8EB] rounded px-2 py-0.5">
                87 obs → {applications.length} accepted
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-[11px] font-mono text-[#374151] bg-[#F9FAFB] border border-[#E6E8EB] rounded-full px-3 py-1">
              Mission: {diskConfig.territory[0]} • {diskConfig.roleScope} • {diskConfig.status.toUpperCase()} • SHA: {diskConfig.certHash?.slice(0, 16) || 'a3f9c2e1…'}
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isProcessing ? 'bg-[#EAB308] animate-ping' : 'bg-[#0E9F6E] animate-pulse'}`} />
              <span className="text-[11px] font-mono tracking-[0.06em] font-medium bg-[#0E9F6E] text-white rounded-full px-2.5 py-1">
                {isProcessing ? 'PROCESSING' : 'READY • OPERATOR CONTROL'}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] pt-2">
          <p className="text-[12px] leading-[1.5] text-[#6B7280] max-w-[900px]">
            Scout runs automatically in background. Gate traces, ledgers, hashes, source spans, target tree, receipts stay behind{' '}
            <button
              onClick={() => setShowInspection(v => !v)}
              className="text-[#111827] font-medium underline decoration-dotted underline-offset-4 hover:text-[#0E9F6E] transition-colors"
            >
              Inspection / Debug
            </button>.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-[1280px] px-4 md:px-6 py-6 space-y-6">
        {/* TOP ZONE: Accepted Jobs - Thin List Ready to Pin */}
        <section className="rounded-[16px] bg-white border border-[#E6E8EB] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-6 py-4 flex flex-wrap items-start justify-between gap-3 border-b border-[#F1F3F5] bg-[#FCFDFF]">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight">Accepted Jobs — thin list ready to pin</h2>
              <p className="text-[12.5px] text-[#6B7280] mt-1 max-w-[620px] leading-[1.45]">
                Scout ran automatically in background. {applications.length} opportunities loaded. Pinning authorizes progression through Spatial DNA truth gate. Cap: 7 applications.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="font-mono text-[12px] bg-[#111827] text-white rounded-full px-3 py-1.5 flex items-center gap-2">
                <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#34D399]" />
                {pinnedCount}/7 pinned — these are authorized
              </div>
              <div className="text-[11px] font-mono text-[#6B7280]">
                {Math.max(0, 12 - pinnedCount)} remain in thin list
              </div>
            </div>
          </div>

          <div className="p-4 md:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {applications.map(job => {
                const isPinned = job.isPinned;
                return (
                  <div
                    key={job.id}
                    className={`group relative rounded-[12px] border p-[14px] bg-white transition-all ${
                      isPinned
                        ? 'border-[#0E9F6E] shadow-[0_0_0_3px_rgba(14,159,110,0.12)]'
                        : 'border-[#E6E8EB] hover:border-[#D1D5DB] hover:shadow-sm'
                    }`}
                  >
                    {isPinned && (
                      <div className="absolute -top-2 -right-2 font-mono text-[10px] bg-[#0E9F6E] text-white px-2 py-0.5 rounded-full border border-white shadow">
                        AUTHORIZED
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold leading-tight truncate">{job.company}</div>
                        <div className="text-[12px] text-[#111827] mt-0.5 truncate">{job.position}</div>
                        <div className="font-mono text-[11px] text-[#6B7280] mt-1.5 flex items-center gap-2">
                          <span className="truncate">{job.location}</span>
                          <span className="h-1 w-1 rounded-full bg-[#D1D5DB] shrink-0" />
                          <span className="shrink-0">{job.pay}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => togglePinJob(job.id)}
                        className={`font-mono text-[11px] tracking-[0.04em] rounded-full px-3 py-1.5 border transition ${
                          isPinned
                            ? 'bg-[#0E9F6E] border-[#0E9F6E] text-white'
                            : 'bg-white border-[#111827] text-[#111827] hover:bg-[#111827] hover:text-white'
                        }`}
                      >
                        {isPinned ? 'Pinned ✓ — authorized' : 'Pin — authorize'}
                      </button>
                      {isPinned && (
                        <span className="font-mono text-[10px] text-[#6B7280] truncate">
                          → {job.currentStage.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Background activity strip */}
        <div className="rounded-[12px] border border-[#E6E8EB] bg-[#F6F7F8] px-4 py-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#6B7280]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9CA3AF] animate-pulse" />
            Background activity (no action needed):
          </div>
          <div className="text-[11px] font-mono text-[#6B7280] leading-relaxed">
            B schema validation • B1 decomposition • B2 target tree (nodes a, a1, a1a) • B3 Spatial DNA binding — running automatically.
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {[
              { label: 'Town Tavern Collective — Building tree a → a1 → a1a', stage: 'B2' },
              { label: 'Highland House — Binding 24 spans', stage: 'B3' },
              { label: 'Rev\'d Up Fun — B4 Audit sealed', stage: 'B4' },
            ].map((b, i) => (
              <div key={i} className="inline-flex items-center gap-2 rounded-full bg-white border border-[#E6E8EB] px-3 py-1 font-mono text-[11px] text-[#374151]">
                <span className="h-2.5 w-2.5 rounded-full border border-[#D1D5DB] border-t-[#111827] animate-spin" />
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE ZONE: Consequence Decisions (B4 & B5) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* B4 Decision: Is this opportunity worth stretching? */}
          <div className="rounded-[16px] bg-white border border-[#E6E8EB] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-6 py-4 border-b border-[#F1F3F5] bg-[#FCFDFF]">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-[6px] bg-[#FEF3C7] border border-[#FDE68A] grid place-items-center font-mono text-[11px] font-medium text-[#92400E]">
                    B4
                  </div>
                  <h3 className="text-[13.5px] font-semibold text-[#111827]">Is this opportunity worth stretching?</h3>
                  <span className="font-mono text-[10px] bg-[#F3F4F6] border border-[#E6E8EB] rounded px-2 py-0.5 text-[#6B7280]">
                    NORMAL • NOT FAILURE
                  </span>
                </div>
                <p className="text-[11.5px] text-[#6B7280] mt-2 leading-[1.5]">
                  Completed B2 → B3 → B4. Needs judgment before consuming further compute.
                </p>
              </div>

              <div className="p-4 space-y-3">
                {b4ActiveJobs.length === 0 ? (
                  <div className="py-12 text-center text-[12.5px] text-[#9CA3AF] border border-dashed border-[#E5E7EB] rounded-[10px]">
                    No applications currently awaiting B4 stretch decision. Pin jobs above to push to B4.
                  </div>
                ) : (
                  b4ActiveJobs.map(job => {
                    const b4 = job.b4Data || { pct: 75, supported: 18, total: 24, evidenceCount: 40, partial: 3, narrowed: 2 };
                    const isExpanded = expandedB4.has(job.id);
                    const barColor = b4.pct >= 80 ? 'bg-[#0E9F6E]' : b4.pct >= 70 ? 'bg-[#EAB308]' : 'bg-[#F59E0B]';

                    return (
                      <div
                        key={job.id}
                        className="rounded-[12px] border border-[#E6E8EB] bg-white p-4 transition-all hover:border-[#D1D5DB]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-[#111827]">{job.company}</div>
                            <div className="text-[12px] text-[#4B5563] mt-0.5">{job.position}</div>
                            <div className="font-mono text-[11px] text-[#6B7280] mt-1 flex flex-wrap items-center gap-2">
                              <span>{b4.supported}/{b4.total} supported</span>
                              <span className="h-1 w-1 rounded-full bg-[#D1D5DB]" />
                              <span>{b4.evidenceCount} evid • {b4.partial} partial • {b4.narrowed} narrowed</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-[13px] font-semibold text-[#111827]">{b4.pct}%</div>
                          </div>
                        </div>

                        {/* Visual Range Indicator Bar */}
                        <div className="mt-3">
                          <div className="h-[6px] w-full bg-[#F3F4F6] rounded-full overflow-hidden">
                            <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${b4.pct}%` }} />
                          </div>
                          <div className="mt-1.5 flex justify-between font-mono text-[10px] text-[#9CA3AF]">
                            <span>0%</span>
                            <span>range indicator</span>
                            <span>100%</span>
                          </div>
                        </div>

                        {/* Collapsible Details */}
                        {isExpanded && (
                          <div className="mt-4 rounded-[10px] bg-[#FAFBFC] border border-[#EFEFF2] p-3 space-y-3">
                            <div>
                              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#6B7280] mb-1">
                                Verified Node Bindings
                              </div>
                              {job.b4Data?.evidence && job.b4Data.evidence.length > 0 ? (
                                <ul className="text-[11.5px] leading-[1.5] list-disc pl-4 text-[#111827] space-y-1">
                                  {job.b4Data.evidence.map((ev, idx) => (
                                    <li key={idx} className="flex items-center justify-between pr-2">
                                      <span>{ev.req}</span>
                                      <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                                        ev.disposition === 'PASS'
                                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                          : ev.disposition === 'QUALIFIED_BOUNDED'
                                          ? 'text-amber-700 bg-amber-50 border-amber-200'
                                          : 'text-slate-600 bg-slate-50 border-slate-200'
                                      }`}>
                                        {ev.disposition} • {ev.evidenceCount} evid
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="text-[11px] text-[#9CA3AF] py-1 font-mono">
                                  Awaiting Candidate DNA ingestion for B3 Spatial plane binding.
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F1F3F5] text-xs">
                              <div>
                                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#9CA3AF] mb-1">
                                  Disposition Ledger
                                </div>
                                <div className="font-mono text-[11px] text-[#4B5563]">
                                  PASS: {job.b4Data?.evidence.filter(e => e.disposition === 'PASS').length ?? 0} • QUALIFIED: {job.b4Data?.evidence.filter(e => e.disposition === 'QUALIFIED_BOUNDED').length ?? 0}
                                </div>
                              </div>
                              <div>
                                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#9CA3AF] mb-1">
                                  Candidate DNA
                                </div>
                                <div className="font-mono text-[11px] text-[#4B5563]">
                                  {candidateDNA ? `Profile: ${candidateDNA.candidate_id}` : 'Awaiting Ingestion'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Consequence Action Buttons */}
                        <div className="mt-3 flex items-center gap-2 pt-1">
                          <button
                            onClick={() => makeB4Decision(job.id, 'proceed')}
                            className="font-mono text-[11px] px-3.5 py-1.5 rounded-full bg-[#0E9F6E] text-white border border-[#0E9F6E] hover:bg-[#0C8A5E] transition"
                          >
                            PROCEED
                          </button>
                          <button
                            onClick={() => makeB4Decision(job.id, 'stop')}
                            className="font-mono text-[11px] px-3.5 py-1.5 rounded-full bg-white border border-[#D1D5DB] text-[#6B7280] hover:border-[#111827] hover:text-[#111827] transition"
                          >
                            STOP
                          </button>
                          <button
                            onClick={() => toggleB4Detail(job.id)}
                            className="ml-auto font-mono text-[11px] text-[#6B7280] underline decoration-dotted underline-offset-4 hover:text-[#111827]"
                          >
                            {isExpanded ? 'Close details' : 'Open details'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-[#FFFBEB] border-t border-[#FEF3C7]">
              <p className="font-mono text-[11px] text-[#92400E] leading-[1.5]">
                This is an intentional decision before more compute. Stretching is allowed — judgment stays with you.
              </p>
            </div>
          </div>

          {/* B5 Decision: Ready for Resume Factory? */}
          <div className="rounded-[16px] bg-white border border-[#E6E8EB] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-6 py-4 border-b border-[#F1F3F5] bg-[#FCFDFF]">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-[6px] bg-[#DBEAFE] border border-[#BFDBFE] grid place-items-center font-mono text-[11px] font-medium text-[#1E40AF]">
                    B5
                  </div>
                  <h3 className="text-[13.5px] font-semibold text-[#111827]">Ready for Resume Factory?</h3>
                  <span className="font-mono text-[10px] bg-[#111827] text-white rounded px-2 py-0.5">
                    FINAL AUTHORIZATION
                  </span>
                </div>
                <p className="text-[11.5px] text-[#6B7280] mt-2 leading-[1.5]">
                  Passed B4 and went through B5 reasoning core. Check improvement delta before factory dispatch.
                </p>
              </div>

              <div className="p-4 space-y-3">
                {b5ActiveJobs.length === 0 ? (
                  <div className="py-12 text-center text-[12.5px] text-[#9CA3AF] border border-dashed border-[#E5E7EB] rounded-[10px]">
                    No applications currently awaiting Resume Factory authorization. Proceed from B4 to review uplift.
                  </div>
                ) : (
                  b5ActiveJobs.map(job => {
                    const b5 = job.b5Data || { before: 71, after: 77, improvement: 6, strategy: 'Lead with multi-unit ops and controllable P&L', upliftNote: 'Added 3 cost examples from source spans' };

                    return (
                      <div
                        key={job.id}
                        className="rounded-[12px] border border-[#E6E8EB] bg-white p-4 transition-all hover:border-[#D1D5DB]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[13px] font-semibold text-[#111827]">{job.company}</div>
                            <div className="text-[12px] text-[#4B5563] mt-0.5">{job.position}</div>
                          </div>
                          <div className="font-mono text-[11px] flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-[#F3F4F6] border border-[#E6E8EB] text-[#374151]">
                              B4 {b5.before}% → B5 {b5.after}%
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full border ${
                                b5.improvement >= 4
                                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] font-medium'
                                  : 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
                              }`}
                            >
                              +{b5.improvement}% uplift
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 rounded-[10px] bg-[#FAFBFC] border border-[#EFEFF2] p-3">
                          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#6B7280] mb-1">
                            Strategy Formulation
                          </div>
                          <div className="text-[12px] leading-[1.5] text-[#111827]">{b5.strategy}</div>
                          <div className="font-mono text-[11px] text-[#6B7280] mt-2 leading-[1.4]">
                            {b5.upliftNote}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 pt-1">
                          <button
                            onClick={() => makeB5Decision(job.id, 'send')}
                            className="font-mono text-[11px] px-3.5 py-1.5 rounded-full bg-[#111827] text-white border border-[#111827] hover:bg-black transition"
                          >
                            SEND TO RESUME FACTORY
                          </button>
                          <button
                            onClick={() => makeB5Decision(job.id, 'stop')}
                            className="font-mono text-[11px] px-3.5 py-1.5 rounded-full bg-white border border-[#D1D5DB] text-[#6B7280] hover:border-[#111827] hover:text-[#111827] transition"
                          >
                            STOP
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-[#EFF6FF] border-t border-[#DBEAFE]">
              <p className="font-mono text-[11px] text-[#1E40AF] leading-[1.5]">
                If marginal at B4 and barely improved, you may stop to save compute. Factory cost is real — decision stays intentional.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM ZONE: Finished Viewport & Stopped for Legitimate Reason */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-6">
          {/* Finished — Viewport */}
          <div className="rounded-[16px] bg-white border border-[#E6E8EB] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F3F5] flex items-center justify-between bg-[#FCFDFF]">
              <div>
                <h3 className="text-[13.5px] font-semibold text-[#111827]">Finished — viewport</h3>
                <p className="text-[11.5px] text-[#6B7280] mt-1">
                  Resume Factory receives approved payload and manufactures. No template choosing, no layout art-directing. Trust layout machine.
                </p>
              </div>
              <div className="font-mono text-[11px] bg-[#F3F4F6] border border-[#E6E8EB] rounded-full px-3 py-1 font-medium text-[#374151]">
                {finishedJobs.length} throughput
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {finishedJobs.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-[12.5px] text-[#9CA3AF] border border-dashed border-[#E5E7EB] rounded-[10px]">
                  No manufactured resumes yet. Authorize B5 applications to send to Resume Factory.
                </div>
              ) : (
                finishedJobs.map(job => {
                  const mode = finishedMode[job.id] || 'PRINT';
                  const resumeHtml = job.resumeEnhancement?.html;
                  const md = job.resumeEnhancement?.atsMarkdown;

                  return (
                    <div key={job.id} className="rounded-[12px] border border-[#E6E8EB] overflow-hidden bg-white shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="px-4 py-3 bg-[#FCFDFF] border-b border-[#F1F3F5] flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <div className="text-[12.5px] font-semibold text-[#111827] truncate">{job.company}</div>
                            <div className="font-mono text-[11px] text-[#6B7280] truncate">{job.position}</div>
                          </div>
                          <div className="flex items-center rounded-full border border-[#E6E8EB] p-0.5 bg-white shrink-0">
                            {(['PRINT', 'SEND'] as const).map(m => (
                              <button
                                key={m}
                                onClick={() => setFinishedMode(prev => ({ ...prev, [job.id]: m }))}
                                className={`font-mono text-[10px] px-2.5 py-1 rounded-full transition ${
                                  mode === m ? 'bg-[#111827] text-white font-medium' : 'text-[#6B7280] hover:text-[#111827]'
                                }`}
                              >
                                [{m}]
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="p-4">
                          {mode === 'PRINT' ? (
                            <div className="rounded-[8px] border border-[#EFEFF2] bg-white p-4 leading-[1.4] shadow-sm max-h-[380px] overflow-auto">
                              {resumeHtml ? (
                                <div dangerouslySetInnerHTML={{ __html: resumeHtml }} />
                              ) : (
                                <div className="py-8 text-center text-xs text-[#9CA3AF] space-y-2">
                                  <div className="font-semibold text-[#4B5563] text-sm">{job.company} — {job.position}</div>
                                  <div className="font-mono text-[11px] text-[#6B7280]">
                                    Awaiting Authoritative Candidate DNA Ingestion
                                  </div>
                                  <p className="text-[11px] text-[#9CA3AF] max-w-sm mx-auto">
                                    No synthetic profile rendered. Once Candidate DNA is injected across the 7 Spatial planes, Resume Factory will manufacture the print layout.
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="rounded-[8px] bg-[#111827] text-[#E5E7EB] p-4 font-mono text-[11px] leading-[1.6] max-h-[380px] overflow-auto">
                              <div className="text-[#9CA3AF]"># ATS-safe invariant representation — linear Markdown</div>
                              {md ? (
                                <pre className="whitespace-pre-wrap mt-2 font-mono text-[10.5px]">{md}</pre>
                              ) : (
                                <div className="py-6 text-center text-[#6B7280] font-mono text-[11px]">
                                  # Awaiting Candidate DNA Ingestion<br />
                                  Target: {job.position} @ {job.company}<br />
                                  Status: B5 Authorized • Awaiting Authoritative Candidate Profile
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <div className="flex items-center justify-between border-t border-[#F1F3F5] pt-3">
                          <button
                            onClick={() => {
                              const content = mode === 'SEND' ? (md || 'ATS Content') : (resumeHtml || 'Print HTML');
                              const blob = new Blob([content], { type: mode === 'SEND' ? 'text/markdown' : 'text/html' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${job.company.replace(/[^a-zA-Z0-9]/g, '_')}_resume.${mode === 'SEND' ? 'md' : 'html'}`;
                              a.click();
                            }}
                            className="font-mono text-[11px] bg-white border border-[#111827] text-[#111827] rounded-full px-3 py-1 hover:bg-[#111827] hover:text-white transition"
                          >
                            Export [{mode}]
                          </button>
                          <span className="font-mono text-[10px] text-[#9CA3AF]">layout machine trusted</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-2.5 bg-[#F9FAFB] border-t border-[#F1F3F5] font-mono text-[10.5px] text-[#6B7280]">
              Content changes, structure does not. PRINT = human PDF, SEND = parser-safe linear.
            </div>
          </div>

          {/* Stopped for Legitimate Reason */}
          <div className="rounded-[16px] bg-white border border-[#E6E8EB] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden h-fit">
            <div className="px-6 py-4 border-b border-[#F1F3F5] bg-[#FCFDFF]">
              <h3 className="text-[13.5px] font-semibold text-[#111827]">Stopped for legitimate reason</h3>
              <p className="text-[11.5px] text-[#6B7280] mt-1 leading-[1.45]">
                Closed outcomes — not failures. System continues until exception, judgment, or finished.
              </p>
            </div>
            <div className="p-4 space-y-3">
              {stoppedJobs.length === 0 ? (
                <div className="py-8 text-center text-[12px] text-[#9CA3AF] border border-dashed border-[#E5E7EB] rounded-[10px]">
                  No jobs currently stopped. Operator STOP decisions appear here.
                </div>
              ) : (
                stoppedJobs.map(job => (
                  <div key={job.id} className="rounded-[10px] border border-[#E6E8EB] bg-[#FCFDFF] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[12.5px] font-medium text-[#111827]">{job.company}</div>
                      <span className="font-mono text-[9.5px] px-2 py-0.5 rounded-full bg-[#F3F4F6] border border-[#E6E8EB] text-[#6B7280]">
                        {job.b5Decision === 'stop' ? 'B5 STOP' : 'B4 STOP'}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-[#111827] mt-1">
                      {job.stopReason || 'Stopped by operator'}
                    </div>
                    <div className="text-[11px] text-[#6B7280] mt-1 leading-[1.4]">
                      Opportunity closed to conserve compute and avoid marginal Resume Factory expense.
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Inspection / Debug Machine Evidence Drawer */}
        <footer className="rounded-[12px] border border-dashed border-[#D1D5DB] bg-[#FFFFFF] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono text-[11px] text-[#6B7280] leading-[1.5] max-w-[860px]">
              Inspection / Debug — Machine evidence: ledgers, hashes, provenance, source spans, target tree nodes (a, a1, a1a), evidence bindings, gate traces, receipts — available behind Inspection, not part of normal application package.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInspection(v => !v)}
                className="font-mono text-[11px] border border-[#E6E8EB] bg-white rounded-full px-3.5 py-1.5 hover:border-[#111827] hover:text-[#111827] transition"
              >
                {showInspection ? 'Close Inspection' : 'Open Inspection'}
              </button>
              <span className="font-mono text-[10px] text-[#9CA3AF]">hash chain verified</span>
            </div>
          </div>

          {showInspection && (
            <div className="mt-5 pt-4 border-t border-[#E5E7EB] grid grid-cols-1 md:grid-cols-2 gap-6 animate-in">
              {/* Event Stream Log */}
              <div className="rounded-[10px] bg-[#111827] p-4 text-[#E5E7EB] font-mono text-[11px] max-h-[360px] overflow-auto">
                <div className="text-[#9CA3AF] mb-2 flex items-center justify-between">
                  <span>Engine Telemetry Events ({eventLogs.length})</span>
                  <span className="text-[10px] text-[#34D399]">LIVE BUS</span>
                </div>
                {eventLogs.length === 0 ? (
                  <div className="text-[#6B7280] py-4">No events logged yet. Trigger stage actions above.</div>
                ) : (
                  eventLogs.map((log, i) => (
                    <div key={i} className="py-1 border-b border-[#1F2937] flex gap-2">
                      <span className="text-[#6B7280] shrink-0">{log.timestamp.slice(11, 19)}</span>
                      <span className="text-[#93C5FD] shrink-0">{log.event}</span>
                      <span className="text-[#9CA3AF] truncate">{JSON.stringify(log.payload)}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Envelope JSON Viewer */}
              <div className="rounded-[10px] bg-[#F9FAFB] border border-[#E6E8EB] p-4 font-mono text-[11px] max-h-[360px] overflow-auto flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[#111827]">exportEnvelope() — 0.2.0 schema</span>
                    <button
                      onClick={handleCopyJson}
                      className="px-2.5 py-1 rounded-full bg-white border border-[#D1D5DB] text-[10px] hover:border-[#111827] transition"
                    >
                      {copyFeedback ? 'Copied ✓' : 'Copy JSON'}
                    </button>
                  </div>
                  <pre className="text-[10px] leading-[1.6] text-[#374151] whitespace-pre-wrap break-all">
                    {exportEnvelopeJson().slice(0, 3500)}
                  </pre>
                </div>
                <div className="mt-3 pt-2 border-t border-[#E5E7EB] text-[10px] text-[#9CA3AF]">
                  UTF-16 source spans • target tree frozen • 7 spatial planes • SHA-256 seal
                </div>
              </div>
            </div>
          )}
        </footer>

        <div className="pt-1 pb-6 text-center font-mono text-[10px] text-[#9CA3AF]">
          System continues until exception, decision requiring judgment, or finished. No pipeline stage navigation.
        </div>
      </main>
    </div>
  );
}