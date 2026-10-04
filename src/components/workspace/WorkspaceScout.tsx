import React, { useState } from 'react';
import { useMara, DiskConfig } from '../../context/MaraContext';

const PROFILES: { id: DiskConfig['executionProfile']; label: string; desc: string }[] = [
  { id: 'standard', label: 'Standard', desc: 'Balanced collection — deduplication on, active listings only.' },
  { id: 'discovery', label: 'Discovery', desc: 'Broader scope, relaxed deduplication, higher result limit.' },
  { id: 'research', label: 'Research', desc: 'All listings including closed, deep scrape enabled.' },
  { id: 'forensics', label: 'Forensics', desc: 'Maximum depth, zero dedup, full provenance capture.' },
  { id: 'strict', label: 'Strict', desc: 'Post-filtering on, exact match only, lowest limit.' },
];

function ChipInput({
  label, values, onChange, placeholder,
}: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };

  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="block text-[11px] font-medium uppercase tracking-widest text-[color:var(--muted-foreground)] mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] text-xs font-mono">
            {v}
            <button onClick={() => remove(i)} className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors leading-none">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          placeholder={placeholder ?? 'Type and press Enter'}
          className="flex-1 px-3 py-1.5 text-xs border border-[color:var(--border)] rounded bg-[color:var(--card)] text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[color:var(--ring)] font-mono"
        />
        <button onClick={add} className="px-3 py-1.5 text-xs rounded border border-[color:var(--border)] bg-[color:var(--secondary)] hover:bg-[color:var(--muted)] text-[color:var(--secondary-foreground)] transition-colors">Add</button>
      </div>
    </div>
  );
}

interface WorkspaceScoutProps {
  onDispatchNext?: () => void;
}

export default function WorkspaceScout({ onDispatchNext }: WorkspaceScoutProps) {
  const { diskConfig, updateDiskConfig, compileAndCertifyDisk, dispatchDisk, isProcessing } = useMara();

  const handleCompile = async () => {
    await compileAndCertifyDisk();
  };

  const handleDispatch = () => {
    dispatchDisk();
    if (onDispatchNext) {
      setTimeout(onDispatchNext, 400);
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    compiled: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    certified: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    dispatched: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800',
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[color:var(--muted-foreground)] mb-1">Disk Builder</p>
          <h1 className="text-2xl font-semibold text-[color:var(--foreground)] leading-tight">Scout Configuration</h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">Define the collection mission. Compile and certify before dispatch.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-medium uppercase tracking-wide ${statusColors[diskConfig.status]}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {diskConfig.status}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Mission Identity Card */}
        <div className="border border-[color:var(--border)] rounded-md bg-[color:var(--card)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[color:var(--foreground)] uppercase tracking-wide">Mission Identity</span>
            <span className="font-mono text-xs text-[color:var(--muted-foreground)]">{diskConfig.id}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-[color:var(--muted-foreground)] mb-1">Configuration Name</label>
              <input
                value={diskConfig.name}
                onChange={e => updateDiskConfig({ name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-[color:var(--border)] rounded bg-[color:var(--card)] text-[color:var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[color:var(--ring)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-[color:var(--muted-foreground)] mb-1">Role Scope</label>
              <input
                value={diskConfig.roleScope}
                onChange={e => updateDiskConfig({ roleScope: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-[color:var(--border)] rounded bg-[color:var(--card)] text-[color:var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[color:var(--ring)]"
              />
            </div>
          </div>
        </div>

        {/* Territory & Industry Filters */}
        <div className="border border-[color:var(--border)] rounded-md bg-[color:var(--card)] p-5 space-y-4">
          <span className="text-xs font-semibold text-[color:var(--foreground)] uppercase tracking-wide">Territory & Classification</span>
          <ChipInput
            label="Geographic Territory"
            values={diskConfig.territory}
            onChange={v => updateDiskConfig({ territory: v })}
            placeholder="e.g. Detroit, MI or Wayne County"
          />
          <div className="grid grid-cols-2 gap-4 pt-1">
            <ChipInput
              label="NAICS Codes"
              values={diskConfig.naicsCodes}
              onChange={v => updateDiskConfig({ naicsCodes: v })}
              placeholder="e.g. 722511"
            />
            <ChipInput
              label="SOC Codes"
              values={diskConfig.socCodes}
              onChange={v => updateDiskConfig({ socCodes: v })}
              placeholder="e.g. 11-9051"
            />
          </div>
        </div>

        {/* Keywords */}
        <div className="border border-[color:var(--border)] rounded-md bg-[color:var(--card)] p-5 space-y-4">
          <span className="text-xs font-semibold text-[color:var(--foreground)] uppercase tracking-wide">Lexical Boundaries</span>
          <ChipInput
            label="Inclusion Keywords (Role-Scoped)"
            values={diskConfig.inclusionKeywords}
            onChange={v => updateDiskConfig({ inclusionKeywords: v })}
            placeholder="e.g. General Manager, P&L"
          />
          <ChipInput
            label="Exclusion Keywords"
            values={diskConfig.exclusionKeywords}
            onChange={v => updateDiskConfig({ exclusionKeywords: v })}
            placeholder="e.g. junior, intern, -Driver"
          />
        </div>

        {/* Execution Profile */}
        <div className="border border-[color:var(--border)] rounded-md bg-[color:var(--card)] p-5">
          <label className="block text-[11px] font-medium uppercase tracking-widest text-[color:var(--muted-foreground)] mb-3">Execution Profile</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROFILES.map(p => (
              <button
                key={p.id}
                onClick={() => updateDiskConfig({ executionProfile: p.id })}
                className={`text-left p-3 rounded border transition-colors ${
                  diskConfig.executionProfile === p.id
                    ? 'border-[color:var(--primary)] bg-[color:var(--secondary)]'
                    : 'border-[color:var(--border)] hover:bg-[color:var(--secondary)]'
                }`}
              >
                <div className="text-xs font-medium text-[color:var(--foreground)]">{p.label}</div>
                <div className="text-[11px] text-[color:var(--muted-foreground)] mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Footbar */}
        <div className="flex items-center justify-between pt-2 border-t border-[color:var(--border)]">
          <div className="text-xs text-[color:var(--muted-foreground)] font-mono">
            {diskConfig.certHash ? (
              <span className="text-emerald-600 dark:text-emerald-400">Certified: {diskConfig.certHash.slice(0, 24)}…</span>
            ) : (
              'Uncertified disk image'
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCompile}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-medium rounded border border-[color:var(--border)] bg-[color:var(--secondary)] hover:bg-[color:var(--muted)] text-[color:var(--secondary-foreground)] transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Compiling…' : 'Compile & Certify'}
            </button>
            <button
              onClick={handleDispatch}
              disabled={diskConfig.status === 'draft' || isProcessing}
              className="px-4 py-2 text-xs font-medium rounded bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-30"
            >
              Dispatch to Corpus →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}