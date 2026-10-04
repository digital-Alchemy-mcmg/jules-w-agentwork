import React, { useState } from 'react';
import { useMara, ApplicationItem, JobStatus } from '../../context/MaraContext';

interface Props {
  onAdvance: () => void;
}

function DispositionBadge({ pct }: { pct?: number }) {
  if (!pct) return null;
  const color = pct >= 85 ? 'text-emerald-600' : pct >= 70 ? 'text-amber-600' : 'text-rose-500';
  return <span className={`font-mono text-xs ${color}`}>{pct}%</span>;
}

function JobRow({
  job,
  selected,
  onSelect,
  onAction,
  expanded,
  onExpand,
}: {
  job: ApplicationItem;
  selected: boolean;
  onSelect: () => void;
  onAction: (s: JobStatus) => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  const statusStyles: Record<JobStatus, string> = {
    pending: 'text-[color:var(--muted-foreground)]',
    kept: 'text-emerald-600',
    deleted: 'text-rose-400 line-through opacity-50',
    pushed: 'text-[color:var(--accent)] font-semibold',
  };

  if (job.status === 'deleted') {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[color:var(--border)] opacity-40">
        <input type="checkbox" checked={selected} onChange={onSelect} className="accent-[color:var(--accent)]" />
        <span className="text-xs text-[color:var(--muted-foreground)] line-through flex-1">{job.position} · {job.company}</span>
        <button onClick={() => onAction('pending')} className="text-[11px] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]">restore</button>
      </div>
    );
  }

  return (
    <div className={`border-b border-[color:var(--border)] transition-colors ${selected ? 'bg-blue-50/40 dark:bg-blue-950/20' : 'hover:bg-[color:var(--secondary)]'}`}>
      <div
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
        onClick={onExpand}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={e => { e.stopPropagation(); onSelect(); }}
          onClick={e => e.stopPropagation()}
          className="accent-[color:var(--accent)] shrink-0"
        />
        {/* Expand chevron */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`shrink-0 text-[color:var(--muted-foreground)] transition-transform ${expanded ? 'rotate-90' : ''}`}
        >
          <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        {/* Title + Company */}
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium ${statusStyles[job.status]}`}>{job.position}</span>
          <span className="text-[color:var(--muted-foreground)] text-xs ml-2">·</span>
          <span className="text-xs text-[color:var(--muted-foreground)] ml-2">{job.company}</span>
        </div>

        {/* Location */}
        <span className="text-xs text-[color:var(--muted-foreground)] hidden sm:block w-36 truncate">{job.location}</span>

        {/* Pay */}
        <span className="text-xs font-mono text-[color:var(--foreground)] w-28 text-right">{job.pay}</span>

        {/* Match */}
        <div className="w-10 text-right">
          <DispositionBadge pct={job.b4Data?.pct} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
          <button
            title="Keep"
            onClick={() => onAction('kept')}
            className={`p-1.5 rounded transition-colors ${job.status === 'kept' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' : 'text-[color:var(--muted-foreground)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'}`}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button
            title="Push forward to B4"
            onClick={() => onAction('pushed')}
            className={`p-1.5 rounded transition-colors ${job.status === 'pushed' ? 'text-[color:var(--accent)] bg-blue-50 dark:bg-blue-950' : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--accent)] hover:bg-blue-50 dark:hover:bg-blue-950'}`}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3 6.5h7M7 4l3 2.5L7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button
            title="Delete"
            onClick={() => onAction('deleted')}
            className="p-1.5 rounded text-[color:var(--muted-foreground)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 3.5h8M5 3.5V2.5h3v1M4 3.5v7h5v-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-10 pb-4 pt-1 bg-[color:var(--secondary)] border-t border-[color:var(--border)] text-xs space-y-3">
          <p className="text-[color:var(--muted-foreground)]">{job.snippet || job.jd}</p>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1 font-mono">Job Description Excerpt</div>
            <div className="font-mono text-xs bg-[color:var(--card)] p-2 rounded border border-[color:var(--border)] text-[color:var(--foreground)] leading-relaxed">
              {job.jd}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1 font-mono">Atomic Facts Extracted ({job.atomicFacts.length})</div>
            <div className="flex flex-wrap gap-1">
              {job.atomicFacts.map((fact, idx) => (
                <span key={idx} className="font-mono text-[11px] bg-[color:var(--card)] px-2 py-0.5 rounded border border-[color:var(--border)] text-[color:var(--muted-foreground)]">
                  {fact}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkspaceCorpus({ onAdvance }: Props) {
  const { applications, setJobStatus, bulkSetStatus, pushJobsForward } = useMara();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'kept' | 'pushed' | 'deleted'>('all');

  const visibleJobs = applications.filter(j => {
    if (filter === 'all') return j.status !== 'deleted';
    return j.status === filter;
  });

  const pushedCount = applications.filter(j => j.status === 'pushed').length;

  const toggleSelect = (id: string) => {
    const s = new Set(selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedIds(s);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleJobs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleJobs.map(j => j.id)));
    }
  };

  const handleBulk = (status: JobStatus) => {
    const ids = [...selectedIds];
    bulkSetStatus(ids, status);
    setSelectedIds(new Set());
  };

  const handlePushSelected = async () => {
    const ids = [...selectedIds];
    await pushJobsForward(ids);
    setSelectedIds(new Set());
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[color:var(--muted-foreground)] mb-1">Corpus</p>
          <h1 className="text-2xl font-semibold text-[color:var(--foreground)] leading-tight">Observations</h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">{applications.length} results collected · review and select candidates to push</p>
        </div>
        <button
          onClick={onAdvance}
          disabled={pushedCount === 0}
          className="px-4 py-2 rounded text-sm font-medium bg-[color:var(--primary)] text-[color:var(--primary-foreground)] disabled:opacity-30 hover:opacity-90 transition-opacity"
        >
          Review {pushedCount} at B4 Gate →
        </button>
      </div>

      {/* Filter / Bulk Bar */}
      <div className="flex items-center justify-between py-2 border-b border-[color:var(--border)] mb-2 text-xs">
        <div className="flex items-center gap-1">
          {(['all', 'pending', 'kept', 'pushed', 'deleted'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded capitalize transition-colors ${
                filter === f
                  ? 'bg-[color:var(--secondary)] text-[color:var(--foreground)] font-medium'
                  : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
              }`}
            >
              {f} ({applications.filter(j => f === 'all' ? j.status !== 'deleted' : j.status === f).length})
            </button>
          ))}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[color:var(--muted-foreground)]">{selectedIds.size} selected</span>
            <button onClick={() => handleBulk('kept')} className="px-2 py-1 rounded border border-[color:var(--border)] bg-[color:var(--card)] hover:bg-[color:var(--secondary)] text-[color:var(--foreground)]">Keep</button>
            <button onClick={handlePushSelected} className="px-2 py-1 rounded bg-[color:var(--accent)] text-white">Push →</button>
            <button onClick={() => handleBulk('deleted')} className="px-2 py-1 rounded border border-[color:var(--border)] hover:bg-rose-50 text-rose-600">Delete</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border border-[color:var(--border)] rounded-md bg-[color:var(--card)] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[color:var(--border)] bg-[color:var(--secondary)] text-[11px] font-medium uppercase tracking-wider text-[color:var(--muted-foreground)]">
          <input
            type="checkbox"
            checked={visibleJobs.length > 0 && selectedIds.size === visibleJobs.length}
            onChange={toggleSelectAll}
            className="accent-[color:var(--accent)]"
          />
          <span className="w-3" />
          <span className="flex-1">Position / Company</span>
          <span className="hidden sm:block w-36">Location</span>
          <span className="w-28 text-right">Compensation</span>
          <span className="w-10 text-right">Match</span>
          <span className="w-20 text-center ml-2">Actions</span>
        </div>

        {/* Rows */}
        {visibleJobs.map(job => (
          <JobRow
            key={job.id}
            job={job}
            selected={selectedIds.has(job.id)}
            onSelect={() => toggleSelect(job.id)}
            onAction={status => setJobStatus(job.id, status)}
            expanded={expandedId === job.id}
            onExpand={() => setExpandedId(expandedId === job.id ? null : job.id)}
          />
        ))}

        {visibleJobs.length === 0 && (
          <div className="p-8 text-center text-xs text-[color:var(--muted-foreground)]">
            No observations matching the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}