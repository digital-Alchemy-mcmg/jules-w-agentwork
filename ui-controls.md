# UI Control Surface & Data Interface Specification
**Target System:** Spatial DNA Pipeline Runtime (Scout → B → B1 → B2 → B3 → B4 → B5)
**Contract Version:** `1.0.0`
**Envelope Schema:** `0.2.0`
**Target Consumers:** Meta Frontend UI Harness Engineers & Automated Code Generators

---

## 1. Architectural Overview & System Contract

The Spatial DNA Pipeline Runtime processes unedited job postings across a strict linear stage envelope with immutable cryptographic seals and provenance. The stages operate as follows:

```
[Raw Job Input]
       │
       ▼
 ┌───────────┐
 │   Scout   │  Path A (Normalized Target) + Path B (Atomic Decomp + Semantic Buckets)
 └─────┬─────┘
       │  Envelope Stage: 'b' (payload.b..b5 null)
       ▼
 ┌───────────┐
 │    B1     │  Candidate-Blind Airlock, Deterministic UTF-16 Spans, Malform Diagnostics
 └─────┬─────┘
       │  Envelope Stage: 'b2' (payload.b2..b5 null)
       ▼
 ┌───────────┐
 │    B2     │  Hierarchical Target Tree (t.id, t.route, t.gate, t.cond, t.duty), Bidirectional Provenance
 └─────┬─────┘
       │  Envelope Stage: 'b3' (payload.b3..b5 null)
       ▼
 ┌───────────┐
 │    B3     │  Spatial DNA Inverted Satisfaction, 7 Planes, Considered vs Selected Evidence Atoms
 └─────┬─────┘
       │  Envelope Stage: 'b4' (payload.b4..b5 null)
       ▼
 ┌───────────┐
 │    B4     │  Truth Gate Audit Ledger, Hard-Gate Defensibility (*), Bounded Scope, Evidence Ceiling
 └─────┬─────┘
       │  Envelope Stage: 'b5' (payload.b5 null)
       ▼
 ┌───────────┐
 │    B5     │  5-Prism Reasoning Projection (100% Normalized Weight), Geometry Posture
 └─────┬─────┘
       │  Envelope Stage: 'stop_before_resume_factory', Status: 'complete'
       ▼
[Sealed Ready-for-Resume Traveling Envelope]
```

This document establishes the UI control surface, data interfaces, state machine types, action handlers, event emitter contracts, and inspection schemas without prescribing visual styling or layouts.

---

## 2. Pipeline & Stage Control Methods

### 2.1 Global Pipeline Controller Interface

```typescript
export interface PipelineEngineController {
  /**
   * Initializes the engine with optional configuration and candidate Spatial DNA.
   * If candidate DNA is not provided, the default baseline candidate profile is loaded.
   */
  init(config?: PipelineConfig, candidateDNA?: CandidateSpatialDNA): Promise<PipelineInitializationReceipt>;

  /**
   * Loads a raw job input target into the pipeline and runs Scout stage intake.
   * Produces an envelope at stage 'b' with immutable source hash and Path A/B payloads.
   */
  loadTarget(input: RawJobInput): Promise<TravelingEnvelope>;

  /**
   * Steps the pipeline forward by exactly one stage:
   * 'b'  -> executes B1 -> advances to 'b2'
   * 'b2' -> executes B2 -> advances to 'b3'
   * 'b3' -> executes B3 -> advances to 'b4'
   * 'b4' -> executes B4 -> advances to 'b5'
   * 'b5' -> executes B5 -> completes to 'stop_before_resume_factory'
   */
  stepStage(): Promise<TravelingEnvelope>;

  /**
   * Executes the entire pipeline straight-through from the current stage to completion.
   * Emits progressive transition events after each stage.
   */
  runStraightThrough(): Promise<TravelingEnvelope>;

  /**
   * Requests a pause of execution between stage boundaries during a straight-through run.
   */
  pause(): void;

  /**
   * Resets the runtime state, clears active envelopes, and unloads the current job target.
   */
  reset(): void;

  /**
   * Exports the current TravelingEnvelope as an immutable JSON string or typed object.
   */
  exportEnvelope(prettyPrint?: boolean): string;

  /**
   * Returns the current reactive UI state snapshot.
   */
  getState(): PipelineUIState;

  /**
   * Subscribes to pipeline lifecycle and stage transition events.
   */
  subscribe<E extends PipelineEventType>(
    event: E,
    handler: (payload: PipelineEventMap[E]) => void
  ): () => void;
}
```

