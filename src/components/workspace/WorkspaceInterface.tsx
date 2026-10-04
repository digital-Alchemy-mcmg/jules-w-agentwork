import React, { useState } from 'react';
import { useMara } from '../../context/MaraContext';
import WorkspaceScout from './WorkspaceScout';
import WorkspaceCorpus from './WorkspaceCorpus';
import WorkspaceB4Gate from './WorkspaceB4Gate';
import WorkspaceB5Resume from './WorkspaceB5Resume';

type Screen = 'scout' | 'corpus' | 'b4' | 'b5';

const NAV: { id: Screen; label: string; short: string }[] = [
  { id: 'scout', label: 'Scout', short: 'Disk Builder' },
  { id: 'corpus', label: 'Corpus', short: 'Observations' },
  { id: 'b4', label: 'B4 Gate', short: 'Match Gate' },
  { id: 'b5', label: 'B5 Factory', short: 'Resume' },
];

function DarkToggle({ dark, onChange }: { dark: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="w-8 h-8 flex items-center justify-center rounded text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--secondary)] transition-colors"
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.2 3.2l1.1 1.1M10.7 10.7l1.1 1.1M3.2 11.8l1.1-1.1M10.7 4.3l1.1-1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M12 8.5A5.5 5.5 0 015.5 2a5.5 5.5 0 100 10A5.5 5.5 0 0012 8.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

export default function WorkspaceInterface() {
  const { applications, diskConfig } = useMara();
  const [screen, setScreen] = useState<Screen>('corpus');
  const [dark, setDark] = useState(false);
  const [b4Threshold, setB4Threshold] = useState(75);
  const [passingIds, setPassingIds] = useState<string[]>([]);

  const diskDispatched = diskConfig.status === 'dispatched' || diskConfig.status === 'certified';
  const pushedJobs = applications.filter(j => j.status === 'pushed' || j.currentStage === 'b4' || j.currentStage === 'b5');
  const corpusBadge = applications.filter(j => j.status !== 'deleted').length;
  const b5Candidates = applications.filter(j => j.currentStage === 'b5' || j.currentStage === 'stop_before_resume_factory' || j.b5Decision === 'send');

  const screenAccessible = (s: Screen): boolean => {
    if (s === 'scout') return true;
    if (s === 'corpus') return true;
    if (s === 'b4') return pushedJobs.length > 0;
    if (s === 'b5') return b5Candidates.length > 0 || passingIds.length > 0;
    return false;
  };

  const navigate = (s: Screen) => {
    if (screenAccessible(s)) setScreen(s);
  };

  return (
    <div className={dark ? 'dark' : ''} style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Top Workspace Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--card)] no-print backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 flex items-center h-12">
          {/* Logo / wordmark */}
          <div className="flex items-center gap-2 mr-8 shrink-0">
            <div className="w-5 h-5 rounded bg-[color:var(--primary)] flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2 5.5h7M5.5 2l3.5 3.5L5.5 9" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-[color:var(--foreground)] tracking-tight">Spatial DNA</span>
          </div>

          {/* Stepper Nav Items */}
          <div className="flex items-center gap-0.5 flex-1">
            {NAV.map((n, i) => {
              const accessible = screenAccessible(n.id);
              const active = screen === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => navigate(n.id)}
                  disabled={!accessible}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    active
                      ? 'text-[color:var(--foreground)] bg-[color:var(--secondary)]'
                      : accessible
                        ? 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--secondary)]'
                        : 'text-[color:var(--muted-foreground)] opacity-35 cursor-not-allowed'
                  }`}
                >
                  {/* Step number */}
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${active ? 'bg-[color:var(--primary)] text-white' : 'bg-[color:var(--muted)] text-[color:var(--muted-foreground)]'}`}>
                    {i + 1}
                  </span>
                  <span>{n.label}</span>
                  {/* Badges */}
                  {n.id === 'corpus' && corpusBadge > 0 && (
                    <span className="text-[10px] font-mono bg-[color:var(--muted)] text-[color:var(--muted-foreground)] px-1 rounded">{corpusBadge}</span>
                  )}
                  {n.id === 'b4' && pushedJobs.length > 0 && (
                    <span className="text-[10px] font-mono bg-[color:var(--muted)] text-[color:var(--muted-foreground)] px-1 rounded">{pushedJobs.length}</span>
                  )}
                  {n.id === 'b5' && (b5Candidates.length > 0 || passingIds.length > 0) && (
                    <span className="text-[10px] font-mono bg-[color:var(--muted)] text-[color:var(--muted-foreground)] px-1 rounded">
                      {Math.max(b5Candidates.length, passingIds.length)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-1 ml-2">
            <DarkToggle dark={dark} onChange={() => setDark(!dark)} />
          </div>
        </div>
      </nav>

      {/* Pipeline progress bar */}
      <div className="h-0.5 bg-[color:var(--border)] no-print">
        <div
          className="h-full bg-[color:var(--accent)] transition-all duration-500"
          style={{
            width: screen === 'scout' ? '25%' : screen === 'corpus' ? '50%' : screen === 'b4' ? '75%' : '100%'
          }}
        />
      </div>

      {/* Screen Viewports */}
      <main>
        {screen === 'scout' && (
          <WorkspaceScout onDispatchNext={() => setScreen('corpus')} />
        )}
        {screen === 'corpus' && (
          <WorkspaceCorpus onAdvance={() => setScreen('b4')} />
        )}
        {screen === 'b4' && (
          <WorkspaceB4Gate
            threshold={b4Threshold}
            onThresholdChange={t => setB4Threshold(t)}
            onAdvance={() => setScreen('b5')}
          />
        )}
        {screen === 'b5' && (
          <WorkspaceB5Resume passingIds={passingIds} />
        )}
      </main>
    </div>
  );
}