import React, { useState } from 'react';
import { useMara, ApplicationItem } from '../../context/MaraContext';

interface Props {
  passingIds: string[];
}

function ScoreDelta({ base, enhanced }: { base: number; enhanced: number }) {
  const delta = enhanced - base;
  const color = delta >= 15 ? 'text-emerald-600' : delta >= 5 ? 'text-amber-600' : 'text-rose-500';
  return (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--muted-foreground)] mb-1">Baseline</div>
        <div className="font-mono text-2xl font-semibold text-[color:var(--muted-foreground)]">{base}<span className="text-base">%</span></div>
      </div>
      <div className={`text-sm font-medium ${color}`}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="inline-block">
          <path d="M5 10h10M12 7l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        +{delta}
      </div>
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--muted-foreground)] mb-1">Enhanced</div>
        <div className={`font-mono text-2xl font-semibold ${enhanced >= 85 ? 'text-emerald-600' : enhanced >= 70 ? 'text-amber-600' : 'text-rose-500'}`}>{enhanced}<span className="text-base">%</span></div>
      </div>
    </div>
  );
}

export default function WorkspaceB5Resume({ passingIds }: Props) {
  const { applications, makeB5Decision } = useMara();

  // All jobs that have reached B5 or finished
  const b5Candidates = applications.filter(j =>
    (passingIds.includes(j.id) || j.currentStage === 'b5' || j.currentStage === 'stop_before_resume_factory' || j.b5Decision === 'send') &&
    !j.isStopped
  );

  const [activeIdx, setActiveIdx] = useState(0);
  const [view, setView] = useState<'preview' | 'print' | 'ats'>('preview');

  if (b5Candidates.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 animate-in">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[color:var(--muted-foreground)] mb-1">B5 Resume Factory</p>
        <h1 className="text-2xl font-semibold text-[color:var(--foreground)] mb-4">Resume Factory</h1>
        <div className="border border-[color:var(--border)] rounded-md bg-[color:var(--card)] p-8 text-center text-sm text-[color:var(--muted-foreground)]">
          No observations advanced to B5 Resume Factory yet. Advance passing opportunities in B4 Gate or authorize PROCEED in Operator interface.
        </div>
      </div>
    );
  }

  const job = b5Candidates[Math.min(activeIdx, b5Candidates.length - 1)];
  const b5Data = job.b5Data || { before: 71, after: 77, improvement: 6, strategy: 'Controllable P&L', prismOwner: 'Independent Staffing-Firm Owner' };
  const enh = job.resumeEnhancement || {
    baselineScore: b5Data.before,
    enhancedScore: b5Data.after,
    strategy: b5Data.strategy,
    html: `<div style="font-family:sans-serif;padding:32px;text-align:center;color:#6b7280;"><h2 style="color:#111827;">${job.position} — ${job.company}</h2><p style="margin-top:8px;font-family:monospace;font-size:12px;">Awaiting Authoritative Candidate DNA Ingestion</p><p style="margin-top:12px;font-size:13px;max-width:440px;margin-left:auto;margin-right:auto;">Spatial DNA planes (Experience, Skills, Education, Certifications, Operations, Leadership, Performance) not yet bound to target tree nodes.</p></div>`,
    atsMarkdown: `# ${job.position} — ${job.company}\n\n[AWAITING AUTHORITATIVE CANDIDATE DNA INGESTION]\nStatus: B5 Authorized • Spatial DNA Plane Binding Pending\n`
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${job.position} — Resume</title><style>*{box-sizing:border-box}body{margin:0;padding:0;background:#fff}@media print{body{-webkit-print-color-adjust:exact}}</style></head><body>${enh.html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const handleAuthorizeResume = async () => {
    await makeB5Decision(job.id, 'send');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[color:var(--muted-foreground)] mb-1">B5 Resume Factory</p>
          <h1 className="text-2xl font-semibold text-[color:var(--foreground)] leading-tight">Resume Rendering</h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">{b5Candidates.length} resume{b5Candidates.length !== 1 ? 's' : ''} active · review, authorize, and export</p>
        </div>
        <div className="flex gap-2">
          {job.currentStage !== 'stop_before_resume_factory' && job.b5Decision !== 'send' ? (
            <button
              onClick={handleAuthorizeResume}
              className="px-4 py-2 rounded text-sm font-medium bg-[#111827] text-white hover:bg-black transition-colors"
            >
              Authorize Factory Run →
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
              MANUFACTURED ✓
            </span>
          )}
          <button
            onClick={handlePrint}
            className="no-print px-4 py-2 rounded text-sm font-medium border border-[color:var(--border)] bg-[color:var(--secondary)] hover:bg-[color:var(--muted)] text-[color:var(--secondary-foreground)] transition-colors flex items-center gap-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="2" y="4" width="9" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M4 4V2.5h5V4M4 10h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            Print / PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-5">
        {/* Sidebar: resume list */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--muted-foreground)] mb-2 px-1">Applications</p>
          {b5Candidates.map((j, i) => {
            const b = j.b5Data?.before || 71;
            const a = j.b5Data?.after || 77;
            const isActive = i === activeIdx;
            return (
              <button
                key={j.id}
                onClick={() => setActiveIdx(i)}
                className={`w-full text-left px-3 py-2.5 rounded border transition-colors ${isActive ? 'border-[color:var(--accent)] bg-blue-50/50 dark:bg-blue-950/20' : 'border-[color:var(--border)] bg-[color:var(--card)] hover:bg-[color:var(--secondary)]'}`}
              >
                <div className="text-xs font-medium text-[color:var(--foreground)] truncate mb-0.5">{j.position}</div>
                <div className="text-[11px] text-[color:var(--muted-foreground)] truncate mb-1.5">{j.company}</div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-[color:var(--muted-foreground)]">{b}%</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M6 3l2 2-2 2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" className="text-[color:var(--muted-foreground)]"/></svg>
                  <span className={`font-mono text-[11px] font-medium ${a >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>{a}%</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="space-y-4">
          {/* Uplift Summary Bar */}
          <div className="border border-[color:var(--border)] rounded-md bg-[color:var(--card)] p-4 flex items-center justify-between">
            <ScoreDelta base={enh.baselineScore} enhanced={enh.enhancedScore} />
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--muted-foreground)] mb-1">Prism Evaluator</div>
              <div className="text-xs font-medium text-[color:var(--foreground)]">{b5Data.prismOwner || 'Independent Staffing-Firm Owner'}</div>
            </div>
          </div>

          {/* Strategy Note */}
          <div className="border border-[color:var(--border)] rounded-md bg-[color:var(--secondary)] p-3 text-xs leading-relaxed text-[color:var(--secondary-foreground)]">
            <span className="font-semibold text-[color:var(--foreground)]">Strategic Emphasis: </span>
            {enh.strategy}
          </div>

          {/* View Toggle Tabs */}
          <div className="flex border-b border-[color:var(--border)] text-xs font-medium">
            <button
              onClick={() => setView('preview')}
              className={`px-4 py-2 border-b-2 transition-colors ${view === 'preview' ? 'border-[color:var(--primary)] text-[color:var(--primary)] font-semibold' : 'border-transparent text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'}`}
            >
              Visual Preview
            </button>
            <button
              onClick={() => setView('ats')}
              className={`px-4 py-2 border-b-2 transition-colors ${view === 'ats' ? 'border-[color:var(--primary)] text-[color:var(--primary)] font-semibold' : 'border-transparent text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'}`}
            >
              ATS Semantic Markdown
            </button>
          </div>

          {/* Document Content View */}
          {view === 'preview' ? (
            <div className="border border-[color:var(--border)] rounded-md bg-[color:var(--card)] p-6 shadow-sm overflow-auto max-h-[500px]">
              <div dangerouslySetInnerHTML={{ __html: enh.html }} />
            </div>
          ) : (
            <div className="border border-[color:var(--border)] rounded-md bg-[#111110] p-4 font-mono text-xs text-[#EDEAE4] overflow-auto max-h-[500px] leading-relaxed">
              <pre className="whitespace-pre-wrap">{enh.atsMarkdown}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}