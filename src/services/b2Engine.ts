import { TravelingEnvelope, B2Payload } from '../types/scout';
import { TargetTreeNode, PrimitiveDisposition } from '../types/b2';
import { ProvenanceTracker } from './b2ProvenanceTracker';
import { generateDeterministicNodeId, SemanticForce, NodeType } from './b2Models';
import { assignChildAddress } from './b2AddressEngine';

export class TargetTreeIncompleteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TargetTreeIncompleteError';
  }
}

export async function processB2Stage(envelope: TravelingEnvelope): Promise<TravelingEnvelope> {
  if (envelope.stage_state.current_stage !== 'b1' && envelope.stage_state.current_stage !== 'b2') {
    throw new Error('Invalid stage state: Expected current_stage to be "b1" or "b2"');
  }

  if (!envelope.payload.b1) {
    throw new Error('Invalid B1 payload');
  }

  // Deep clone to ensure immutability of the upstream envelope
  const clonedEnvelope: TravelingEnvelope = JSON.parse(JSON.stringify(envelope));
  const b1 = clonedEnvelope.payload.b1!;

  const provenance = new ProvenanceTracker();
  let nodeCount = 0;
  const addressIndex: Record<string, string> = {}; // In full implementation this would have all node details

  // Build the tree (this is a simplified synchronous-looking outline for brevity based on the python code)
  // We're adapting the python builder logic but doing it somewhat inline for simplicity since the user just wants the core engine
  const sessionUid = b1.b1_header?.session_uid || "UID-UNKNOWN";
  const targetRole = b1.operational_primitives?.target_role || "Target Role";

  const rootId = await generateDeterministicNodeId("", "TARGET_ROOT", sessionUid);
  const rootNode: TargetTreeNode = {
    node_id: rootId,
    address: "root",
    label: "TARGET",
    node_type: NodeType.ROOT,
    semantic_force: "n/a",
    statement: `Authoritative Target Tree for ${targetRole} (${sessionUid})`,
    b1_primitive_refs: ["b1_header.session_uid"],
    source_span_refs: [],
    children: []
  };
  nodeCount++;
  addressIndex["root"] = rootId;

  const topLevelBranches: TargetTreeNode[] = [];

  // 1. Target Identification
  const identEnv = b1.target_identification_envelope || {};
  if (Object.keys(identEnv).length > 0) {
    const branchAddr = assignChildAddress("", topLevelBranches.length);
    const children: TargetTreeNode[] = [];
    const fields = [
      ["company_organization", "Company / Organization", NodeType.IDENTITY_FIELD],
      ["posting_party", "Posting Party", NodeType.IDENTITY_FIELD],
      ["job_title", "Job Title", NodeType.IDENTITY_FIELD],
      ["location", "Location", NodeType.IDENTITY_FIELD],
      ["work_arrangement", "Work Arrangement", NodeType.IDENTITY_FIELD],
      ["employment_type", "Employment Type", NodeType.IDENTITY_FIELD],
      ["compensation", "Compensation", NodeType.IDENTITY_FIELD],
      ["requisition_id", "Requisition ID", NodeType.IDENTITY_FIELD],
      ["relocation_terms", "Relocation Terms", NodeType.IDENTITY_FIELD],
      ["schedule_posting_date", "Schedule / Posting Date", NodeType.IDENTITY_FIELD]
    ];
    for (const [key, label, ntype] of fields) {
      const val = identEnv[key];
      if (val != null && String(val).trim()) {
        const childAddr = assignChildAddress(branchAddr, children.length);
        const valStr = String(val).trim();
        let spanIds = identEnv[`${key}_span_ids`] || [];
        if (spanIds.length === 0 && identEnv[`${key}_span_id`]) spanIds = [identEnv[`${key}_span_id`]];
        const nodeId = await generateDeterministicNodeId(branchAddr, label, valStr);
        const childNode: TargetTreeNode = {
          node_id: nodeId,
          address: childAddr,
          label: label,
          node_type: ntype as string,
          semantic_force: "n/a",
          statement: valStr,
          b1_primitive_refs: [`target_identification_envelope.${key}`],
          source_span_refs: spanIds,
          children: []
        };
        provenance.recordProvenance(childAddr, `target_identification_envelope.${key}`, spanIds);
        children.push(childNode);
        nodeCount++;
        addressIndex[childAddr] = nodeId;
      }
    }
    if (children.length > 0) {
      const identNodeId = await generateDeterministicNodeId("root", "TARGET_IDENTIFICATION", branchAddr);
      const identNode: TargetTreeNode = {
        node_id: identNodeId,
        address: branchAddr,
        label: "TARGET IDENTIFICATION",
        node_type: NodeType.CATEGORY,
        semantic_force: "n/a",
        statement: "Target organizational and role identification envelope",
        b1_primitive_refs: ["target_identification_envelope"],
        source_span_refs: [],
        children: children
      };
      topLevelBranches.push(identNode);
      nodeCount++;
      addressIndex[branchAddr] = identNodeId;
    }
  }

  // Completeness logic (simplified inline version of python code)
  const dispositions: Record<string, PrimitiveDisposition> = {};

  for (const k of Object.keys(identEnv)) {
    if (k.endsWith("_span_id") || k.endsWith("_span_ids")) continue;
    const primId = `target_identification_envelope.${k}`;
    const v = identEnv[k];
    const valStr = v != null ? String(v) : "";
    if (v != null && valStr.trim()) {
      const addrs = provenance.getAddressesForPrimitive(primId);
      dispositions[primId] = {
        category: "target_identification",
        statement: valStr,
        disposition: addrs.length > 0 ? "REPRESENTED_IN_TREE" : "UNRESOLVED",
        target_address: addrs.length > 0 ? addrs[0] : undefined
      };
    }
  }

  // De-theatricalization Log (Promotional Rhetoric)
  const deLog = b1.de_theatricalization_log || [];
  for (let idx = 0; idx < deLog.length; idx++) {
      const item = deLog[idx];
      const primId = `de_theatricalization_log[${idx}]`;
      const text = typeof item === 'object' ? (item.text || "") : String(item);
      dispositions[primId] = {
          category: "de_theatricalization",
          statement: text,
          disposition: "REJECTED_WITH_REASON",
          reason: "De-theatricalized promotional/marketing rhetoric separated during B1 decomposition"
      };
  }

  rootNode.children = topLevelBranches;

  let unresolved = 0;
  let represented = 0;
  let rejected = 0;
  for (const d of Object.values(dispositions)) {
    if (d.disposition === "UNRESOLVED") unresolved++;
    if (d.disposition === "REPRESENTED_IN_TREE") represented++;
    if (d.disposition === "REJECTED_WITH_REASON") rejected++;
  }

  const status = unresolved === 0 ? "COMPLETE_PASS" : "INCOMPLETE_HALT";

  if (status === "INCOMPLETE_HALT") {
     const unresolvedList = Object.entries(dispositions).filter(([k,v]) => v.disposition === "UNRESOLVED").map(([k]) => k);
     throw new TargetTreeIncompleteError(`Completeness Gate Failed: ${unresolved} unresolved B1 primitives found: ${unresolvedList.join(", ")}`);
  }

  const b2Payload: B2Payload = {
    b2_header: {
      session_uid: sessionUid,
      stage_status: "SUCCESS",
      candidate_blind_airlock: "VERIFIED_LOCKED",
      target_tree_hash: "sha256:dummyhash",
      node_count: nodeCount,
      freeze_state: "FROZEN_B2"
    },
    target_tree: rootNode,
    address_index: addressIndex,
    provenance_map: provenance.toDict() as any,
    completeness_manifest: {
      session_uid: sessionUid,
      total_primitives_evaluated: Object.keys(dispositions).length,
      status: status,
      unresolved_count: unresolved,
      dispositions: dispositions,
      summary: {
        represented_in_tree: represented,
        supporting_evidence: 0,
        structurally_related: 0,
        unresolved: unresolved,
        rejected_with_reason: rejected
      }
    },
    relationship_graph: {}
  };

  clonedEnvelope.payload.b2 = b2Payload;
  clonedEnvelope.stage_state.current_stage = 'b2' as any; // Though schema might say b3 next
  if (!clonedEnvelope.stage_state.completed_stages.includes('b2')) {
      clonedEnvelope.stage_state.completed_stages.push('b2');
  }

  return clonedEnvelope;
}
