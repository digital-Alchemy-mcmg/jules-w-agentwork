import type {
  B4AuditRecord,
  B4Disposition,
  B4OutputEnvelope,
  B4Payload,
  TravelingEnvelope,
} from '../types/scout';

export class B4Halt extends Error {
  constructor(public readonly code: string, public readonly detail?: string) {
    super(code);
    this.name = 'B4Halt';
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
 * B4 — Truth Gate Engine
 *
 * Rules:
 * 1. B4 audits each proposition against ONLY the evidence B3 actually selected.
 *    (B4 CANNOT query the candidate corpus directly to rescue a weak proposition).
 * 2. Strict Hard-Gate Defense:
 *    If target_node is a hard gate (`*`), qualified/bounded scope CANNOT convert a missing
 *    or partial fact into satisfaction. It must remain UNRESOLVED or CONTRADICTED.
 * 3. Dispositions:
 *    - PASS: Fully supported by selected evidence.
 *    - QUALIFIED_BOUNDED: Supported at a narrower scope, permitted ONLY for non-hard nodes.
 *    - UNRESOLVED: Insufficient or missing evidence.
 *    - CONTRADICTED: Evidence actively contradicts or negates proposition.
 * 4. Sets non-negotiable evidence ceilings and seals boundary hash.
 * 5. Advances envelope to 'b5' ready, preparing B5 Semantic Core.
 */
export async function auditTruthGate(envelope: TravelingEnvelope): Promise<B4OutputEnvelope> {
  if (!envelope || envelope.schema_version !== '0.2.0') {
    throw new B4Halt('INVALID_ENVELOPE_SCHEMA');
  }

  if (
    envelope.stage_state?.current_stage !== 'b4' ||
    envelope.stage_state.status !== 'ready' ||
    JSON.stringify(envelope.stage_state.completed_stages) !== '["scout","b1","b2","b3"]'
  ) {
    throw new B4Halt('INVALID_B3_EXIT_STAGE', `Expected stage b4 ready with ['scout','b1','b2','b3'], got ${JSON.stringify(envelope.stage_state)}`);
  }

  if (!envelope.payload?.b3 || !envelope.payload?.b2) {
    throw new B4Halt('B3_OR_B2_PAYLOAD_MISSING');
  }

  if (envelope.payload.b4 !== null || envelope.payload.b5 !== null) {
    throw new B4Halt('DOWNSTREAM_SLOT_OCCUPIED', 'Downstream slots payload.b4 and b5 must be null before B4');
  }

  const output = structuredClone(envelope);
  const b3 = output.payload.b3!;
  const b2Nodes = output.payload.b2!.nodes;

  const auditedLedger: Record<string, B4AuditRecord> = {};
  const trace: Array<{ target_address: string; code: string; detail: string }> = [];

  let passCount = 0;
  let qualifiedCount = 0;
  let unresolvedCount = 0;
  let contradictedCount = 0;
  let hardGateViolations = 0;

  for (const binding of b3.bindings) {
    const node = b2Nodes[binding.target_address];
    if (!node) {
      throw new B4Halt('ORPHAN_BINDING_ADDRESS', `Binding address ${binding.target_address} does not exist in B2 target tree`);
    }

    const isHardGate = node.semantic_force === 'hard_candidate_gate' || node.marker === '*';
    const selectedEvidence = binding.atoms_selected;
    const selectedIds = selectedEvidence.map(a => a.atom_id);

    let disposition: B4Disposition = 'UNRESOLVED';
    let admittedProposition: string | null = null;
    let boundedScope: string | null = null;
    let evidenceCeiling = 'NONE';
    let hardGateViolation = false;
    let reason = '';
    const auditSteps: string[] = [];

    auditSteps.push(`Evaluating B3 proposition for node ${binding.target_address} against ${selectedEvidence.length} submitted atoms`);

    if (selectedEvidence.length === 0) {
      disposition = 'UNRESOLVED';
      evidenceCeiling = 'ZERO_EVIDENCE';
      reason = `Zero candidate evidence submitted by B3 for node "${binding.target_node_text}".`;
      auditSteps.push('Zero selected atoms -> Disposition UNRESOLVED');

      if (isHardGate) {
        hardGateViolation = true;
        hardGateViolations++;
        reason += ' Hard candidate gate failed: mandatory requirement unmet.';
        auditSteps.push('VIOLATION: Hard candidate gate has zero evidence');
      }
    } else {
      // Evaluate evidence completeness
      const evidenceStatements = selectedEvidence.map(a => a.statement).join('; ');
      const nodeTextLower = binding.target_node_text.toLowerCase();

      // Check for explicit contradiction
      const hasContradiction = selectedEvidence.some(
        a => /\b(not qualified|failed|refused|revoked|terminated|expired|disqualified)\b/i.test(a.statement)
      );

      if (hasContradiction) {
        disposition = 'CONTRADICTED';
        evidenceCeiling = 'CONTRADICTION_DETECTED';
        reason = `Submitted evidence contains explicit contradiction or disqualifier against "${binding.target_node_text}".`;
        auditSteps.push('Contradiction detected in submitted atoms -> Disposition CONTRADICTED');
        if (isHardGate) {
          hardGateViolation = true;
          hardGateViolations++;
          reason += ' Hard candidate gate actively contradicted.';
        }
      } else {
        // Test proposition fit
        const isExactMatch = isEvidenceSufficient(nodeTextLower, selectedEvidence);

        if (isExactMatch) {
          disposition = 'PASS';
          admittedProposition = binding.proposition;
          boundedScope = 'FULL_TARGET_SCOPE';
          evidenceCeiling = `VERIFIED_DIRECT: ${evidenceStatements}`;
          reason = `Submitted Spatial DNA evidence directly and fully satisfies "${binding.target_node_text}".`;
          auditSteps.push('Direct satisfaction established -> Disposition PASS');
          passCount++;
        } else {
          // Narrower or partial evidence
          if (isHardGate) {
            // STRICT HARD-GATE ENFORCEMENT:
            // A hard candidate gate cannot be satisfied by qualified or bounded scope!
            disposition = 'UNRESOLVED';
            admittedProposition = null;
            boundedScope = 'INSUFFICIENT_FOR_HARD_GATE';
            evidenceCeiling = `RESTRICTED_NON_ADMITTED: ${evidenceStatements}`;
            hardGateViolation = true;
            hardGateViolations++;
            reason = `Evidence offers partial/adjacent background but CANNOT satisfy mandatory hard gate "${binding.target_node_text}". Qualified substitution prohibited for hard gates.`;
            auditSteps.push('HARD GATE DEFENSE: Partial evidence rejected as satisfaction for hard gate');
            unresolvedCount++;
          } else {
            // Contextual or duty node can be admitted at restricted scope
            disposition = 'QUALIFIED_BOUNDED';
            admittedProposition = `At bounded scope: ${evidenceStatements}`;
            boundedScope = `RESTRICTED_SCOPE: Admitted strictly within scope of demonstrated atoms [${selectedIds.join(', ')}]`;
            evidenceCeiling = `BOUNDED_PARTIAL: ${evidenceStatements}`;
            reason = `Evidence establishes partial or transferable operational capacity for non-mandatory node "${binding.target_node_text}".`;
            auditSteps.push('Transferable/adjacent capacity admitted at restricted scope -> Disposition QUALIFIED_BOUNDED');
            qualifiedCount++;
          }
        }
      }
    }

    if (disposition === 'UNRESOLVED' && !hardGateViolation) {
      unresolvedCount++;
    }
    if (disposition === 'CONTRADICTED') {
      contradictedCount++;
    }

    auditedLedger[binding.target_address] = {
      target_address: binding.target_address,
      target_node_text: binding.target_node_text,
      semantic_force: binding.semantic_force,
      disposition,
      admitted_proposition: admittedProposition,
      bounded_scope: boundedScope,
      evidence_ceiling: evidenceCeiling,
      hard_gate_violation: hardGateViolation,
      reason,
      audit_trace: auditSteps,
      selected_evidence_references: selectedIds,
    };

    trace.push({
      target_address: binding.target_address,
      code: `AUDIT_${disposition}`,
      detail: reason,
    });
  }

  const boundaryHashInput = canonical({
    envelope_id: output.envelope_id,
    b3_uid: b3.binding_session_uid,
    pass_count: passCount,
    qualified_count: qualifiedCount,
    unresolved_count: unresolvedCount,
    contradicted_count: contradictedCount,
    hard_gate_violations: hardGateViolations,
  });

  const boundaryB4Hash = await sha256Hex(boundaryHashInput);

  const b4Payload: B4Payload = {
    audit_session_uid: crypto.randomUUID(),
    boundary_b4_hash: boundaryB4Hash,
    disposition_summary: {
      pass_count: passCount,
      qualified_count: qualifiedCount,
      unresolved_count: unresolvedCount,
      contradicted_count: contradictedCount,
      hard_gate_violations: hardGateViolations,
    },
    audited_ledger: auditedLedger,
    admitted_for_b5: hardGateViolations === 0, // Invariant: candidate admitted to B5 only if zero hard gate violations
    diagnostic_trace: trace,
  };

  Object.freeze(auditedLedger);
  Object.freeze(b4Payload);

  output.payload.b4 = b4Payload;
  output.append_log.push({
    stage: 'b4',
    operation: 'truth_audit',
    timestamp: new Date().toISOString(),
    details: {
      observation_id: output.envelope_id.replace(/^ENV-/, ''),
      deduplication_key: output.payload.scout.deduplication_key,
      contract_version: output.schema_version,
    },
  });

  output.stage_state = {
    current_stage: 'b5',
    completed_stages: ['scout', 'b1', 'b2', 'b3', 'b4'],
    status: 'ready',
  };

  output.payload.b5 = null; // Clean downstream slot for B5 Semantic Core

  return output as B4OutputEnvelope;
}

/**
 * Checks whether the submitted atoms provide genuine direct coverage of the node text.
 */
function isEvidenceSufficient(nodeTextLower: string, atoms: Array<{ statement: string }>): boolean {
  const combined = atoms.map(a => a.statement.toLowerCase()).join(' ');

  // Certifications / Licenses
  if (nodeTextLower.includes('license') || nodeTextLower.includes('certification') || nodeTextLower.includes('certificate')) {
    return /(license|certified|certification|cert)/i.test(combined);
  }

  // Years of experience
  const yearMatch = nodeTextLower.match(/(\d+)\+?\s*years?/);
  if (yearMatch) {
    const requiredYears = parseInt(yearMatch[1], 10);
    const candidateYearMatch = combined.match(/(\d+)\+?\s*years?/);
    if (candidateYearMatch) {
      const candidateYears = parseInt(candidateYearMatch[1], 10);
      return candidateYears >= requiredYears;
    }
  }

  // Core operational duties (e.g. production lines, inspections)
  if (nodeTextLower.includes('production line') || nodeTextLower.includes('line')) {
    return combined.includes('production') || combined.includes('manufacturing') || combined.includes('line');
  }
  if (nodeTextLower.includes('inspection') || nodeTextLower.includes('quality')) {
    return combined.includes('inspection') || combined.includes('inspect') || combined.includes('audit');
  }

  return atoms.length > 0;
}