### 2.2 Stage Progression Hooks & Events

The runtime exposes a typed event bus:

```typescript
export type PipelineEventType =
  | 'stage:transition:start'
  | 'stage:transition:complete'
  | 'stage:transition:error'
  | 'pipeline:status:change'
  | 'b1:airlock:verified'
  | 'b2:tree:frozen'
  | 'b3:binding:complete'
  | 'b4:audit:ledger:sealed'
  | 'b5:prism:normalized';

export interface StageTransitionStartEvent {
  fromStage: string;
  toStage: string;
  envelopeId: string;
  timestamp: string;
}

export interface StageTransitionCompleteEvent {
  fromStage: string;
  toStage: string;
  envelopeId: string;
  envelope: TravelingEnvelope;
  durationMs: number;
  timestamp: string;
}

export interface StageTransitionErrorEvent {
  failedStage: string;
  envelopeId: string;
  error: Error;
  timestamp: string;
}

export interface PipelineStatusChangeEvent {
  previousStatus: PipelineExecutionStatus;
  currentStatus: PipelineExecutionStatus;
  envelopeId: string | null;
  activeStage: PipelineStageIdentifier | null;
}

export interface B1AirlockVerifiedEvent {
  sessionUid: string;
  airlockStatus: 'VERIFIED_LOCKED';
  malformDiagnostic: B1MalformDiagnostic;
  boundaryBOutHash: string;
  sourceSpanCount: number;
}

export interface B2TreeFrozenEvent {
  treeId: string;
  rootAddress: string;
  totalNodes: number;
  gateCount: number;
  targetSourceHash: string;
}

export interface B3BindingCompleteEvent {
  bindingSessionUid: string;
  totalBindings: number;
  unboundCount: number;
  eligiblePlaneDistribution: Record<SpatialDNAPlane, number>;
}

export interface B4AuditLedgerSealedEvent {
  auditSessionUid: string;
  boundaryB4Hash: string;
  admittedForB5: boolean;
  summary: {
    passCount: number;
    qualifiedCount: number;
    unresolvedCount: number;
    contradictedCount: number;
    hardGateViolations: number;
  };
}

export interface B5PrismNormalizedEvent {
  sessionUid: string;
  boundaryB5Hash: string;
  ownerPrism: B5PrismType;
  presentationGeometry: B5PresentationGeometry;
  emphasisPercentages: Record<B5PrismType, number>;
}

export interface PipelineEventMap {
  'stage:transition:start': StageTransitionStartEvent;
  'stage:transition:complete': StageTransitionCompleteEvent;
  'stage:transition:error': StageTransitionErrorEvent;
  'pipeline:status:change': PipelineStatusChangeEvent;
  'b1:airlock:verified': B1AirlockVerifiedEvent;
  'b2:tree:frozen': B2TreeFrozenEvent;
  'b3:binding:complete': B3BindingCompleteEvent;
  'b4:audit:ledger:sealed': B4AuditLedgerSealedEvent;
  'b5:prism:normalized': B5PrismNormalizedEvent;
}
```

---

## 3. Stage-Specific Inspection & Interactive Controls

### 3.1 Scout / Stage B Inspection Surface
Exposes preserved original source, cryptographic provenance, and Path A/B decomposition:
- **Path A Structured Metadata Reader:**
  ```typescript
  interface ScoutPathAView {
    jobTitle: string;
    employer: string;
    location: { city: string; state: string; zip: string };
    compensation: string;
    employmentType: string;
    industry: string;
    sourceUrl: string;
  }
  ```
