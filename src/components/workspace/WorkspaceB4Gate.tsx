import React, { useState } from 'react';
import { useMara, ApplicationItem } from '../../context/MaraContext';

interface Props {
  threshold: number;
  onThresholdChange: (n: number) => void;
  onAdvance: () => void;
}

type Disposition = 'PASS' | 'QUALIFIED' | 'UNRESOLVED' | 'FAIL';

function dispositionColor(d?: Disposition) {
  if (d === 'PASS') return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
  if (d === 'QUALIFIED') return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
  if (d === 'UNRESOLVED') return 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700';
  return 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800';
}

function MatchBar({ pct, threshold }: { pct: number; threshold: number }) {
  const passes = pct >= threshold;
  const color = passes ? 'bg-emerald-500' : pct >= threshold - 10 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="relative h-1 w-full bg-[color:var(--muted)] rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      {/* threshold marker */}
      <div
        className="absolute top-0 bottom-0 w-px bg-[color:var(--foreground)] opacity-20"
        style={{ left: `${threshold}%` }}
      />
    </div>
  );
}

export default function WorkspaceB4Gate({ threshold, onThresholdChange, onAdvance }: Props) {
  const { applications, makeB4Decision } = useMara();

  // All jobs that are pushed to B4
  const pushJobs = applications.filter(j => j.status === 'pushed' || j.currentStage === 'b4' || j.currentStage === 'b5' || j.currentStage === 'stop_before_resume_factory');
  const sorted = [...pushJobs].sort((a, b) => (b.b4Data?.pct ?? 0) - (a.b4Data?.pct ?? 0));

  const [passing, setPassing] = useState<Set<string>>(() => {
    return new Set(pushJobs.filter(j => (j.b4Data?.pct ?? 0) >= threshold && !j.isStopped).map(j => j.id));
  });

  const autoPass = pushJobs.filter(j => (j.b4Data?.pct ?? 0) >= threshold);
  const totalReqs = pushJobs.reduce((acc, j) => acc + (j.b4Data?.total || j.atomicFacts.length || 24), 0);
  const matchedReqs = pushJobs.reduce((acc, j) => acc + (j.b4Data?.supported || 16), 0);

  const togglePass = (id: string) => {
    const s = new Set(passing);
    s.has(id) ? s.delete(id) : s.add(id);
    setPassing(s);
  };

  const handleThreshold = (v: number) => {
    onThresholdChange(v);
    setPassing(new Set(pushJobs.filter(j => (j.b4Data?.pct ?? 0) >= v && !j.isStopped).map(j => j.id)));
  };

  const handleAdvance = async () => {
    // For each passing job, if not yet at B5, make B4 decision = 'proceed'
    for (const id of passing) {
      await makeB4Decision(id, 'proceed');
    }
    onAdvance();
  };

  if (pushJobs.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 animate-in">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[color:var(--muted-foreground)] mb-1">B4 Gate</p>
        <h1 className="text-2xl font-semibold text-[color:var(--foreground)] mb-4">Match Gate</h1>
        <div className="border border-[color:var(--border)] rounded-md bg-[color:var(--card)] p-8 text-center text-sm text-[color:var(--muted-foreground)]">
          No observations pushed to B4. Go to Corpus and push jobs forward, or pin jobs in Operator interface.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[color:var(--muted-foreground)] mb-1">B4 Gate</p>
          <h1 className="text-2xl font-semibold text-[color:var(--foreground)] leading-tight">Spatial DNA Match</h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">Review match percentages and select which observations advance to B5.</p>
        </div>
        <button
          onClick={handleAdvance}
          disabled={passing.size === 0}
          className="px-4 py-2 rounded text-sm font-medium bg-[color:var(--primary)] text-[color:var(--primary-foreground)] disabled:opacity-30 hover:opacity-90 transition-opacity"
        >
          Advance {passing.size} to B5 →
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pushed', value: pushJobs.length },
          { label: 'Requirements', value: totalReqs },
          { label: 'Supported', value: matchedReqs },
          { label: 'Passing', value: passing.size },
        ].map(s => (
          <div key={s.label} className="border border-[color:var(--border)] rounded bg-[color:var(--card)] px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--muted-foreground)] mb-1">{s.label}</div>
            <div className="text-xl font-semibold font-mono text-[color:var(--foreground)]">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Threshold Slider */}
      <div className="border border-[color:var(--border)] rounded-md bg-[color:var(--card)] p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
            Pass Threshold
          </label>
          <span className="font-mono text-sm font-semibold text-[color:var(--foreground)]">{threshold}%</span>
        </div>
        <input
          type="range"
          min={50}
          max={95}
          step={5}
          value={threshold}
          onChange={e => handleThreshold(Number(e.target.value))}
          className="w-full accent-[color:var(--primary)] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-[color:var(--muted-foreground)] mt-1">
          <span>50% (Permissive)</span>
          <span>75% (Standard)</span>
          <span>95% (Strict)</span>
        </div>
      </div>

      {/* Observation Cards */}
      <div className="space-y-3">
        {sorted.map(job => {
          const pct = job.b4Data?.pct ?? 70;
          const isPass = passing.has(job.id);
          const disp: Disposition = pct >= 80 ? 'PASS' : pct >= 70 ? 'QUALIFIED' : 'UNRESOLVED';
          const isJobStopped = job.isStopped;

          return (
            <div
              key={job.id}
              onClick={() => togglePass(job.id)}
              className={`border rounded-md bg-[color:var(--card)] p-4 transition-all cursor-pointer ${
                isPass
                  ? 'border-[color:var(--primary)] shadow-sm'
                  : 'border-[color:var(--border)] opacity-70 hover:opacity-100'
              } ${isJobStopped ? 'bg-rose-50/20 border-rose-200' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isPass}
                    onChange={() => togglePass(job.id)}
                    onClick={e => e.stopPropagation()}
                    className="accent-[color:var(--primary)] shrink-0"
                  />
                  <div>
                    <span className="text-sm font-semibold text-[color:var(--foreground)]">{job.position}</span>
                    <span className="text-xs text-[color:var(--muted-foreground)] ml-2">· {job.company}</span>
                    {isJobStopped && (
                      <span className="ml-2 font-mono text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded border border-rose-200">
                        STOPPED IN OPERATOR
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${dispositionColor(disp)}`}>
                    {disp}
                  </span>
                  <span className="font-mono text-base font-semibold text-[color:var(--foreground)]">{pct}%</span>
                </div>
              </div>

              {/* Match progress bar */}
              <div className="mb-3">
                <MatchBar pct={pct} threshold={threshold} />
              </div>

              {/* Evidence Counts */}
              <div className="flex items-center justify-between text-xs text-[color:var(--muted-foreground)] font-mono">
                <span>{job.b4Data?.supported || 18} of {job.b4Data?.total || 24} requirements supported</span>
                <span>{job.b4Data?.evidenceCount || 38} verified spans</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}