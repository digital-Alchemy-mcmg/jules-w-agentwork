import React from 'react';
import { MaraProvider, useMara } from './context/MaraContext';
import OperatorInterface from './components/operator/OperatorInterface';
import WorkspaceInterface from './components/workspace/WorkspaceInterface';

function MaraShell() {
  const { uiMode, setUiMode } = useMara();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Top Persistent UI Interface Switcher Banner */}
      <header className="no-print bg-[#111827] text-white border-b border-[#1F2937] px-6 py-2.5 flex items-center justify-between text-xs sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="font-semibold tracking-wider font-mono text-[11px] uppercase text-[#F3F4F6]">
              MARA Application Core
            </span>
          </div>
          <span className="text-[#4B5563]">|</span>
          <span className="text-[#9CA3AF] hidden sm:inline text-[11px]">
            Single Authoritative State Engine (B1–B5 • Spatial DNA • Resume Factory)
          </span>
        </div>

        {/* Persistent UI-Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#1F2937] rounded-full p-0.5 border border-[#374151]">
            <button
              onClick={() => setUiMode('operator')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                uiMode === 'operator'
                  ? 'bg-white text-[#111827] shadow-sm font-semibold'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Operator Interface
            </button>
            <button
              onClick={() => setUiMode('workspace')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                uiMode === 'workspace'
                  ? 'bg-[#3B82F6] text-white shadow-sm font-semibold'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Workspace Interface
            </button>
          </div>
        </div>
      </header>

      {/* Active Presentation Surface */}
      <div className="flex-1">
        {uiMode === 'operator' ? (
          <OperatorInterface />
        ) : (
          <WorkspaceInterface />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <MaraProvider>
      <MaraShell />
    </MaraProvider>
  );
}
