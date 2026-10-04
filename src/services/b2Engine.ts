import type {
  B1OutputEnvelope,
  B1Primitive,
  B1SourceSpan,
  B2Node,
  B2OutputEnvelope,
  B2Payload,
  B2SemanticForce,
  TravelingEnvelope,
} from '../types/scout';

export class B2Halt extends Error {
  constructor(public readonly code: string, public readonly detail?: string) {
    super(code);
    this.name = 'B2Halt';
  }
}

/**
 * Builds a deterministic addressable target tree from B1 decomposition.
 * - Ingests B1OutputEnvelope (stage: 'b2', completed: ['scout', 'b1']).
 * - Candidate evidence is quarantined and unread.
 * - Addresses are strictly deterministic lowercase alphanumeric dot-notated identifiers (no scores/weights).
 * - Preserves exact source-span provenance and semantic force.
 * - Freezes tree and advances stage to 'b3'.
 */
export async function constructB2Tree(envelope: TravelingEnvelope): Promise<B2OutputEnvelope> {
  if (!envelope || envelope.schema_version !== '0.2.0') {
    throw new B2Halt('INVALID_ENVELOPE_SCHEMA');
  }

  if (
    envelope.stage_state?.current_stage !== 'b2' ||
    envelope.stage_state.status !== 'ready' ||
    JSON.stringify(envelope.stage_state.completed_stages) !== '["scout","b1"]'
  ) {
    throw new B2Halt('INVALID_B1_EXIT_STAGE', `Expected stage b2 ready with ['scout','b1'], got ${JSON.stringify(envelope.stage_state)}`);
  }

  if (!envelope.payload?.b1) {
    throw new B2Halt('B1_PAYLOAD_MISSING');
  }

  if (envelope.payload.b2 !== null || envelope.payload.b3 !== null || envelope.payload.b4 !== null || envelope.payload.b5 !== null) {
    throw new B2Halt('DOWNSTREAM_SLOT_OCCUPIED', 'Downstream slots payload.b2..b5 must be null before B2');
  }

  const b1 = envelope.payload.b1;
  if (b1.b1_header.candidate_blind_airlock !== 'VERIFIED_LOCKED') {
    throw new B2Halt('AIRLOCK_COMPROMISED', 'B1 candidate-blind airlock is not locked');
  }

  const originalSource = envelope.payload.scout?.original_target_source;
  if (!originalSource || !originalSource.source_text) {
    throw new B2Halt('AUTHORITATIVE_SOURCE_MISSING');
  }

  // Clone envelope to guarantee separate object graph and upstream immutability
  const output = structuredClone(envelope);
  const spanMap = new Map<string, B1SourceSpan>();
  for (const span of output.payload.b1!.source_spans) {
    spanMap.set(span.source_span_id, span);
  }

  const nodes: Record<string, B2Node> = {};
  const trace: Array<{ address: string; code: string; detail: string }> = [];

  const rootAddress = 't';
  const rootNode: B2Node = {
    address: rootAddress,
    parent_address: null,
    category: 'identity',
    title: 'Target Job Root',
    node_text: output.persistent.target_identity.job_title || 'Target Job',
    marker: '',
    semantic_force: 'target_identity',
    source_span_id: 'S-ROOT',
    source_span_provenance: {
      raw_text: output.persistent.target_identity.job_title || 'Target Job',
      start_offset: 0,
      end_offset: 0,
    },
    child_addresses: ['t.id', 't.route', 't.gate', 't.cond', 't.duty'],
  };
  nodes[rootAddress] = rootNode;

  // Branch 1: Target Identity (t.id)
  const idAddress = 't.id';
  const idChildren: string[] = [];
  const idEntries = Object.entries(output.payload.b1!.target_identification_envelope) as Array<[string, B1Primitive[]]>;
  for (const [key, prims] of idEntries) {
    prims.forEach((prim, idx) => {
      const addr = `${idAddress}.${key.slice(0, 4)}${idx > 0 ? idx + 1 : ''}`;
      idChildren.push(addr);
      const span = spanMap.get(prim.source_span_id);
      nodes[addr] = {
        address: addr,
        parent_address: idAddress,
        category: 'identity',
        title: key,
        node_text: prim.node_text,
        marker: prim.marker,
        semantic_force: 'target_identity',
        source_span_id: prim.source_span_id,
        source_span_provenance: {
          raw_text: span ? span.raw_text : prim.node_text,
          start_offset: span ? span.start_offset : 0,
          end_offset: span ? span.end_offset : 0,
        },
        qualifier_scope: prim.qualifier_scope,
        child_addresses: [],
      };
      trace.push({ address: addr, code: 'NODE_CREATED', detail: `Identity node ${key}` });
    });
  }
  nodes[idAddress] = {
    address: idAddress,
    parent_address: rootAddress,
    category: 'identity',
    title: 'Target Identification Envelope',
    node_text: 'Explicit Target Identity',
    marker: '',
    semantic_force: 'target_identity',
    source_span_id: 'S-ID',
    source_span_provenance: { raw_text: 'Identification Envelope', start_offset: 0, end_offset: 0 },
    child_addresses: idChildren,
  };

  // Branch 2: Application Routing (t.route)
  const routeAddress = 't.route';
  const routeChildren: string[] = [];
  const routeEntries = Object.entries(output.payload.b1!.application_routing) as Array<[string, B1Primitive[]]>;
  for (const [key, prims] of routeEntries) {
    prims.forEach((prim, idx) => {
      const addr = `${routeAddress}.${key.slice(0, 4)}${idx > 0 ? idx + 1 : ''}`;
      routeChildren.push(addr);
      const span = spanMap.get(prim.source_span_id);
      nodes[addr] = {
        address: addr,
        parent_address: routeAddress,
        category: 'routing',
        title: key,
        node_text: prim.node_text,
        marker: prim.marker,
        semantic_force: 'application_routing',
        source_span_id: prim.source_span_id,
        source_span_provenance: {
          raw_text: span ? span.raw_text : prim.node_text,
          start_offset: span ? span.start_offset : 0,
          end_offset: span ? span.end_offset : 0,
        },
        qualifier_scope: prim.qualifier_scope,
        child_addresses: [],
      };
      trace.push({ address: addr, code: 'NODE_CREATED', detail: `Routing node ${key}` });
    });
  }
  nodes[routeAddress] = {
    address: routeAddress,
    parent_address: rootAddress,
    category: 'routing',
    title: 'Application Routing',
    node_text: 'Explicit Routing & Destination',
    marker: '',
    semantic_force: 'application_routing',
    source_span_id: 'S-ROUTE',
    source_span_provenance: { raw_text: 'Application Routing', start_offset: 0, end_offset: 0 },
    child_addresses: routeChildren,
  };

  // Branch 3: Hard Candidate Gates (t.gate)
  const gateAddress = 't.gate';
  const gateChildren: string[] = [];
  const hardGates = output.payload.b1!.operational_primitives.hard_candidate_gates;
  hardGates.forEach((prim, idx) => {
    const addr = `${gateAddress}.g${String(idx + 1).padStart(2, '0')}`;
    gateChildren.push(addr);
    const span = spanMap.get(prim.source_span_id);
    nodes[addr] = {
      address: addr,
      parent_address: gateAddress,
      category: 'gate',
      title: `Hard Candidate Gate ${idx + 1}`,
      node_text: prim.node_text,
      marker: '*',
      semantic_force: 'hard_candidate_gate',
      source_span_id: prim.source_span_id,
      source_span_provenance: {
        raw_text: span ? span.raw_text : prim.node_text,
        start_offset: span ? span.start_offset : 0,
        end_offset: span ? span.end_offset : 0,
      },
      qualifier_scope: prim.qualifier_scope,
      child_addresses: [],
    };
    trace.push({ address: addr, code: 'HARD_GATE_CREATED', detail: prim.node_text });
  });
  nodes[gateAddress] = {
    address: gateAddress,
    parent_address: rootAddress,
    category: 'gate',
    title: 'Hard Candidate Gates',
    node_text: 'Mandatory Non-Negotiable Admission Gates',
    marker: '*',
    semantic_force: 'hard_candidate_gate',
    source_span_id: 'S-GATES',
    source_span_provenance: { raw_text: 'Hard Gates', start_offset: 0, end_offset: 0 },
    child_addresses: gateChildren,
  };

  // Branch 4: Contextual Conditions (t.cond)
  const condAddress = 't.cond';
  const condChildren: string[] = [];
  const softConds = output.payload.b1!.operational_primitives.contextual_conditions;
  softConds.forEach((prim, idx) => {
    const addr = `${condAddress}.c${String(idx + 1).padStart(2, '0')}`;
    condChildren.push(addr);
    const span = spanMap.get(prim.source_span_id);
    nodes[addr] = {
      address: addr,
      parent_address: condAddress,
      category: 'condition',
      title: `Contextual Condition ${idx + 1}`,
      node_text: prim.node_text,
      marker: '≈',
      semantic_force: 'contextual_condition',
      source_span_id: prim.source_span_id,
      source_span_provenance: {
        raw_text: span ? span.raw_text : prim.node_text,
        start_offset: span ? span.start_offset : 0,
        end_offset: span ? span.end_offset : 0,
      },
      qualifier_scope: prim.qualifier_scope,
      child_addresses: [],
    };
    trace.push({ address: addr, code: 'CONDITION_CREATED', detail: prim.node_text });
  });
  nodes[condAddress] = {
    address: condAddress,
    parent_address: rootAddress,
    category: 'condition',
    title: 'Contextual Conditions',
    node_text: 'Soft, Preferred, or Contextual Qualifications',
    marker: '≈',
    semantic_force: 'contextual_condition',
    source_span_id: 'S-CONDS',
    source_span_provenance: { raw_text: 'Contextual Conditions', start_offset: 0, end_offset: 0 },
    child_addresses: condChildren,
  };

  // Branch 5: Required Role Responsibilities (t.duty)
  const dutyAddress = 't.duty';
  const dutyChildren: string[] = [];
  const duties = output.payload.b1!.operational_primitives.required_role_responsibilities;
  duties.forEach((prim, idx) => {
    const addr = `${dutyAddress}.d${String(idx + 1).padStart(2, '0')}`;
    dutyChildren.push(addr);
    const span = spanMap.get(prim.source_span_id);
    nodes[addr] = {
      address: addr,
      parent_address: dutyAddress,
      category: 'duty',
      title: `Operating Responsibility ${idx + 1}`,
      node_text: prim.node_text,
      marker: '',
      semantic_force: 'required_role_responsibility',
      source_span_id: prim.source_span_id,
      source_span_provenance: {
        raw_text: span ? span.raw_text : prim.node_text,
        start_offset: span ? span.start_offset : 0,
        end_offset: span ? span.end_offset : 0,
      },
      qualifier_scope: prim.qualifier_scope,
      child_addresses: [],
    };
    trace.push({ address: addr, code: 'DUTY_CREATED', detail: prim.node_text });
  });
  nodes[dutyAddress] = {
    address: dutyAddress,
    parent_address: rootAddress,
    category: 'duty',
    title: 'Required Role Responsibilities',
    node_text: 'Operational Duties and Execution Requirements',
    marker: '',
    semantic_force: 'required_role_responsibility',
    source_span_id: 'S-DUTIES',
    source_span_provenance: { raw_text: 'Responsibilities', start_offset: 0, end_offset: 0 },
    child_addresses: dutyChildren,
  };

  const treeId = `TREE-${output.envelope_id.replace(/^ENV-/, '')}`;
  const b2Payload: B2Payload = {
    tree_id: treeId,
    root_address: rootAddress,
    target_source_hash: originalSource.source_hash,
    frozen: true,
    total_nodes: Object.keys(nodes).length,
    gate_count: hardGates.length,
    nodes,
    diagnostic_trace: trace,
  };

  // Freeze payload object
  Object.freeze(nodes);
  Object.freeze(b2Payload);

  output.payload.b2 = b2Payload;
  output.append_log.push({
    stage: 'b2',
    operation: 'create_and_freeze_tree',
    timestamp: new Date().toISOString(),
    details: {
      observation_id: output.envelope_id.replace(/^ENV-/, ''),
      deduplication_key: output.payload.scout.deduplication_key,
      contract_version: output.schema_version,
    },
  });

  output.stage_state = {
    current_stage: 'b3',
    completed_stages: ['scout', 'b1', 'b2'],
    status: 'ready',
  };

  // Verify downstream slots remain null
  output.payload.b3 = null;
  output.payload.b4 = null;
  output.payload.b5 = null;

  return output as B2OutputEnvelope;
}
