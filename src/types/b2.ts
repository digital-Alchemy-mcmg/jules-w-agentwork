export interface B1IngressPayload {
  b1_header: {
    session_uid: string;
    stage_status: string;
    malform_diagnostic?: string;
    candidate_blind_airlock: string;
    boundary_b_in_hash?: string;
    boundary_b_out_hash?: string;
    mode?: string;
  };
  target_identification_envelope: {
    company_organization: string | null;
    posting_party: string | null;
    job_title: string | null;
    requisition_id: string | null;
    employment_type: string | null;
    location: string | null;
    work_arrangement: string | null;
    relocation_terms: string | null;
    compensation: string | null;
    schedule_posting_date: string | null;
  };
  application_routing: {
    application_method: string | null;
    destination_url: string | null;
    application_destination: string | null;
    recruiter_contact: string | null;
    required_submission_materials: string[] | null;
    special_instructions: string | null;
  };
  operational_primitives: {
    target_role: string;
    hard_candidate_gates: Array<{
      id?: string;
      marker: '*';
      node_text: string;
      source_span_id?: string;
      source_span_ids?: string[];
    }>;
    contextual_conditions: Array<{
      id?: string;
      marker: '≈';
      node_text: string;
      qualifier_scope: string | null;
      source_span_id?: string;
      source_span_ids?: string[];
    }>;
    required_role_responsibilities: Array<{
      id?: string;
      marker: 'unmarked' | '';
      node_text: string;
      source_span_id?: string;
      source_span_ids?: string[];
    }>;
    operational_domains: Array<any>;
  };
  source_spans: Record<string, string> | any[];
  de_theatricalization_log: any;
}

export interface TargetTreeNode {
  node_id: string;
  address: string;
  label: string;
  node_type: string;
  semantic_force: '*' | '≈' | 'unmarked' | 'n/a';
  statement: string;
  b1_primitive_refs: string[];
  source_span_refs: string[];
  qualifier_scope?: string;
  children: TargetTreeNode[];
}

export interface PrimitiveDisposition {
  category: string;
  statement: string;
  disposition: 'REPRESENTED_IN_TREE' | 'SUPPORTING_EVIDENCE' | 'STRUCTURALLY_RELATED' | 'UNRESOLVED' | 'REJECTED_WITH_REASON';
  target_address?: string;
  reason?: string;
}