- **Path B Decomposition Reader:**
  - `atomic_statements`: string array of isolated unadulterated statements from source.
  - `semantic_categories`: Record of 14 standard category buckets (`Compensation`, `Experience`, `Education`, `Responsibilities`, etc.).
- **Source Verification & SHA-256 Validation:**
  - `payload.scout.original_target_source.source_hash`: SHA-256 digest calculated over `source_text`.
  - UI Verification Method: `verifySourceIntegrity(envelope: TravelingEnvelope): boolean`.

### 3.2 Stage B1 Inspection Surface
Exposes candidate-blind airlock boundary seals and UTF-16 span mappings:
- **Airlock Status:** `candidate_blind_airlock: 'VERIFIED_LOCKED'`.
- **Malform Diagnostics:**
  `VALID_JOB_OBJECT` | `MALFORMED — ORIGIN MISSING` | `MALFORMED — DESTINATION MISSING` | `MALFORMED — UNROUTABLE JOB OBJECT`.
- **Source Span Reader:**
  Array of `B1SourceSpan` where `start_offset` and `end_offset` index directly into `original_target_source.source_text`.
- **Boundary Hashes:**
  `boundary_b_in_hash` and `boundary_b_out_hash`.
- **De-theatricalization Log:**
  Inspects retained and cleaned primitives without theatrical fluff.

### 3.3 Stage B2 Target Tree Inspection Surface
Exposes the hierarchical Target Tree and deterministic node addresses:
- **Tree Node Hierarchy & Coordinates:**
  Deterministic addresses:
  - `t.id.org`, `t.id.title`, `t.id.loc`, `t.id.comp`, `t.id.type`
  - `t.route.dest`, `t.route.method`
  - `t.gate.g01`, `t.gate.g02` ... (Hard candidate gates)
  - `t.cond.c01`, `t.cond.c02` ... (Contextual conditions)
  - `t.duty.d01`, `t.duty.d02` ... (Required role responsibilities)
- **Qualifier Badges:**
  - `*` : Hard gate (Mandatory requirement; zero tolerance for deficiency).
  - `≈` : Soft requirement or negotiable qualification.
  - `""` / `none` : Neutral descriptive or operational item.
- **Node Provenance Inspector:**
  Each node binds to `source_span_provenance` (`raw_text`, `start_offset`, `end_offset`) and `source_span_id`.
- **Immutability Lock:**
  `frozen: true` (Object graph frozen with `Object.freeze()`).

### 3.4 Stage B3 Binding Inspection Surface
Exposes inverted satisfaction questions, eligible spatial planes, and evidence atom selection:
- **Spatial DNA Planes:**
  `Experience` | `Skills` | `Education` | `Certifications` | `Operations` | `Leadership` | `Performance`.
- **Satisfaction Questions:**
  Formulated dynamically per node (e.g., *"Does the candidate possess 5+ years of distributed systems engineering?"*).
- **Evidence Separation Control:**
  - `atoms_considered`: All evidence atoms retrieved across matching planes.
  - `atoms_selected`: The disciplined subset rigorously answering the satisfaction inquiry.
- **Proposition & Blurbs:**
  Disciplined factual synthesis linking candidate evidence to target requirement without marketing hype.

### 3.5 Stage B4 Truth Gate Inspection Surface
Exposes truth verification dispositions and hard-gate defenses:
- **Dispositions:**
  - `PASS`: Requirement rigorously proven by direct evidence.
  - `QUALIFIED_BOUNDED`: Evidence exists but has scope/temporal boundaries (e.g., 3 years vs 5 years).
  - `UNRESOLVED`: Evidence is missing, silent, or indeterminate.
  - `CONTRADICTED`: Candidate profile directly refutes target requirement.
- **Hard Gate Defense Rule (`*`):**
  If `semantic_force === 'hard_candidate_gate'`, any disposition other than `PASS` sets `hard_gate_violation: true`.
- **Evidence Ceiling & Bounded Scope:**
  Explicitly documents where candidate proof maxes out.
- **Audited Ledger & Hash:**
  `audited_ledger: Record<target_address, B4AuditRecord>` sealed with `boundary_b4_hash`.

