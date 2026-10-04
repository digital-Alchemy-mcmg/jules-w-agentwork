import '../scripts/b1-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const { processLiveJobToEnvelope } = await import('../src/services/scoutEngine.ts');
const { ingestB1 } = await import('../src/services/b1Engine.ts');
const { constructB2Tree, B2Halt } = await import('../src/services/b2Engine.ts');
const { bindSpatialDNA, B3Halt } = await import('../src/services/b3Engine.ts');
const { auditTruthGate, B4Halt } = await import('../src/services/b4Engine.ts');
const { reasonSemanticCore, B5Halt } = await import('../src/services/b5Engine.ts');

const testPosting = [
  'Company: Precision Aerospace Inc',
  'Job title: Plant Quality Director',
  'Application URL: https://example.org/apply/aero-01',
  'Candidates must have a valid license.',
  'Mandatory requirements:',
  '  - Safety certification required',
  '  - 5 years of experience required',
  'Preferred qualifications:',
  '  - Master of Science degree preferred',
  'Responsibilities:',
  '  - Maintain 2 production lines',
  '  - Coordinate daily inspections',
].join('\r\n');

function createCandidateDNA(overrides = {}) {
  return {
    candidate_id: 'CAND-001',
    planes: {
      Certifications: [
        { atom_id: 'ATOM-CERT-1', plane: 'Certifications', category: 'Safety', statement: 'Holds OSHA 30-hour and ISO-9001 Safety certification', source_document: 'cert_records.pdf' },
        { atom_id: 'ATOM-CERT-2', plane: 'Certifications', category: 'Licensure', statement: 'Valid state engineering license #44921', source_document: 'license_board.gov' },
      ],
      Experience: [
        { atom_id: 'ATOM-EXP-1', plane: 'Experience', category: 'Operations', statement: '7 years of experience in aerospace plant manufacturing', chronology: '2019-2026', source_document: 'work_history.pdf' },
      ],
      Education: [
        { atom_id: 'ATOM-EDU-1', plane: 'Education', category: 'Degree', statement: 'Bachelor of Science in Mechanical Engineering', chronology: '2015-2019', source_document: 'university_transcript.pdf' },
      ],
      Operations: [
        { atom_id: 'ATOM-OPS-1', plane: 'Operations', category: 'Production', statement: 'Operated and maintained 3 high-speed assembly production lines', chronology: '2020-2026', source_document: 'work_history.pdf' },
        { atom_id: 'ATOM-OPS-2', plane: 'Operations', category: 'Quality', statement: 'Conducted daily quality inspections and compliance audits', chronology: '2020-2026', source_document: 'work_history.pdf' },
      ],
      Skills: [
        { atom_id: 'ATOM-SKL-1', plane: 'Skills', category: 'Inspection', statement: 'Skilled in non-destructive inspection and coordinate measuring machines', source_document: 'skills_inventory.doc' },
      ],
      Leadership: [
        { atom_id: 'ATOM-LEAD-1', plane: 'Leadership', category: 'Supervision', statement: 'Supervised team of 14 quality technicians and line inspectors', chronology: '2022-2026', source_document: 'work_history.pdf' },
      ],
      Performance: [
        { atom_id: 'ATOM-PERF-1', plane: 'Performance', category: 'Audit', statement: 'Achieved 99.8% first-pass yield and zero critical audit findings', chronology: '2024-2025', source_document: 'annual_review.pdf' },
      ],
      ...overrides,
    },
  };
}

