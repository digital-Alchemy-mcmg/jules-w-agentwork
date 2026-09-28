export interface RawJobInput {
  id: string; // e.g. JOB-LIVE-001
  title: string;
  company: string;
  location: string;
  minSalary?: string;
  maxSalary?: string;
  avgSalary?: string;
  payType: string;
  employmentType: string;
  keyBenefits?: string;
  applicationStatus?: string;
  sourceUrl?: string;
  vendor?: string;
  notes?: string;
  rawSourceText: string; // Full unedited posting text
}

export interface JobCandidate extends RawJobInput {
  status: 'ACCEPTED' | 'REJECTED';
  rejectionGate?: string;
  rejectionReason?: string;
  obsId?: string;
  dedupKey?: string;
  envelopeId?: string;
}

export interface GateDefinition {
  id: number;
  name: string;
  description: string;
  tier: 'Runner (ENVOY 1)' | 'Integrity';
  rejectionCount: number;
  status: 'PASS' | 'FILTERED' | 'ERROR';
  filterScope?: string;
}

export interface OriginalTargetSource {
  source_text: string;
  source_hash: string;
  capture_timestamp: string;
  source_provenance: {
    vendor: string;
    source_url: string;
    employer: string;
    job_title: string;
  };
  is_preserved_source: boolean;
  preservation_note: string;
}

export interface SemanticCategories {
  'Employment Type': string[];
  'Schedule': string[];
  'Compensation': string[];
  'Benefits': string[];
  'Experience': string[];
  'Education': string[];
  'Certifications': string[];
  'Leadership': string[];
  'Operations': string[];
  'Physical Requirements': string[];
  'Working Conditions': string[];
  'Skills': string[];
  'Responsibilities': string[];
  'Other': string[];
}

export interface ScoutPayload {
  Observation_ID: string;
  observation_id: string;
  collection_date: string;
  vendor: string;
  employer: string;
  job_title: string;
  city: string;
  state: string;
  zip: string;
  industry: string;
  employment_type: string;
  compensation: string;
  source_url: string;
  duplicate_count: number;
  original_target_source: OriginalTargetSource;
  atomic_statements: string[];
  semantic_categories: SemanticCategories;
  intake_status: 'ACCEPTED';
  scout_stage_version: string;
  deduplication_key: string;
  cartridge_content_hash: string;
  cartridge_id: string;
}

export interface TravelingEnvelope {
  schema_version: '0.2.0';
  envelope_id: string;
  created_at: string;
  persistent: {
    target_identity: {
      job_id: string;
      job_title: string;
      company: string;
      location: string;
      compensation: string;
      employment_type: string;
    };
    application_routing: {
      source_vendor: string;
      source_url: string;
      application_status: string;
      notes: string;
    };
    source_identity: {
      corpus_id: string;
      record_index: number;
    };
  };
  stage_state: {
    current_stage: 'b';
    completed_stages: ['scout'];
    status: 'ready';
  };
  append_log: Array<{
    stage: string;
    operation: string;
    timestamp: string;
    details: {
      observation_id: string;
      deduplication_key: string;
      contract_version: string;
    };
  }>;
  payload: {
    scout: ScoutPayload;
    b: null;
    b1: null;
    b2: null;
    b3: null;
    b4: null;
    b5: null;
  };
}

export interface CompletionReceipt {
  runner_id: string;
  stage: string;
  state: string;
  timestamp: string;
  repository: string;
  branch: string;
  commit_sha: string;
  git_tag: string;
  execution_mode: string;
  corpus_id: string;
  total_jobs_processed: number;
  accepted_envelopes_count: number;
  workbench_command: string;
  artifacts: Record<string, string>;
  hashes: {
    cartridge_sha256: string;
    schema_sha256: string;
    corpus_manifest_sha256?: string;
  };
  exact_scout_output_contract: {
    output_fields_contract: string[];
    traveling_envelope_version: string;
    envelope_keys: string[];
    persistent_keys: string[];
    scout_payload_keys: string[];
    semantic_categories_contract: string[];
    stage_state_transition: {
      completed_stages: string[];
      current_stage: string;
      status: string;
    };
    payload_assignment: string;
  };
  metrics: {
    total_candidates: number;
    accepted_count: number;
    duplicate_groups_count: number;
    gate_rejections: Record<string, number>;
  };
  failures_or_exceptions: string[];
  blockers: string;
  unresolved_blockers: string;
  next_eligible_stage: string;
  stop_condition_satisfied: boolean;
}

export interface CompliancePoint {
  id: number;
  category: string;
  requirement: string;
  passed: boolean;
}

export interface TestResult {
  name: string;
  description: string;
  durationMs: number;
  passed: boolean;
  assertionsCount: number;
}
