import { TravelingEnvelope, B2Payload, B1Primitive } from '../types/scout';
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

async function hashTargetTree(tree: TargetTreeNode): Promise<string> {
  const payload = JSON.stringify(tree);
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `sha256:${hashHex}`;
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
  const addressIndex: Record<string, string> = {};

  const sessionUid = b1.b1_header?.session_uid || "UID-UNKNOWN";

  // Find target role from B1 primitives (it's an array of B1Primitive now)
  const targetRolePrims = b1.operational_primitives?.target_role || [];
  const targetRole = targetRolePrims.length > 0 ? targetRolePrims[0].node_text : "Target Role";

  const rootId = await generateDeterministicNodeId("", "TARGET_ROOT", sessionUid);
  const rootNode: TargetTreeNode = {
    node_id: rootId,
    address: "root",
    label: "TARGET",
    node_type: NodeType.ROOT,
    semantic_force: SemanticForce.NOT_APPLICABLE,
    statement: `Authoritative Target Tree for ${targetRole} (${sessionUid})`,
    b1_primitive_refs: ["b1_header.session_uid"],
    source_span_refs: [],
    children: []
  };
  nodeCount++;
  addressIndex["root"] = rootId;

  const topLevelBranches: TargetTreeNode[] = [];
  const dispositions: Record<string, PrimitiveDisposition> = {};

  // Helper to record disposition
  const recordDisposition = (primId: string, category: string, statement: string, disp: PrimitiveDisposition['disposition'], targetAddress?: string, reason?: string) => {
    dispositions[primId] = { category, statement, disposition: disp, target_address: targetAddress, reason };
  };

  // 1. Target Identification
  const identEnv = b1.target_identification_envelope || {};
  const identFields = [
    ["company_organization", "Company / Organization"],
    ["posting_party", "Posting Party"],
    ["job_title", "Job Title"],
    ["location", "Location"],
    ["work_arrangement", "Work Arrangement"],
    ["employment_type", "Employment Type"],
    ["compensation", "Compensation"],
    ["requisition_id", "Requisition ID"],
    ["relocation_terms", "Relocation Terms"],
    ["schedule_posting_date", "Schedule / Posting Date"]
  ];

  const identChildren: TargetTreeNode[] = [];
  const identBranchAddr = assignChildAddress("", topLevelBranches.length);

  for (const [key, label] of identFields) {
    const prims: B1Primitive[] = (identEnv as any)[key] || [];
    for (let i = 0; i < prims.length; i++) {
        const prim = prims[i];
        if (prim && prim.node_text && prim.node_text.trim()) {
            const childAddr = assignChildAddress(identBranchAddr, identChildren.length);
            const valStr = prim.node_text.trim();
            const spanIds = prim.source_span_id ? [prim.source_span_id] : [];
            const nodeId = await generateDeterministicNodeId(identBranchAddr, label, valStr);
            const primId = `target_identification_envelope.${key}[${i}]`;

            identChildren.push({
                node_id: nodeId,
                address: childAddr,
                label: label,
                node_type: NodeType.IDENTITY_FIELD,
                semantic_force: SemanticForce.NOT_APPLICABLE,
                statement: valStr,
                b1_primitive_refs: [primId],
                source_span_refs: spanIds,
                children: []
            });
            provenance.recordProvenance(childAddr, primId, spanIds);
            nodeCount++;
            addressIndex[childAddr] = nodeId;

            recordDisposition(primId, "target_identification", valStr, "REPRESENTED_IN_TREE", childAddr);
        }
    }
  }

  if (identChildren.length > 0) {
    const identNodeId = await generateDeterministicNodeId("root", "TARGET_IDENTIFICATION", identBranchAddr);
    topLevelBranches.push({
      node_id: identNodeId,
      address: identBranchAddr,
      label: "TARGET IDENTIFICATION",
      node_type: NodeType.CATEGORY,
      semantic_force: SemanticForce.NOT_APPLICABLE,
      statement: "Target organizational and role identification envelope",
      b1_primitive_refs: ["target_identification_envelope"],
      source_span_refs: [],
      children: identChildren
    });
    nodeCount++;
    addressIndex[identBranchAddr] = identNodeId;
  }

  // 2. Application Routing
  const routingEnv = b1.application_routing || {};
  const routingFields = [
      ["application_method", "Application Method"],
      ["destination_url", "Destination URL"],
      ["recruiter_contact", "Recruiter / Contact"],
      ["required_submission_materials", "Submission Materials"],
      ["special_instructions", "Special Instructions"]
  ];

  const routingChildren: TargetTreeNode[] = [];
  const routingBranchAddr = assignChildAddress("", topLevelBranches.length);

  for (const [key, label] of routingFields) {
    const prims: B1Primitive[] = (routingEnv as any)[key] || [];
    for (let i = 0; i < prims.length; i++) {
        const prim = prims[i];
        if (prim && prim.node_text && prim.node_text.trim()) {
            const childAddr = assignChildAddress(routingBranchAddr, routingChildren.length);
            const valStr = prim.node_text.trim();
            const spanIds = prim.source_span_id ? [prim.source_span_id] : [];
            const nodeId = await generateDeterministicNodeId(routingBranchAddr, label, valStr);
            const primId = `application_routing.${key}[${i}]`;

            routingChildren.push({
                node_id: nodeId,
                address: childAddr,
                label: label,
                node_type: NodeType.ROUTING_FIELD,
                semantic_force: SemanticForce.NOT_APPLICABLE,
                statement: valStr,
                b1_primitive_refs: [primId],
                source_span_refs: spanIds,
                children: []
            });
            provenance.recordProvenance(childAddr, primId, spanIds);
            nodeCount++;
            addressIndex[childAddr] = nodeId;

            recordDisposition(primId, "application_routing", valStr, "REPRESENTED_IN_TREE", childAddr);
        }
    }
  }

  if (routingChildren.length > 0) {
    const routingNodeId = await generateDeterministicNodeId("root", "APPLICATION_ROUTING", routingBranchAddr);
    topLevelBranches.push({
      node_id: routingNodeId,
      address: routingBranchAddr,
      label: "APPLICATION ROUTING",
      node_type: NodeType.CATEGORY,
      semantic_force: SemanticForce.NOT_APPLICABLE,
      statement: "Actionable application destination and submission pathway",
      b1_primitive_refs: ["application_routing"],
      source_span_refs: [],
      children: routingChildren
    });
    nodeCount++;
    addressIndex[routingBranchAddr] = routingNodeId;
  }

  // 3. Operational Primitives (Target Role, Hard Gates, Contextual, Responsibilities)
  const opPrims = b1.operational_primitives || {};

  // Target Role
  const rolePrims: B1Primitive[] = opPrims.target_role || [];
  const roleChildren: TargetTreeNode[] = [];
  const roleBranchAddr = assignChildAddress("", topLevelBranches.length);
  for (let i = 0; i < rolePrims.length; i++) {
      const prim = rolePrims[i];
      if (prim && prim.node_text && prim.node_text.trim()) {
          const childAddr = assignChildAddress(roleBranchAddr, roleChildren.length);
          const valStr = prim.node_text.trim();
          const spanIds = prim.source_span_id ? [prim.source_span_id] : [];
          const nodeId = await generateDeterministicNodeId(roleBranchAddr, "ROLE_SCOPE", valStr);
          const primId = `operational_primitives.target_role[${i}]`;

          roleChildren.push({
              node_id: nodeId,
              address: childAddr,
              label: "Target Role Scope",
              node_type: NodeType.TARGET_ROLE,
              semantic_force: SemanticForce.NOT_APPLICABLE,
              statement: valStr,
              b1_primitive_refs: [primId],
              source_span_refs: spanIds,
              children: []
          });
          provenance.recordProvenance(childAddr, primId, spanIds);
          nodeCount++;
          addressIndex[childAddr] = nodeId;
          recordDisposition(primId, "target_role", valStr, "REPRESENTED_IN_TREE", childAddr);
      }
  }
  if (roleChildren.length > 0) {
      const roleNodeId = await generateDeterministicNodeId("root", "TARGET_ROLE", roleBranchAddr);
      topLevelBranches.push({
          node_id: roleNodeId,
          address: roleBranchAddr,
          label: "TARGET ROLE",
          node_type: NodeType.CATEGORY,
          semantic_force: SemanticForce.NOT_APPLICABLE,
          statement: "Target role designation and operational scope",
          b1_primitive_refs: ["operational_primitives.target_role"],
          source_span_refs: [],
          children: roleChildren
      });
      nodeCount++;
      addressIndex[roleBranchAddr] = roleNodeId;
  }

  // Requirements (Hard Gates + Contextual)
  const hardGates: B1Primitive[] = opPrims.hard_candidate_gates || [];
  const softGates: B1Primitive[] = opPrims.contextual_conditions || [];
  if (hardGates.length > 0 || softGates.length > 0) {
      const reqBranchAddr = assignChildAddress("", topLevelBranches.length);
      const reqChildren: TargetTreeNode[] = [];

      if (hardGates.length > 0) {
          const hgSubAddr = assignChildAddress(reqBranchAddr, reqChildren.length);
          const hgLeaves: TargetTreeNode[] = [];
          for (let i = 0; i < hardGates.length; i++) {
              const prim = hardGates[i];
              if (prim && prim.node_text && prim.node_text.trim()) {
                  const childAddr = assignChildAddress(hgSubAddr, hgLeaves.length);
                  const valStr = prim.node_text.trim();
                  const spanIds = prim.source_span_id ? [prim.source_span_id] : [];
                  const nodeId = await generateDeterministicNodeId(hgSubAddr, "HARD_GATE", valStr);
                  const primId = `operational_primitives.hard_candidate_gates[${i}]`;

                  hgLeaves.push({
                      node_id: nodeId,
                      address: childAddr,
                      label: `Hard Gate: ${valStr.substring(0, 50)}`,
                      node_type: NodeType.HARD_GATE,
                      semantic_force: SemanticForce.HARD_GATE,
                      statement: valStr,
                      b1_primitive_refs: [primId],
                      source_span_refs: spanIds,
                      children: []
                  });
                  provenance.recordProvenance(childAddr, primId, spanIds);
                  nodeCount++;
                  addressIndex[childAddr] = nodeId;
                  recordDisposition(primId, "hard_candidate_gate", valStr, "REPRESENTED_IN_TREE", childAddr);
              }
          }
          if (hgLeaves.length > 0) {
              const hgNodeId = await generateDeterministicNodeId(reqBranchAddr, "HARD_GATES", hgSubAddr);
              reqChildren.push({
                  node_id: hgNodeId,
                  address: hgSubAddr,
                  label: "HARD CANDIDATE GATES (*)",
                  node_type: NodeType.CATEGORY,
                  semantic_force: SemanticForce.NOT_APPLICABLE,
                  statement: "Mandatory candidate admission gates and eligibility thresholds",
                  b1_primitive_refs: ["operational_primitives.hard_candidate_gates"],
                  source_span_refs: [],
                  children: hgLeaves
              });
              nodeCount++;
              addressIndex[hgSubAddr] = hgNodeId;
          }
      }

      if (softGates.length > 0) {
          const sgSubAddr = assignChildAddress(reqBranchAddr, reqChildren.length);
          const sgLeaves: TargetTreeNode[] = [];
          for (let i = 0; i < softGates.length; i++) {
              const prim = softGates[i];
              if (prim && prim.node_text && prim.node_text.trim()) {
                  const childAddr = assignChildAddress(sgSubAddr, sgLeaves.length);
                  const valStr = prim.node_text.trim();
                  const spanIds = prim.source_span_id ? [prim.source_span_id] : [];
                  const nodeId = await generateDeterministicNodeId(sgSubAddr, "CONTEXTUAL_CONDITION", valStr);
                  const primId = `operational_primitives.contextual_conditions[${i}]`;

                  sgLeaves.push({
                      node_id: nodeId,
                      address: childAddr,
                      label: `Contextual Condition: ${valStr.substring(0, 50)}`,
                      node_type: NodeType.CONTEXTUAL_CONDITION,
                      semantic_force: SemanticForce.CONTEXTUAL,
                      statement: valStr,
                      b1_primitive_refs: [primId],
                      source_span_refs: spanIds,
                      children: [] // simplified qualifier_scope handling for now
                  });
                  provenance.recordProvenance(childAddr, primId, spanIds);
                  nodeCount++;
                  addressIndex[childAddr] = nodeId;
                  recordDisposition(primId, "contextual_condition", valStr, "REPRESENTED_IN_TREE", childAddr);
              }
          }
          if (sgLeaves.length > 0) {
              const sgNodeId = await generateDeterministicNodeId(reqBranchAddr, "CONTEXTUAL_CONDITIONS", sgSubAddr);
              reqChildren.push({
                  node_id: sgNodeId,
                  address: sgSubAddr,
                  label: "CONTEXTUAL CONDITIONS (≈)",
                  node_type: NodeType.CATEGORY,
                  semantic_force: SemanticForce.NOT_APPLICABLE,
                  statement: "Preferred qualifications and contextual conditions",
                  b1_primitive_refs: ["operational_primitives.contextual_conditions"],
                  source_span_refs: [],
                  children: sgLeaves
              });
              nodeCount++;
              addressIndex[sgSubAddr] = sgNodeId;
          }
      }

      if (reqChildren.length > 0) {
          const reqNodeId = await generateDeterministicNodeId("root", "REQUIREMENTS", reqBranchAddr);
          topLevelBranches.push({
              node_id: reqNodeId,
              address: reqBranchAddr,
              label: "REQUIREMENTS",
              node_type: NodeType.CATEGORY,
              semantic_force: SemanticForce.NOT_APPLICABLE,
              statement: "Candidate requirements partitioned by strict semantic force",
              b1_primitive_refs: ["operational_primitives.hard_candidate_gates", "operational_primitives.contextual_conditions"],
              source_span_refs: [],
              children: reqChildren
          });
          nodeCount++;
          addressIndex[reqBranchAddr] = reqNodeId;
      }
  }

  // Role Responsibilities
  const resps: B1Primitive[] = opPrims.required_role_responsibilities || [];
  if (resps.length > 0) {
      const respBranchAddr = assignChildAddress("", topLevelBranches.length);
      const respChildren: TargetTreeNode[] = [];
      for (let i = 0; i < resps.length; i++) {
          const prim = resps[i];
          if (prim && prim.node_text && prim.node_text.trim()) {
              const childAddr = assignChildAddress(respBranchAddr, respChildren.length);
              const valStr = prim.node_text.trim();
              const spanIds = prim.source_span_id ? [prim.source_span_id] : [];
              const nodeId = await generateDeterministicNodeId(respBranchAddr, "RESPONSIBILITY", valStr);
              const primId = `operational_primitives.required_role_responsibilities[${i}]`;

              respChildren.push({
                  node_id: nodeId,
                  address: childAddr,
                  label: `Responsibility: ${valStr.substring(0, 50)}`,
                  node_type: NodeType.ROLE_RESPONSIBILITY,
                  semantic_force: SemanticForce.RESPONSIBILITY,
                  statement: valStr,
                  b1_primitive_refs: [primId],
                  source_span_refs: spanIds,
                  children: []
              });
              provenance.recordProvenance(childAddr, primId, spanIds);
              nodeCount++;
              addressIndex[childAddr] = nodeId;
              recordDisposition(primId, "role_responsibility", valStr, "REPRESENTED_IN_TREE", childAddr);
          }
      }

      if (respChildren.length > 0) {
          const respNodeId = await generateDeterministicNodeId("root", "ROLE_RESPONSIBILITIES", respBranchAddr);
          topLevelBranches.push({
              node_id: respNodeId,
              address: respBranchAddr,
              label: "ROLE RESPONSIBILITIES",
              node_type: NodeType.CATEGORY,
              semantic_force: SemanticForce.NOT_APPLICABLE,
              statement: "Required operational duties and responsibilities once hired",
              b1_primitive_refs: ["operational_primitives.required_role_responsibilities"],
              source_span_refs: [],
              children: respChildren
          });
          nodeCount++;
          addressIndex[respBranchAddr] = respNodeId;
      }
  }

  // De-theatricalization Log (Promotional Rhetoric) -> Always Rejected
  const deLog = b1.de_theatricalization_log || [];
  for (let idx = 0; idx < deLog.length; idx++) {
      const item = deLog[idx];
      const primId = `de_theatricalization_log[${idx}]`;
      const text = item.reason || "De-theatricalized text";
      recordDisposition(primId, "de_theatricalization", text, "REJECTED_WITH_REASON", undefined, "De-theatricalized promotional/marketing rhetoric separated during B1 decomposition");
  }

  // Unresolved check for anything in b1 that wasn't covered.
  // Real implementation iterates through all lists to ensure every primitive got a disposition.
  // We'll iterate all prims arrays just to ensure they exist in dispositions and mark UNRESOLVED if not.
  const allPrims = [
      ...Object.entries(identEnv).flatMap(([k,v]) => (v as any[]).map((_, i) => `target_identification_envelope.${k}[${i}]`)),
      ...Object.entries(routingEnv).flatMap(([k,v]) => (v as any[]).map((_, i) => `application_routing.${k}[${i}]`)),
      ...rolePrims.map((_, i) => `operational_primitives.target_role[${i}]`),
      ...hardGates.map((_, i) => `operational_primitives.hard_candidate_gates[${i}]`),
      ...softGates.map((_, i) => `operational_primitives.contextual_conditions[${i}]`),
      ...resps.map((_, i) => `operational_primitives.required_role_responsibilities[${i}]`),
  ];

  for (const primId of allPrims) {
      if (!dispositions[primId]) {
          recordDisposition(primId, "unknown", "unknown text", "UNRESOLVED");
      }
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

  // Create hash for freeze seal
  const treeHash = await hashTargetTree(rootNode);

  const b2Payload: B2Payload = {
    b2_header: {
      session_uid: sessionUid,
      stage_status: "SUCCESS",
      candidate_blind_airlock: "VERIFIED_LOCKED",
      target_tree_hash: treeHash,
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
  clonedEnvelope.payload.b3 = null;
  clonedEnvelope.payload.b4 = null;
  clonedEnvelope.payload.b5 = null;

  clonedEnvelope.stage_state.current_stage = 'b3' as any;
  const stages = new Set(clonedEnvelope.stage_state.completed_stages);
  stages.add('b1'); // Add b1 just in case, per B1 auth
  stages.add('b2');
  clonedEnvelope.stage_state.completed_stages = Array.from(stages);
  clonedEnvelope.stage_state.status = 'ready';

  return clonedEnvelope;
}
