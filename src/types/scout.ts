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

export type B1Marker = '*' | '≈' | '';
export interface B1SourceSpan {
  source_span_id: string;
  raw_text: string;
  /** Half-open JavaScript UTF-16 offsets into the preserved source string. */
  start_offset: number;
  end_offset: number;
}
export interface B1Primitive {
  marker: B1Marker;
  node_text: string;
  source_span_id: string;
  qualifier_scope?: string;
}
export type B1MalformDiagnostic = 'VALID_JOB_OBJECT'
  | 'MALFORMED — ORIGIN MISSING' | 'MALFORMED — DESTINATION MISSING'
  | 'MALFORMED — UNROUTABLE JOB OBJECT';
export interface B1Payload {
  b1_header: {
    session_uid: string;
    stage_status: 'completed' | 'halted';
    malform_diagnostic: B1MalformDiagnostic;
    candidate_blind_airlock: 'VERIFIED_LOCKED';
    boundary_b_in_hash: string;
    boundary_b_out_hash: string;
    mode: 'HALT_ON_MALFORM';
  };
  target_identification_envelope: Record<
    'company_organization' | 'posting_party' | 'job_title' | 'requisition_id'
    | 'employment_type' | 'location' | 'work_arrangement' | 'relocation_terms'
    | 'compensation' | 'schedule_posting_date', B1Primitive[]>;
  application_routing: Record<'application_method' | 'destination_url'
    | 'recruiter_contact' | 'required_submission_materials' | 'special_instructions', B1Primitive[]>;
  operational_primitives: Record<'target_role' | 'hard_candidate_gates'
    | 'contextual_conditions' | 'required_role_responsibilities', B1Primitive[]>;
  source_spans: B1SourceSpan[];
  de_theatricalization_log: Array<{ source_span_id: string; action: 'retained'; reason: string }>;
  diagnostic_trace: Array<{ source_span_id?: string; code: string; detail: string }>;
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
  } | {
    current_stage: 'b2';
    completed_stages: ['scout', 'b1'];
    status: 'ready';
  } | {
    current_stage: 'b3';
    completed_stages: ['scout', 'b1', 'b2'];
    status: 'ready';
  } | {
    current_stage: 'b4';
    completed_stages: ['scout', 'b1', 'b2', 'b3'];
    status: 'ready';
  } | {
    current_stage: 'b5';
    completed_stages: ['scout', 'b1', 'b2', 'b3', 'b4'];
    status: 'ready';
  } | {
    current_stage: 'stop_before_resume_factory';
    completed_stages: ['scout', 'b1', 'b2', 'b3', 'b4', 'b5'];
    status: 'complete';
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
    b: null | { handoff_accepted: boolean; timestamp: string; boundary_hash: string };
    b1: B1Payload | null;
    b2: B2Payload | null;
    b3: B3Payload | null;
    b4: B4Payload | null;
    b5: B5Payload | null;
  };
}

export type B1OutputEnvelope = TravelingEnvelope & {
  stage_state: { current_stage: 'b2'; completed_stages: ['scout', 'b1']; status: 'ready' };
  payload: TravelingEnvelope['payload'] & { b1: B1Payload; b2: null; b3: null; b4: null; b5: null };
};

export type B2OutputEnvelope = TravelingEnvelope & {
  stage_state: { current_stage: 'b3'; completed_stages: ['scout', 'b1', 'b2']; status: 'ready' };
  payload: TravelingEnvelope['payload'] & { b1: B1Payload; b2: B2Payload; b3: null; b4: null; b5: null };
};

export type B3OutputEnvelope = TravelingEnvelope & {
  stage_state: { current_stage: 'b4'; completed_stages: ['scout', 'b1', 'b2', 'b3']; status: 'ready' };
  payload: TravelingEnvelope['payload'] & { b1: B1Payload; b2: B2Payload; b3: B3Payload; b4: null; b5: null };
};

export type B4OutputEnvelope = TravelingEnvelope & {
  stage_state: { current_stage: 'b5'; completed_stages: ['scout', 'b1', 'b2', 'b3', 'b4']; status: 'ready' };
  payload: TravelingEnvelope['payload'] & { b1: B1Payload; b2: B2Payload; b3: B3Payload; b4: B4Payload; b5: null };
};

export type B5OutputEnvelope = TravelingEnvelope & {
  stage_state: { current_stage: 'stop_before_resume_factory'; completed_stages: ['scout', 'b1', 'b2', 'b3', 'b4', 'b5']; status: 'complete' };
  payload: TravelingEnvelope['payload'] & { b1: B1Payload; b2: B2Payload; b3: B3Payload; b4: B4Payload; b5: B5Payload };
};

// ==========================================
// B2 Target Tree Types
// ==========================================
export type B2SemanticForce = 'hard_candidate_gate' | 'contextual_condition' | 'required_role_responsibility' | 'target_identity' | 'application_routing';

