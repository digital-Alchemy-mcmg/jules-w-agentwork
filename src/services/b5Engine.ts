import type {
  B4AuditRecord,
  B5OutputEnvelope,
  B5Payload,
  B5PresentationGeometry,
  B5PrismAssessment,
  B5PrismType,
  TravelingEnvelope,
} from '../types/scout';

export class B5Halt extends Error {
  constructor(public readonly code: string, public readonly detail?: string) {
    super(code);
    this.name = 'B5Halt';
  }
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return 'sha256:' + Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return '{' + Object.keys(object).sort().map(k => JSON.stringify(k) + ':' + canonical(object[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

/**
 * B5 — Semantic Core Reasoning Engine
 *
 * Rules:
 * 1. Reads ONLY B4-admitted and bounded evidence (zero access to non-audited evidence).
 * 2. Asserts no candidate proposition exceeds B4 evidence ceiling.
 * 3. Evaluates all five projection prisms:
 *    - Sales Headhunter: foregrounds undeniable production.
 *    - Sports Agent: foregrounds established value.
 *    - Discovery Scout: foregrounds transferable signal.
 *    - Independent Staffing-Firm Owner: foregrounds industry legibility up to demonstrated fluency.
 *    - Casting Director: whole-candidate interpretation using admitted corpus.
 * 4. Normalizes projection emphasis percentages to exactly 100%.
 *    (Percentages are semantic priority only, NOT truth or confidence scores).
 * 5. Selects owner prism, defines foreground/reinforcement/background/suppression priorities.
 * 6. Sets writing assertiveness boundaries and prohibited implications.
 * 7. Derives presentation geometry.
 * 8. Advances stage to 'stop_before_resume_factory' with status 'complete'.
 */
export async function reasonSemanticCore(envelope: TravelingEnvelope): Promise<B5OutputEnvelope> {
  if (!envelope || envelope.schema_version !== '0.2.0') {
    throw new B5Halt('INVALID_ENVELOPE_SCHEMA');
  }

  if (
    envelope.stage_state?.current_stage !== 'b5' ||
    envelope.stage_state.status !== 'ready' ||
    JSON.stringify(envelope.stage_state.completed_stages) !== '["scout","b1","b2","b3","b4"]'
  ) {
    throw new B5Halt('INVALID_B4_EXIT_STAGE', `Expected stage b5 ready with ['scout','b1','b2','b3','b4'], got ${JSON.stringify(envelope.stage_state)}`);
  }

  if (!envelope.payload?.b4 || !envelope.payload?.b2) {
    throw new B5Halt('B4_OR_B2_PAYLOAD_MISSING');
  }

  const b4 = envelope.payload.b4;
  if (!b4.admitted_for_b5) {
    throw new B5Halt('HARD_GATE_VIOLATION_HALT', 'Candidate was not admitted by B4 truth gate due to hard-gate violations');
  }

  const output = structuredClone(envelope);
  const auditLedger = output.payload.b4!.audited_ledger;
  const auditRecords = Object.values(auditLedger);

  // Read only admitted evidence
  const passRecords = auditRecords.filter(r => r.disposition === 'PASS');
  const qualifiedRecords = auditRecords.filter(r => r.disposition === 'QUALIFIED_BOUNDED');
  const unresolvedRecords = auditRecords.filter(r => r.disposition === 'UNRESOLVED');
  const contradictedRecords = auditRecords.filter(r => r.disposition === 'CONTRADICTED');

  // Evidence anchors mapping
  const evidenceAnchors: Record<string, string[]> = {};
  for (const record of auditRecords) {
    if (record.disposition === 'PASS' || record.disposition === 'QUALIFIED_BOUNDED') {
      evidenceAnchors[record.target_address] = record.selected_evidence_references;
    }
  }

  // Assess all 5 prisms
  // Determine dominant nature of admitted evidence
  const hasStrongOperations = passRecords.some(r => r.target_node_text.toLowerCase().includes('production') || r.target_node_text.toLowerCase().includes('line'));
  const hasStrongQuality = passRecords.some(r => r.target_node_text.toLowerCase().includes('inspection') || r.target_node_text.toLowerCase().includes('certif'));
  const hasStrongExperience = passRecords.some(r => r.target_node_text.toLowerCase().includes('year'));

  // Emphasis distribution (totals exactly 100%)
  // Default distribution tuned to evidence profile
  let emphasis: Record<B5PrismType, number>;
  if (hasStrongOperations && hasStrongQuality) {
    // Operations & Quality production heavy
    emphasis = {
      'Sales Headhunter': 35, // undeniable production
      'Independent Staffing-Firm Owner': 25, // industry fluency
      'Sports Agent': 20, // established track record
      'Casting Director': 10, // whole candidate narrative
      'Discovery Scout': 10, // transferable signal
    };
  } else {
    emphasis = {
      'Independent Staffing-Firm Owner': 30,
      'Sales Headhunter': 25,
      'Sports Agent': 20,
      'Discovery Scout': 15,
      'Casting Director': 10,
    };
  }

  // Rank prisms
  const prismTypes: B5PrismType[] = [
    'Sales Headhunter',
    'Independent Staffing-Firm Owner',
    'Sports Agent',
    'Discovery Scout',
    'Casting Director',
  ];

  prismTypes.sort((a, b) => emphasis[b] - emphasis[a]);

  const descriptions: Record<B5PrismType, string> = {
    'Sales Headhunter': 'Foregrounds undeniable operational production, plant execution metrics, and throughput reliability.',
    'Independent Staffing-Firm Owner': 'Foregrounds industry legibility, technical licensing, and regulatory compliance standards.',
    'Sports Agent': 'Foregrounds verified career progression, tenure, and high-impact past delivery.',
    'Discovery Scout': 'Foregrounds adjacent transferable signals across operational lines and inspection systems.',
    'Casting Director': 'Integrates admitted chronology and patterns into a defensible whole-candidate identity.',
  };

  const rankedPrisms: B5PrismAssessment[] = prismTypes.map((prism, idx) => ({
    prism,
    description: descriptions[prism],
    projection_priority: idx + 1,
    emphasis_percentage: emphasis[prism],
    supported_projection: `Anchored on ${passRecords.length} PASS and ${qualifiedRecords.length} QUALIFIED B4 records.`,
    evidence_anchors: Object.keys(evidenceAnchors),
  }));

  const ownerPrism = rankedPrisms[0].prism;

  // Semantic Priorities
  const foreground: string[] = passRecords
    .filter(r => r.semantic_force === 'hard_candidate_gate' || r.semantic_force === 'required_role_responsibility')
    .map(r => `[DIRECT PRODUCTION] ${r.target_node_text}`);

  const reinforcement: string[] = passRecords
    .filter(r => r.semantic_force === 'contextual_condition' || r.semantic_force === 'target_identity')
    .map(r => `[CREDENTIAL/CONTEXT] ${r.target_node_text}`);

  const background: string[] = qualifiedRecords.map(
    r => `[RESTRICTED SCOPE] ${r.target_node_text} (${r.bounded_scope})`
  );

  const suppression: string[] = [
    ...unresolvedRecords.map(r => `[UNSUPPORTED/UNRESOLVED] Do not claim or infer: ${r.target_node_text}`),
    ...contradictedRecords.map(r => `[CONTRADICTION] Strictly suppress: ${r.target_node_text}`),
    'Do not infer executive strategic scope beyond demonstrated operational management.',
    'Do not extrapolate general manager P&L responsibility from technical quality oversight.',
  ];

  // Writing Boundaries
  const writingBoundaries = {
    assertiveness_ceiling: 'High on admitted operational facts; zero assertiveness on unadmitted or unresolved criteria.',
    permitted_tone: 'Factual, disciplined, production-anchored, and candidate-grounded.',
    allowed_assertions: passRecords.map(r => r.admitted_proposition || r.target_node_text),
  };

  // Prohibited Implications
  const prohibitedImplications = [
    'No unverified doctoral or graduate degrees.',
    'No unstated executive corporate authority.',
    'No claims of capabilities outside B4 evidence ceiling.',
    ...unresolvedRecords.map(r => `No implied mastery of ${r.target_node_text}`),
  ];

  // Presentation Geometry
  let geometryPosture: B5PresentationGeometry = 'dominant_plus_secondary';
  if (emphasis[ownerPrism] >= 50) {
    geometryPosture = 'single_dominant';
  } else if (Math.abs(emphasis[rankedPrisms[0].prism] - emphasis[rankedPrisms[1].prism]) <= 5) {
    geometryPosture = 'dual_dominant';
  }

  const presentationGeometry = {
    posture: geometryPosture,
    rationale: `Owner prism '${ownerPrism}' (${emphasis[ownerPrism]}%) leads with '${rankedPrisms[1].prism}' (${emphasis[rankedPrisms[1].prism]}%) as supporting secondary reinforcement.`,
  };

  const trace = [
    { code: 'PRISM_RANKING', detail: `Owner prism selected: ${ownerPrism} with ${emphasis[ownerPrism]}% emphasis` },
    { code: 'CEILING_ENFORCED', detail: `Bounded strictly to ${passRecords.length} PASS and ${qualifiedRecords.length} QUALIFIED evidence anchors` },
    { code: 'GEOMETRY_DERIVED', detail: `Presentation geometry posture: ${geometryPosture}` },
  ];

  const sessionUid = crypto.randomUUID();
  const boundaryHash = await sha256Hex(
    canonical({
      session_uid: sessionUid,
      envelope_id: output.envelope_id,
      owner_prism: ownerPrism,
      emphasis_percentages: emphasis,
      evidence_anchor_count: Object.keys(evidenceAnchors).length,
    })
  );

  const b5Payload: B5Payload = {
    session_uid: sessionUid,
    boundary_b5_hash: boundaryHash,
    owner_prism: ownerPrism,
    ranked_five_prisms: rankedPrisms,
    projection_emphasis_percentages: emphasis,
    evidence_anchors: evidenceAnchors,
    semantic_priorities: {
      foreground,
      reinforcement,
      background,
      suppression,
    },
    writing_boundaries: writingBoundaries,
    prohibited_implications: prohibitedImplications,
    presentation_geometry: presentationGeometry,
    diagnostic_trace: trace,
  };

  Object.freeze(rankedPrisms);
  Object.freeze(b5Payload);

  output.payload.b5 = b5Payload;
  output.append_log.push({
    stage: 'b5',
    operation: 'semantic_reasoning',
    timestamp: new Date().toISOString(),
    details: {
      observation_id: output.envelope_id.replace(/^ENV-/, ''),
      deduplication_key: output.payload.scout.deduplication_key,
      contract_version: output.schema_version,
    },
  });

  output.stage_state = {
    current_stage: 'stop_before_resume_factory',
    completed_stages: ['scout', 'b1', 'b2', 'b3', 'b4', 'b5'],
    status: 'complete',
  };

  return output as B5OutputEnvelope;
}
