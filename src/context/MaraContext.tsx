import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { MaraJob, INITIAL_MARA_JOBS, MARA_B4_PROFILES, MARA_B5_PROFILES, B4MockData, B5MockData } from '../data/maraJobs';
import { TravelingEnvelope, RawJobInput, CandidateSpatialDNA } from '../types/scout';
import { processLiveJobToEnvelope } from '../services/scoutEngine';
import { ingestB1 } from '../services/b1Engine';
import { constructB2Tree } from '../services/b2Engine';
import { bindSpatialDNA } from '../services/b3Engine';
import { auditTruthGate } from '../services/b4Engine';
import { reasonSemanticCore } from '../services/b5Engine';

export type UIMode = 'operator' | 'workspace';

export type PipelineStage = 'scout' | 'b' | 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'stop_before_resume_factory';
export type JobStatus = 'pending' | 'kept' | 'deleted' | 'pushed';

export interface DiskConfig {
  id: string;
  name: string;
  roleScope: string;
  territory: string[];
  naicsCodes: string[];
  socCodes: string[];
  inclusionKeywords: string[];
  exclusionKeywords: string[];
  executionProfile: 'standard' | 'discovery' | 'research' | 'forensics' | 'strict';
  status: 'draft' | 'compiled' | 'certified' | 'dispatched';
  certHash?: string;
  compiledAt?: string;
  dispatchedAt?: string;
  jobCount?: number;
}

export interface ApplicationItem extends MaraJob {
  status: JobStatus;
  isPinned: boolean;
  envelope?: TravelingEnvelope;
  currentStage: PipelineStage;
  b4Data?: B4MockData;
  b5Data?: B5MockData;
  b4Decision?: 'proceed' | 'stop' | null;
  b5Decision?: 'send' | 'stop' | null;
  isStopped?: boolean;
  stopReason?: string;
  resumeEnhancement?: {
    baselineScore: number;
    enhancedScore: number;
    strategy: string;
    html: string;
    atsMarkdown: string;
  };
}

export interface PipelineEventRecord {
  event: string;
  payload: any;
  timestamp: string;
}

export interface MaraContextType {
  // UI Mode (persistent)
  uiMode: UIMode;
  setUiMode: (mode: UIMode) => void;

  // Authoritative Applications State
  applications: ApplicationItem[];
  diskConfig: DiskConfig;
  updateDiskConfig: (cfg: Partial<DiskConfig>) => void;
  compileAndCertifyDisk: () => Promise<string>;
  dispatchDisk: () => void;

  // Selection & Actions
  togglePinJob: (id: string) => void;
  setJobStatus: (id: string, status: JobStatus) => void;
  bulkSetStatus: (ids: string[], status: JobStatus) => void;
  pushJobsForward: (ids: string[]) => Promise<void>;

  // Decisions
  makeB4Decision: (id: string, decision: 'proceed' | 'stop') => Promise<void>;
  makeB5Decision: (id: string, decision: 'send' | 'stop') => Promise<void>;

  // Pipeline Engine Controls
  runStraightThroughJob: (id: string) => Promise<void>;
  resetAll: () => void;
  exportEnvelopeJson: (id?: string) => string;

  // Active Envelopes & Diagnostics
  activeEnvelope: TravelingEnvelope | null;
  activeEnvelopeId: string | null;
  setActiveEnvelopeId: (id: string | null) => void;
  eventLogs: PipelineEventRecord[];
  isProcessing: boolean;

  // Authoritative Candidate DNA (Spatial DNA 7 planes)
  candidateDNA: CandidateSpatialDNA | null;
  setCandidateDNA: (dna: CandidateSpatialDNA | null) => void;
}

const UI_MODE_STORAGE_KEY = 'mara_ui_mode_preference';

const MaraContext = createContext<MaraContextType | null>(null);

