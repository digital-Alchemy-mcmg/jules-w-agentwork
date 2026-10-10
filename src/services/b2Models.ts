export enum SemanticForce {
    HARD_GATE = "*",             // Hard candidate admission gate
    CONTEXTUAL = "≈",            // Contextual / soft / preferred condition
    RESPONSIBILITY = "unmarked",  // Required role duty / operational responsibility
    NOT_APPLICABLE = "n/a"      // Structural category / intermediate routing node
}

export enum NodeType {
    ROOT = "target_root",
    CATEGORY = "category_node",
    IDENTITY_FIELD = "identity_field",
    ROUTING_FIELD = "routing_field",
    TARGET_ROLE = "target_role",
    HARD_GATE = "hard_candidate_gate",
    CONTEXTUAL_CONDITION = "contextual_condition",
    ROLE_RESPONSIBILITY = "role_responsibility",
    OPERATIONAL_DOMAIN = "operational_domain",
    DOMAIN_REQUIREMENT = "domain_requirement",
    RELATIONSHIP_NODE = "relationship_node"
}

export async function generateDeterministicNodeId(parentAddress: string, label: string, statement: string): Promise<string> {
    const payload = `${parentAddress}::${label}::${statement}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return "NODE-" + hashHex.substring(0, 12).toUpperCase();
}
