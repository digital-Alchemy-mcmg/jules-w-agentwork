import { TravelingEnvelope } from '../types/scout';

export function processB1Stage(envelope: TravelingEnvelope): TravelingEnvelope {
  if (envelope.stage_state.current_stage !== 'b') {
    throw new Error('Invalid stage state: Expected current_stage to be "b"');
  }

  // Deep clone to ensure immutability of the upstream envelope
  const clonedEnvelope: TravelingEnvelope = JSON.parse(JSON.stringify(envelope));

  const sourceText = clonedEnvelope.payload.scout.original_target_source.source_text;

  // B1 Engine simulation output satisfying frozen B1 contract types
  clonedEnvelope.payload.b1 = {
    b1_header: {
      session_uid: "B1-SIM-UID",
      stage_status: "completed",
      malform_diagnostic: "VALID_JOB_OBJECT",
      candidate_blind_airlock: "VERIFIED_LOCKED",
      boundary_b_in_hash: "hash",
      boundary_b_out_hash: "hash",
      mode: "HALT_ON_MALFORM"
    },
    target_identification_envelope: {
      company_organization: [],
      posting_party: [],
      job_title: [{ marker: '', node_text: clonedEnvelope.persistent.target_identity.job_title, source_span_id: "s1" }],
      requisition_id: [],
      employment_type: [],
      location: [],
      work_arrangement: [],
      relocation_terms: [],
      compensation: [],
      schedule_posting_date: []
    },
    application_routing: {
      application_method: [],
      destination_url: [],
      recruiter_contact: [],
      required_submission_materials: [],
      special_instructions: []
    },
    operational_primitives: {
      target_role: [{ marker: '', node_text: "Target Role", source_span_id: "s2" }],
      hard_candidate_gates: [],
      contextual_conditions: [],
      required_role_responsibilities: []
    },
    source_spans: [{ source_span_id: "s1", raw_text: "Target Role", start_offset: 0, end_offset: 10 }, { source_span_id: "s2", raw_text: "Title", start_offset: 0, end_offset: 10 }],
    de_theatricalization_log: [],
    diagnostic_trace: [],
    processed_source_text: sourceText
  };

  clonedEnvelope.stage_state.current_stage = 'b1' as any;
  clonedEnvelope.stage_state.completed_stages.push('b1' as any);

  return clonedEnvelope;
}
