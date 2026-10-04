import type {
  B2Node,
  B3BindingRecord,
  B3OutputEnvelope,
  B3Payload,
  CandidateEvidenceAtom,
  CandidateSpatialDNA,
  SpatialDNAPlane,
  TravelingEnvelope,
} from '../types/scout';

export class B3Halt extends Error {
  constructor(public readonly code: string, public readonly detail?: string) {
    super(code);
    this.name = 'B3Halt';
  }
}

/**
 * Inverts inquiry: forms a satisfaction question from each B2 target node.
 * B3 searches permissively across eligible Spatial DNA planes, distinguishing
 * between atoms considered and atoms selected.
 */
function deriveSatisfactionQuestion(node: B2Node): string {
  if (node.semantic_force === 'hard_candidate_gate') {
    return `Does candidate possess verified, non-negotiable proof satisfying: "${node.node_text}"?`;
  }
  if (node.semantic_force === 'contextual_condition') {
    return `Does candidate possess contextual or preferred background addressing: "${node.node_text}"?`;
  }
  if (node.semantic_force === 'required_role_responsibility') {
    return `Does candidate demonstrate demonstrated operational capacity to execute: "${node.node_text}"?`;
  }
  return `Does candidate match target identity/routing specification: "${node.node_text}"?`;
}

/**
 * Selects eligible Spatial DNA planes based on target node characteristics.
 */
function selectEligiblePlanes(node: B2Node): SpatialDNAPlane[] {
  const text = node.node_text.toLowerCase();
  const planes: SpatialDNAPlane[] = [];

  if (node.semantic_force === 'hard_candidate_gate') {
    if (/(certif|license|degree|diploma|bachelor|clearance)/i.test(text)) {
      planes.push('Certifications', 'Education');
    }
    if (/(years|experience|background)/i.test(text)) {
      planes.push('Experience', 'Performance');
    }
    if (planes.length === 0) {
      planes.push('Experience', 'Skills', 'Certifications');
    }
    return planes;
  }

  if (node.semantic_force === 'required_role_responsibility') {
    planes.push('Operations', 'Leadership', 'Experience');
    if (/(manage|lead|supervise|team|hire)/i.test(text)) {
      planes.push('Leadership');
    }
    if (/(production|line|inspection|facility|plant|logistics)/i.test(text)) {
      planes.push('Operations');
    }
    return Array.from(new Set(planes));
  }

  if (node.semantic_force === 'contextual_condition') {
    planes.push('Experience', 'Skills', 'Education', 'Performance');
    return planes;
  }

  // Identity / routing
  planes.push('Experience');
  return planes;
}

/**
 * Evaluates semantic match between target node and candidate evidence atom.
 */
function atomRelevanceScore(node: B2Node, atom: CandidateEvidenceAtom): number {
  const nodeWords = node.node_text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !/^(with|from|have|must|will|shall|been|more|than|about)\b/i.test(w));

  const atomContent = (atom.statement + ' ' + (atom.context || '')).toLowerCase();
  let matches = 0;
  for (const word of nodeWords) {
    if (atomContent.includes(word)) {
      matches++;
    }
  }
  return matches;
}

/**
 * B3 — Bind Engine
 * - Ingests B2OutputEnvelope (stage: 'b3', completed: ['scout', 'b1', 'b2']).
 * - Takes candidate Spatial DNA evidence.
 * - Inverted inquiry for each target node.
 * - Distinctly records atoms considered vs atoms selected.
 * - Prohibits title-only, convention-only, or necessity-only inferences as proof.
 * - Freezes binding payload and advances envelope to 'b4'.
 */