export const MaraProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Persistent UI mode toggle
  const [uiMode, setUiModeState] = useState<UIMode>(() => {
    try {
      const saved = localStorage.getItem(UI_MODE_STORAGE_KEY);
      if (saved === 'operator' || saved === 'workspace') return saved;
    } catch (e) {
      // ignore
    }
    return 'operator';
  });

  const setUiMode = (mode: UIMode) => {
    setUiModeState(mode);
    try {
      localStorage.setItem(UI_MODE_STORAGE_KEY, mode);
    } catch (e) {
      // ignore
    }
  };

  // Authoritative Disk Config
  const [diskConfig, setDiskConfig] = useState<DiskConfig>({
    id: 'DISK-2026-0042',
    name: 'GM & Operations Leadership',
    roleScope: 'General Management / Operations Partner',
    territory: ['Oakland County, MI', 'Detroit, MI 48226'],
    naicsCodes: ['722511', '722110'],
    socCodes: ['11-9051', '35-1012'],
    inclusionKeywords: ['GM', 'Operations Manager', 'P&L', 'COGS'],
    exclusionKeywords: ['junior', 'intern', 'entry-level', '-Driver', '-Server'],
    executionProfile: 'standard',
    status: 'certified',
    certHash: 'sha256:a3f9c2e1b4c8d0e7f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d9d4b',
    compiledAt: new Date().toISOString(),
    jobCount: 12
  });

  // Authoritative Applications Array (Single Shared Source of Truth)
  const [applications, setApplications] = useState<ApplicationItem[]>(() => {
    return INITIAL_MARA_JOBS.map((j) => {
      const b4 = MARA_B4_PROFILES[j.id];
      const b5 = MARA_B5_PROFILES[j.id];
      // j01, j02, j03, j04, j06, j09 are pinned initially per baseline setup
      const isInitialPinned = ['j01', 'j02', 'j04'].includes(j.id);
      return {
        ...j,
        status: isInitialPinned ? 'pushed' : 'pending',
        isPinned: isInitialPinned,
        currentStage: isInitialPinned ? 'b4' : 'b',
        b4Data: b4,
        b5Data: b5,
        b4Decision: null,
        b5Decision: null,
        isStopped: false
      };
    });
  });

  const [activeEnvelopeId, setActiveEnvelopeId] = useState<string | null>('j01');
  const [eventLogs, setEventLogs] = useState<PipelineEventRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [candidateDNA, setCandidateDNA] = useState<CandidateSpatialDNA | null>(null);

  const pushEvent = (event: string, payload: any) => {
    setEventLogs(prev => [{ event, payload, timestamp: new Date().toISOString() }, ...prev].slice(0, 60));
  };

  const updateDiskConfig = (cfg: Partial<DiskConfig>) => {
    setDiskConfig(prev => ({ ...prev, ...cfg }));
  };

  const compileAndCertifyDisk = async (): Promise<string> => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 350));
    const certHash = 'sha256:a3f9c2e1b4c8d0e7f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d9d4b';
    setDiskConfig(prev => ({
      ...prev,
      status: 'certified',
      certHash,
      compiledAt: new Date().toISOString()
    }));
    pushEvent('b1:airlock:verified', { status: 'CERTIFIED', hash: certHash });
    setIsProcessing(false);
    return certHash;
  };

  const dispatchDisk = () => {
    setDiskConfig(prev => ({
      ...prev,
      status: 'dispatched',
      dispatchedAt: new Date().toISOString()
    }));
    pushEvent('stage:transition:complete', { stage: 'scout', status: 'dispatched', count: applications.length });
  };

  const togglePinJob = (id: string) => {
    setApplications(prev => prev.map(app => {
      if (app.id !== id) return app;
      const nextPinned = !app.isPinned;
      return {
        ...app,
        isPinned: nextPinned,
        status: nextPinned ? 'pushed' : 'pending',
        currentStage: nextPinned && app.currentStage === 'b' ? 'b4' : app.currentStage
      };
    }));
  };

  const setJobStatus = (id: string, status: JobStatus) => {
    setApplications(prev => prev.map(app => {
      if (app.id !== id) return app;
      return {
        ...app,
        status,
        isPinned: status === 'pushed'
      };
    }));
  };

  const bulkSetStatus = (ids: string[], status: JobStatus) => {
    const idSet = new Set(ids);
    setApplications(prev => prev.map(app => {
      if (!idSet.has(app.id)) return app;
      return {
        ...app,
        status,
        isPinned: status === 'pushed',
        currentStage: status === 'pushed' && app.currentStage === 'b' ? 'b4' : app.currentStage
      };
    }));
  };

  // Push forward from thin list / Corpus into pipeline (B1 -> B2 -> B3 -> B4)
  const pushJobsForward = async (ids: string[]) => {
    setIsProcessing(true);
    const idSet = new Set(ids);
    pushEvent('stage:transition:start', { from: 'b', to: 'b2', ids });
    await new Promise(r => setTimeout(r, 300));

    setApplications(prev => prev.map(app => {
      if (!idSet.has(app.id)) return app;
      return {
        ...app,
        status: 'pushed',
        isPinned: true,
        currentStage: 'b4'
      };
    }));

    pushEvent('b4:audit:ledger:sealed', { count: ids.length, stage: 'b4' });
    setIsProcessing(false);
  };

  // B4 Decision (Proceed to B5 or Stop)
  const makeB4Decision = async (id: string, decision: 'proceed' | 'stop') => {
    pushEvent('gate:evaluated', { id, gate: 'B4', decision });
    setApplications(prev => prev.map(app => {
      if (app.id !== id) return app;
      if (decision === 'stop') {
        return {
          ...app,
          b4Decision: 'stop',
          isStopped: true,
          stopReason: `B4 stopped by operator at ${app.b4Data?.pct || 68}% — stretch not justified`
        };
      } else {
        return {
          ...app,
          b4Decision: 'proceed',
          currentStage: 'b5',
          isStopped: false
        };
      }
    }));
    pushEvent('b5:prism:normalized', { id, stage: 'b5' });
  };

  // B5 Decision (Send to Resume Factory or Stop)
  const makeB5Decision = async (id: string, decision: 'send' | 'stop') => {
    pushEvent('gate:evaluated', { id, gate: 'B5', decision });
    setApplications(prev => prev.map(app => {
      if (app.id !== id) return app;
      if (decision === 'stop') {
        return {
          ...app,
          b5Decision: 'stop',
          isStopped: true,
          stopReason: `B5 stopped — uplift only +${app.b5Data?.improvement || 2}% not justified for factory cost`
        };
      } else {
        return {
          ...app,
          b5Decision: 'send',
          currentStage: 'stop_before_resume_factory',
          isStopped: false
        };
      }
    }));
    pushEvent('stage:transition:complete', { id, stage: 'stop_before_resume_factory' });
  };

  // Run a single job straight through to completion
  const runStraightThroughJob = async (id: string) => {
    setIsProcessing(true);
    const target = applications.find(a => a.id === id);
    if (!target) return;

    try {
      const rawInput: RawJobInput = {
        id: target.id,
        title: target.position,
        company: target.company,
        location: target.location,
        minSalary: target.payMin ? `$${target.payMin}` : undefined,
        maxSalary: target.payMax ? `$${target.payMax}` : undefined,
        payType: 'Annual',
        employmentType: target.type,
        rawSourceText: target.jd
      };

      const { envelope: scoutEnv } = await processLiveJobToEnvelope(rawInput, 1, 'live-corpus');
      if (scoutEnv) {
        const b1Env = await ingestB1(scoutEnv);
        const b2Env = await constructB2Tree(b1Env);
        if (!candidateDNA) {
          pushEvent('pipeline:error', {
            error: 'MISSING_CANDIDATE_DNA',
            message: 'Awaiting authoritative Candidate DNA ingestion before B3 Spatial plane binding'
          });
          throw new Error('Awaiting authoritative Candidate DNA ingestion before B3 Spatial plane binding. Inject Candidate DNA via setCandidateDNA.');
        }

        const b3Env = await bindSpatialDNA(b2Env, candidateDNA);
        const b4Env = await auditTruthGate(b3Env);
        const b5Env = await reasonSemanticCore(b4Env);

        setApplications(prev => prev.map(a => {
          if (a.id !== id) return a;
          return {
            ...a,
            envelope: b5Env,
            currentStage: 'stop_before_resume_factory',
            status: 'pushed',
            isPinned: true
          };
        }));
      }
    } catch (err) {
      console.error('Run straight through error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setApplications(INITIAL_MARA_JOBS.map(j => ({
      ...j,
      status: 'pending',
      isPinned: false,
      currentStage: 'b',
      b4Data: MARA_B4_PROFILES[j.id],
      b5Data: MARA_B5_PROFILES[j.id],
      b4Decision: null,
      b5Decision: null,
      isStopped: false
    })));
    setActiveEnvelopeId(null);
    setEventLogs([]);
    pushEvent('pipeline:status:change', { status: 'reset' });
  };

  const exportEnvelopeJson = (id?: string): string => {
    const targetId = id || activeEnvelopeId;
    const target = applications.find(a => a.id === targetId);
    if (target?.envelope) {
      return JSON.stringify(target.envelope, null, 2);
    }
    return JSON.stringify({
      schema_version: '0.2.0',
      contract_version: '1.0.0',
      target_id: targetId || 'default',
      applications: applications.map(a => ({
        id: a.id,
        company: a.company,
        position: a.position,
        stage: a.currentStage,
        b4Match: a.b4Data?.pct,
        b5Match: a.b5Data?.after,
        b4Decision: a.b4Decision,
        b5Decision: a.b5Decision,
        isStopped: a.isStopped
      }))
    }, null, 2);
  };

  const activeEnvelope = useMemo(() => {
    if (!activeEnvelopeId) return null;
    const app = applications.find(a => a.id === activeEnvelopeId);
    return app?.envelope || null;
  }, [activeEnvelopeId, applications]);

  const value: MaraContextType = {
    uiMode,
    setUiMode,
    applications,
    diskConfig,
    updateDiskConfig,
    compileAndCertifyDisk,
    dispatchDisk,
    togglePinJob,
    setJobStatus,
    bulkSetStatus,
    pushJobsForward,
    makeB4Decision,
    makeB5Decision,
    runStraightThroughJob,
    resetAll,
    exportEnvelopeJson,
    activeEnvelope,
    activeEnvelopeId,
    setActiveEnvelopeId,
    eventLogs,
    isProcessing,
    candidateDNA,
    setCandidateDNA
  };

  return (
    <MaraContext.Provider value={value}>
      {children}
    </MaraContext.Provider>
  );
};

export const useMara = () => {
  const context = useContext(MaraContext);
  if (!context) {
    throw new Error('useMara must be used within a MaraProvider');
  }
  return context;
};