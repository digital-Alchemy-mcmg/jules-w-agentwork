import React, { useState, useMemo } from 'react';
import { Search, ExternalLink, ShieldAlert, CheckCircle2, X, PlusCircle } from 'lucide-react';
import { JobCandidate } from '../types/scout';

interface CorpusViewProps {
  candidates: JobCandidate[];
  onInspectEnvelope: (envelopeId: string) => void;
  onNavigateToIngest: () => void;
}

export const CorpusView: React.FC<CorpusViewProps> = ({
  candidates,
  onInspectEnvelope,
  onNavigateToIngest
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACCEPTED' | 'REJECTED'>('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState<JobCandidate | null>(null);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (statusFilter === 'ACCEPTED' && c.status !== 'ACCEPTED') return false;
      if (statusFilter === 'REJECTED' && c.status !== 'REJECTED') return false;

      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        return (
          c.id.toLowerCase().includes(query) ||
          c.title.toLowerCase().includes(query) ||
          c.company.toLowerCase().includes(query) ||
          c.location.toLowerCase().includes(query) ||
          (c.obsId && c.obsId.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [candidates, searchTerm, statusFilter]);

  const acceptedCount = candidates.filter(c => c.status === 'ACCEPTED').length;
  const rejectedCount = candidates.filter(c => c.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Live Candidate Corpus
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Displaying live candidate observations ingested into Scout. Zero hard-coded historical fixtures.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Total: <strong className="text-slate-200 tabular-nums">{candidates.length}</strong></span>
            <span className="text-slate-600"> </span>
            <span>Accepted: <strong className="text-emerald-400 tabular-nums">{acceptedCount}</strong></span>
            <span className="text-slate-600"> </span>
            <span>Filtered: <strong className="text-amber-400 tabular-nums">{rejectedCount}</strong></span>
          </div>
          <button
            onClick={onNavigateToIngest}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 rounded hover:bg-cyan-300 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Ingest New Job</span>
          </button>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-lg p-12 text-center space-y-3 bg-slate-900/20">
          <p className="text-sm text-slate-300 font-medium">
            No job descriptions ingested yet.
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The cleanroom environment contains zero hard-coded jobs. Paste your live unformatted job description into the Live Ingest tab to begin transformation.
          </p>
          <button
            onClick={onNavigateToIngest}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Go to Live Ingestion</span>
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, title, company, or OBS-ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-md">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-slate-800 text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({candidates.length})
              </button>
              <button
                onClick={() => setStatusFilter('ACCEPTED')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  statusFilter === 'ACCEPTED' ? 'bg-emerald-950/60 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Accepted ({acceptedCount})
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  statusFilter === 'REJECTED' ? 'bg-amber-950/60 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Filtered ({rejectedCount})
              </button>
            </div>
          </div>

          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3.5 w-28">ID</th>
                    <th className="py-2.5 px-3.5">Job Title</th>
                    <th className="py-2.5 px-3.5">Company</th>
                    <th className="py-2.5 px-3.5">Location</th>
                    <th className="py-2.5 px-3.5 text-right font-mono">Compensation</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      onClick={() => setSelectedCandidate(candidate)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3.5 font-mono font-medium text-cyan-400">
                        {candidate.id}
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-200">
                        {candidate.title}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-300">
                        {candidate.company}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-400">
                        {candidate.location}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-slate-300">
                        {candidate.minSalary && candidate.maxSalary
                          ? `${candidate.minSalary} - ${candidate.maxSalary}`
                          : candidate.avgSalary || candidate.minSalary || 'Negotiable'}
                      </td>
                      <td className="py-2.5 px-3.5">
                        {candidate.status === 'ACCEPTED' ? (
                          <span className="text-emerald-400 font-mono text-[11px] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> ACCEPTED
                          </span>
                        ) : (
                          <span className="text-amber-400 font-mono text-[11px] font-medium flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> FILTERED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {candidate.status === 'ACCEPTED' && candidate.envelopeId ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onInspectEnvelope(candidate.envelopeId!);
                            }}
                            className="px-2 py-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 border border-cyan-800/50 rounded transition-colors cursor-pointer"
                          >
                            Envelope
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCandidate(candidate);
                            }}
                            className="px-2 py-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 rounded transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="text-cyan-400 font-semibold">{selectedCandidate.id}</span>
                  <span> </span>
                  <span>{selectedCandidate.company}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 mt-1">
                  {selectedCandidate.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="font-medium text-slate-200 mt-0.5 block">{selectedCandidate.location}</span>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
                <span className="text-slate-400 block text-[11px]">Employment Type</span>
                <span className="font-medium text-slate-200 mt-0.5 block">{selectedCandidate.employmentType}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Raw Target Source Text:</span>
              <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {selectedCandidate.rawSourceText}
              </pre>
            </div>

            {selectedCandidate.status === 'ACCEPTED' && selectedCandidate.envelopeId && (
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Traveling Envelope Created
                </span>
                <button
                  onClick={() => {
                    const envId = selectedCandidate.envelopeId!;
                    setSelectedCandidate(null);
                    onInspectEnvelope(envId);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
                >
                  Open Envelope
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