### 3.6 Stage B5 Semantic Core Reasoning Surface
Exposes the multi-prism projection and presentation geometry:
- **The 5 Reasoning Prisms:**
  1. `Sales Headhunter`: Direct commercial placement, commission-grade leverage, immediate hireability.
  2. `Sports Agent`: Star talent positioning, track-record dominance, peak compensation negotiation.
  3. `Discovery Scout`: Raw upside, latent potential, rare trajectory, untapped capabilities.
  4. `Independent Staffing-Firm Owner`: Risk mitigation, reliability, margin safety, client satisfaction.
  5. `Casting Director`: Script/role exact match, situational fit, ensemble chemistry.
- **Emphasis Normalization:**
  Dynamic percentages strictly normalized such that `sum(emphasis_percentages) === 100%`.
- **Presentation Geometry:**
  `single_dominant` | `dual_dominant` | `dominant_plus_secondary` | `distributed`.
- **Writing Boundaries & Suppressions:**
  Assertions permitted vs prohibited implications.

---

## 4. Runtime Binding Layer

### 4.1 UI State Store Interface (`PipelineUIState`)

```typescript
export type PipelineExecutionStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'executing'
  | 'paused'
  | 'halted_malform'
  | 'completed'
  | 'error';

export type PipelineStageIdentifier =
  | 'scout'
  | 'b'
  | 'b1'
  | 'b2'
  | 'b3'
  | 'b4'
  | 'b5'
  | 'stop_before_resume_factory';

export interface PipelineUIState {
  status: PipelineExecutionStatus;
  activeStage: PipelineStageIdentifier;
  envelope: TravelingEnvelope | null;
  history: Array<{
    stage: string;
    timestamp: string;
    durationMs: number;
    boundaryHash?: string;
  }>;
  selectedNodeAddress: string | null;
  selectedPlane: SpatialDNAPlane | null;
  selectedPrism: B5PrismType | null;
  inspectedSpanId: string | null;
  filters: {
    dispositionFilter: B4Disposition | 'ALL';
    markerFilter: B1Marker | 'ALL';
    categoryFilter: string | 'ALL';
    showOnlyViolations: boolean;
  };
  metrics: {
    totalRawLength: number;
    totalSpans: number;
    totalTreeNodes: number;
    totalHardGates: number;
    totalBindings: number;
    auditSummary: {
      pass: number;
      qualified: number;
      unresolved: number;
      contradicted: number;
      violations: number;
    };
    prismLeader: B5PrismType | null;
  };
  error: {
    message: string;
    stage: string;
    stack?: string;
  } | null;
}
```

### 4.2 Action Handlers (`PipelineUIActions`)

```typescript
export interface PipelineUIActions {
  // Target loading
  onLoadTarget: (input: RawJobInput) => Promise<void>;
  onLoadSampleTarget: (sampleId: string) => Promise<void>;

  // Execution controls
  onStepStage: () => Promise<void>;
  onRunStraightThrough: () => Promise<void>;
  onPause: () => void;
  onReset: () => void;

  // Envelopes & Serialization
  onExportEnvelope: () => string;
  onDownloadEnvelopeJson: (filename?: string) => void;
  onImportEnvelope: (envelopeJson: string) => void;

  // Selection & Navigation
  onSelectNode: (address: string | null) => void;
  onSelectPlane: (plane: SpatialDNAPlane | null) => void;
  onSelectPrism: (prism: B5PrismType | null) => void;
  onInspectSpan: (spanId: string | null) => void;

  // Filtering & View Configuration
  onSetDispositionFilter: (filter: B4Disposition | 'ALL') => void;
  onSetMarkerFilter: (marker: B1Marker | 'ALL') => void;
  onSetCategoryFilter: (category: string | 'ALL') => void;
  onToggleViolationsOnly: (active?: boolean) => void;

  // Candidate DNA management
  onUpdateCandidateDNA: (dna: CandidateSpatialDNA) => void;
}
```

---

## 5. Machine-Readable Schema Manifest

Refer to the companion file `ui-control-contract.json` for machine-readable JSON Schema definitions of all UI control actions, payload models, and state trees.