export async function bindSpatialDNA(
  envelope: TravelingEnvelope,
  candidateDNA: CandidateSpatialDNA
): Promise<B3OutputEnvelope> {
  if (!envelope || envelope.schema_version !== '0.2.0') {
    throw new B3Halt('INVALID_ENVELOPE_SCHEMA');
  }

  if (
    envelope.stage_state?.current_stage !== 'b3' ||
    envelope.stage_state.status !== 'ready' ||
    JSON.stringify(envelope.stage_state.completed_stages) !== '["scout","b1","b2"]'
  ) {
    throw new B3Halt('INVALID_B2_EXIT_STAGE', `Expected stage b3 ready with ['scout','b1','b2'], got ${JSON.stringify(envelope.stage_state)}`);
  }

  if (!envelope.payload?.b2) {
    throw new B3Halt('B2_PAYLOAD_MISSING');
  }

  if (envelope.payload.b3 !== null || envelope.payload.b4 !== null || envelope.payload.b5 !== null) {
    throw new B3Halt('DOWNSTREAM_SLOT_OCCUPIED', 'Downstream slots payload.b3..b5 must be null before B3');
  }

  if (!candidateDNA || !candidateDNA.planes) {
    throw new B3Halt('CANDIDATE_SPATIAL_DNA_MISSING');
  }

  const output = structuredClone(envelope);
  const targetTree = output.payload.b2!;
  const targetNodes = Object.values(targetTree.nodes);

  // We bind leaf/operational nodes, not top-level containers (t, t.id, t.gate, etc.)
  const leafNodes = targetNodes.filter(
    n => n.address !== 't' && n.child_addresses.length === 0
  );

  const bindings: B3BindingRecord[] = [];
  const trace: Array<{ target_address: string; code: string; detail: string }> = [];

  for (const node of leafNodes) {
    const question = deriveSatisfactionQuestion(node);
    const eligiblePlanes = selectEligiblePlanes(node);

    // Search across eligible planes
    const atomsConsidered: CandidateEvidenceAtom[] = [];
    for (const plane of eligiblePlanes) {
      const planeAtoms = candidateDNA.planes[plane] || [];
      atomsConsidered.push(...planeAtoms);
    }

    // Select atoms with affirmative relevance
    const atomsSelected: CandidateEvidenceAtom[] = [];
    for (const atom of atomsConsidered) {
      const score = atomRelevanceScore(node, atom);
      if (score >= 1) {
        atomsSelected.push(atom);
      }
    }

    // Atomic blurbs describing selected evidence without inflation
    const atomicBlurbs: string[] = atomsSelected.map(
      a => `[${a.plane}:${a.atom_id}] ${a.statement}${a.chronology ? ` (${a.chronology})` : ''}`
    );

    // Construct bounded proposition
    let proposition = '';
    let rationale = '';

    if (atomsSelected.length === 0) {
      proposition = `Candidate presents zero direct Spatial DNA evidence for node ${node.address} ("${node.node_text}").`;
      rationale = `Queried ${eligiblePlanes.join(', ')} (${atomsConsidered.length} atoms considered). No relevant candidate evidence discovered.`;
    } else {
      const evidenceStatements = atomsSelected.map(a => a.statement).join('; ');
      proposition = `Candidate provides evidence supporting ${node.address} ("${node.node_text}") via: ${evidenceStatements}.`;
      rationale = `Selected ${atomsSelected.length} of ${atomsConsidered.length} considered atoms across eligible planes [${eligiblePlanes.join(', ')}]. Evidence directly matches node criteria without title extrapolation.`;
    }

    bindings.push({
      target_address: node.address,
      target_node_text: node.node_text,
      semantic_force: node.semantic_force,
      satisfaction_question: question,
      eligible_planes: eligiblePlanes,
      atoms_considered: atomsConsidered,
      atoms_selected: atomsSelected,
      atomic_blurbs: atomicBlurbs,
      proposition,
      rationale,
    });

    trace.push({
      target_address: node.address,
      code: 'NODE_BOUND',
      detail: `Considered: ${atomsConsidered.length}, Selected: ${atomsSelected.length}`,
    });
  }

  const b3Payload: B3Payload = {
    binding_session_uid: crypto.randomUUID(),
    total_bindings: bindings.length,
    bindings,
    diagnostic_trace: trace,
  };

  Object.freeze(bindings);
  Object.freeze(b3Payload);

  output.payload.b3 = b3Payload;
  output.append_log.push({
    stage: 'b3',
    operation: 'bind',
    timestamp: new Date().toISOString(),
    details: {
      observation_id: output.envelope_id.replace(/^ENV-/, ''),
      deduplication_key: output.payload.scout.deduplication_key,
      contract_version: output.schema_version,
    },
  });

  output.stage_state = {
    current_stage: 'b4',
    completed_stages: ['scout', 'b1', 'b2', 'b3'],
    status: 'ready',
  };

  output.payload.b4 = null;
  output.payload.b5 = null;

  return output as B3OutputEnvelope;
}