export interface B2Node {
  address: string; // Deterministic lowercase alphanumeric e.g. "t.id.org", "t.gate.g01", "t.duty.d01"
  parent_address: string | null;
  category: 'identity' | 'routing' | 'gate' | 'condition' | 'duty';
  title: string;
  node_text: string;
  marker: B1Marker;
  semantic_force: B2SemanticForce;
  source_span_id: string;
  source_span_provenance: {
    raw_text: string;
    start_offset: number;
    end_offset: number;
  };
  qualifier_scope?: string;
  child_addresses: string[];
}

export interface B2Payload {
  tree_id: string;
  root_address: string;
  target_source_hash: string;
  frozen: true;
  total_nodes: number;
  gate_count: number;
  nodes: Record<string, B2Node>;
  diagnostic_trace: Array<{ address: string; code: string; detail: string }>;
}

// ==========================================
// Spatial DNA & B3 Binding Types
// ==========================================
export type SpatialDNAPlane =
  | 'Experience'
  | 'Skills'
  | 'Education'
  | 'Certifications'
  | 'Operations'
  | 'Leadership'
  | 'Performance';

export interface CandidateEvidenceAtom {
  atom_id: string;
  plane: SpatialDNAPlane;
  category: string;
  statement: string;
  context?: string;
  chronology?: string;
  source_document: string;
}

export interface CandidateSpatialDNA {
  candidate_id: string;
  planes: Record<SpatialDNAPlane, CandidateEvidenceAtom[]>;
}

export interface B3BindingRecord {
  target_address: string;
  target_node_text: string;
  semantic_force: B2SemanticForce;
  satisfaction_question: string;
  eligible_planes: SpatialDNAPlane[];
  atoms_considered: CandidateEvidenceAtom[];
  atoms_selected: CandidateEvidenceAtom[];
  atomic_blurbs: string[];
  proposition: string;
  rationale: string;
}

export interface B3Payload {
  binding_session_uid: string;
  total_bindings: number;
  bindings: B3BindingRecord[];
  diagnostic_trace: Array<{ target_address: string; code: string; detail: string }>;
}

// ==========================================
// B4 Truth Gate Types
// ==========================================
export type B4Disposition =
  | 'PASS'
  | 'QUALIFIED_BOUNDED'
  | 'UNRESOLVED'
  | 'CONTRADICTED';

export interface B4AuditRecord {
  target_address: string;
  target_node_text: string;
  semantic_force: B2SemanticForce;
  disposition: B4Disposition;
  admitted_proposition: string | null;
  bounded_scope: string | null;
  evidence_ceiling: string;
  hard_gate_violation: boolean;
  reason: string;
  audit_trace: string[];
  selected_evidence_references: string[]; // atom_ids only
}

export interface B4Payload {
  audit_session_uid: string;
  boundary_b4_hash: string;
  disposition_summary: {
    pass_count: number;
    qualified_count: number;
    unresolved_count: number;
    contradicted_count: number;
    hard_gate_violations: number;
  };
  audited_ledger: Record<string, B4AuditRecord>;
  admitted_for_b5: boolean;
  diagnostic_trace: Array<{ target_address: string; code: string; detail: string }>;
}

// ==========================================
// B5 Semantic Core Reasoning Types
// ==========================================
export type B5PrismType =
  | 'Sales Headhunter'
  | 'Sports Agent'
  | 'Discovery Scout'
  | 'Independent Staffing-Firm Owner'
  | 'Casting Director';

export type B5PresentationGeometry =
  | 'single_dominant'
  | 'dual_dominant'
  | 'dominant_plus_secondary'
  | 'distributed';

export interface B5PrismAssessment {
  prism: B5PrismType;
  description: string;
  projection_priority: number; // 1 (highest) to 5
  emphasis_percentage: number; // Sum = 100
  supported_projection: string;
  evidence_anchors: string[]; // B4 target addresses and atom_ids
}

export interface B5Payload {
  session_uid: string;
  boundary_b5_hash: string;
  owner_prism: B5PrismType;
  ranked_five_prisms: B5PrismAssessment[];
  projection_emphasis_percentages: Record<B5PrismType, number>;
  evidence_anchors: Record<string, string[]>; // Target address -> supporting evidence
  semantic_priorities: {
    foreground: string[];
    reinforcement: string[];
    background: string[];
    suppression: string[];
  };
  writing_boundaries: {
    assertiveness_ceiling: string;
    permitted_tone: string;
    allowed_assertions: string[];
  };
  prohibited_implications: string[];
  presentation_geometry: {
    posture: B5PresentationGeometry;
    rationale: string;
  };
  diagnostic_trace: Array<{ code: string; detail: string }>;
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
