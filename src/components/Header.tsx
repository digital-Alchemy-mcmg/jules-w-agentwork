import React from 'react';
import { Download, ShieldCheck, PlusCircle } from 'lucide-react';
import { CompletionReceipt } from '../types/scout';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenReceiptModal: () => void;
  receipt: CompletionReceipt;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenReceiptModal,
  receipt
}) => {
  const navItems = [
    { id: 'console', label: 'Console' },
    { id: 'ingest', label: 'Live Ingest' },
    { id: 'corpus', label: 'Corpus' },
    { id: 'envelopes', label: 'Envelopes' },
    { id: 'telemetry', label: 'Gate Telemetry' },
    { id: 'receipt', label: 'Receipt' },
    { id: 'cartridge', label: 'Cartridge & Tests' },
  ];

  const handleDownloadReceipt = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(receipt, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "SCOUT_STAGE_COMPLETION_RECEIPT_V2.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('console')}
            className="text-left group cursor-pointer"
          >
            <span className="text-base font-semibold tracking-tight text-slate-100 group-hover:text-cyan-400 transition-colors">
              Spatial DNA
            </span>
            <span className="text-xs text-slate-400 font-mono ml-2 tracking-normal">
              v2.2.0
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === item.id
                  ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ingest')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-800/60 rounded hover:bg-cyan-900/40 transition-colors cursor-pointer"
            title="Ingest a live job description"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Ingest Job</span>
          </button>
          <button
            onClick={onOpenReceiptModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700/80 rounded hover:bg-slate-800 hover:text-slate-100 transition-colors whitespace-nowrap cursor-pointer"
            title="Inspect Handoff Boundary and Stop Condition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Handoff Gate</span>
          </button>
          <button
            onClick={handleDownloadReceipt}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 rounded hover:bg-cyan-300 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
            title="Download durable machine completion receipt JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Receipt JSON</span>
          </button>
        </div>
      </div>
    </header>
  );
};