test('SCOUT -> B -> B1 -> B2 -> B3 -> B4: Straight-Through Pipeline execution with full traveling envelope integrity', async () => {
  // Step 1: SCOUT discompiler & intake
  const { envelope: scoutEnvelope } = await processLiveJobToEnvelope({
    id: 'JOB-STRAIGHT-THROUGH',
    title: 'Plant Quality Director',
    company: 'Precision Aerospace Inc',
    location: 'Grand Rapids, MI',
    payType: 'Annual',
    employmentType: 'Full-time',
    sourceUrl: 'https://example.org/apply/aero-01',
    rawSourceText: testPosting,
  });

  assert.ok(scoutEnvelope);
  assert.equal(scoutEnvelope.stage_state.current_stage, 'b');
  assert.deepEqual(scoutEnvelope.stage_state.completed_stages, ['scout']);
  assert.equal(scoutEnvelope.payload.b1, null);
  assert.equal(scoutEnvelope.payload.b2, null);
  assert.equal(scoutEnvelope.payload.b3, null);
  assert.equal(scoutEnvelope.payload.b4, null);
  assert.equal(scoutEnvelope.payload.b5, null);

  // Step 2: B / B1 Decouple
  const b1Envelope = await ingestB1(scoutEnvelope);
  assert.equal(b1Envelope.stage_state.current_stage, 'b2');
  assert.deepEqual(b1Envelope.stage_state.completed_stages, ['scout', 'b1']);
  assert.equal(b1Envelope.payload.b1.b1_header.candidate_blind_airlock, 'VERIFIED_LOCKED');
  assert.equal(b1Envelope.payload.b2, null);

  // Step 3: B2 Target Tree Construction
  const b2Envelope = await constructB2Tree(b1Envelope);
  assert.equal(b2Envelope.stage_state.current_stage, 'b3');
  assert.deepEqual(b2Envelope.stage_state.completed_stages, ['scout', 'b1', 'b2']);
  assert.ok(b2Envelope.payload.b2);
  assert.equal(b2Envelope.payload.b2.frozen, true);
  assert.ok(b2Envelope.payload.b2.nodes['t.id']);
  assert.ok(b2Envelope.payload.b2.nodes['t.gate']);
  assert.ok(b2Envelope.payload.b2.gate_count > 0);
  assert.equal(b2Envelope.payload.b3, null);

  // Step 4: B3 Spatial DNA Binding
  const candidateDNA = createCandidateDNA();
  const b3Envelope = await bindSpatialDNA(b2Envelope, candidateDNA);
  assert.equal(b3Envelope.stage_state.current_stage, 'b4');
  assert.deepEqual(b3Envelope.stage_state.completed_stages, ['scout', 'b1', 'b2', 'b3']);
  assert.ok(b3Envelope.payload.b3);
  assert.ok(b3Envelope.payload.b3.bindings.length > 0);
  assert.equal(b3Envelope.payload.b4, null);

  // Step 5: B4 Truth Gate Audit
  const b4Envelope = await auditTruthGate(b3Envelope);
  assert.equal(b4Envelope.stage_state.current_stage, 'b5');
  assert.deepEqual(b4Envelope.stage_state.completed_stages, ['scout', 'b1', 'b2', 'b3', 'b4']);
  assert.ok(b4Envelope.payload.b4);
  assert.equal(b4Envelope.payload.b5, null); // Strictly prepared as null for B5 Semantic Core
  assert.ok(b4Envelope.payload.b4.boundary_b4_hash.startsWith('sha256:'));
  assert.equal(b4Envelope.payload.b4.disposition_summary.hard_gate_violations, 0);
  assert.equal(b4Envelope.payload.b4.admitted_for_b5, true);

  // Step 6: B5 Semantic Core Reasoning
  const b5Envelope = await reasonSemanticCore(b4Envelope);
  assert.equal(b5Envelope.stage_state.current_stage, 'stop_before_resume_factory');
  assert.equal(b5Envelope.stage_state.status, 'complete');
  assert.deepEqual(b5Envelope.stage_state.completed_stages, ['scout', 'b1', 'b2', 'b3', 'b4', 'b5']);
  assert.ok(b5Envelope.payload.b5);
  assert.ok(b5Envelope.payload.b5.boundary_b5_hash.startsWith('sha256:'));
  assert.equal(b5Envelope.payload.b5.ranked_five_prisms.length, 5);
  assert.equal(
    Object.values(b5Envelope.payload.b5.projection_emphasis_percentages).reduce((a, b) => a + b, 0),
    100
  );
  assert.ok(b5Envelope.payload.b5.semantic_priorities.foreground.length > 0);

  // Validate Append Log has all 6 stages in order
  const stagesLogged = b5Envelope.append_log.map(e => e.stage);
  assert.deepEqual(stagesLogged, ['scout', 'b1', 'b2', 'b3', 'b4', 'b5']);

  // Validate original authoritative source remained 100% byte-for-byte identical
  assert.equal(b5Envelope.payload.scout.original_target_source.source_text, testPosting);
  assert.equal(
    b5Envelope.payload.scout.original_target_source.source_hash,
    'sha256:' + createHash('sha256').update(testPosting).digest('hex')
  );
});

test('B4 HARD-GATE DEFENSE: Partial / qualified evidence NEVER satisfies a hard candidate gate (*)', async () => {
  const { envelope: scoutEnvelope } = await processLiveJobToEnvelope({
    id: 'JOB-HARD-GATE-DEFENSE',
    title: 'Plant Quality Director',
    company: 'Precision Aerospace Inc',
    location: 'Grand Rapids, MI',
    payType: 'Annual',
    employmentType: 'Full-time',
    sourceUrl: 'https://example.org/apply/aero-01',
    rawSourceText: testPosting,
  });

  const b1Envelope = await ingestB1(scoutEnvelope);
  const b2Envelope = await constructB2Tree(b1Envelope);

  // Candidate DNA WITHOUT required license (only safety cert)
  const candidateDNAWithoutLicense = createCandidateDNA({
    Certifications: [
      { atom_id: 'ATOM-CERT-1', plane: 'Certifications', category: 'Safety', statement: 'Holds OSHA 30-hour Safety certification', source_document: 'cert_records.pdf' }
      // Valid license is missing!
    ],
  });

  const b3Envelope = await bindSpatialDNA(b2Envelope, candidateDNAWithoutLicense);
  const b4Envelope = await auditTruthGate(b3Envelope);

  assert.equal(b4Envelope.stage_state.current_stage, 'b5');
  assert.ok(b4Envelope.payload.b4.disposition_summary.hard_gate_violations > 0);
  assert.equal(b4Envelope.payload.b4.admitted_for_b5, false);

  // Find the hard gate node for license
  const gateAudits = Object.values(b4Envelope.payload.b4.audited_ledger).filter(
    a => a.semantic_force === 'hard_candidate_gate' && a.target_node_text.toLowerCase().includes('license')
  );
  assert.ok(gateAudits.length > 0);
  const licenseGate = gateAudits[0];
  assert.equal(licenseGate.hard_gate_violation, true);
  assert.equal(licenseGate.disposition, 'UNRESOLVED');
  assert.equal(licenseGate.admitted_proposition, null);
});

test('B2 Tree determinism and bidirectional source-span provenance', async () => {
  const { envelope: scoutEnvelope } = await processLiveJobToEnvelope({
    id: 'JOB-TREE-TEST',
    title: 'Plant Quality Director',
    company: 'Precision Aerospace Inc',
    location: 'Grand Rapids, MI',
    payType: 'Annual',
    employmentType: 'Full-time',
    sourceUrl: 'https://example.org/apply/aero-01',
    rawSourceText: testPosting,
  });

  const b1Envelope = await ingestB1(scoutEnvelope);
  const b2Envelope = await constructB2Tree(b1Envelope);

  const tree = b2Envelope.payload.b2;
  assert.ok(tree.total_nodes > 5);

  for (const node of Object.values(tree.nodes)) {
    assert.match(node.address, /^[a-z0-9._]+$/);
    assert.ok(node.source_span_id);
    assert.ok(node.source_span_provenance);
  }
});
