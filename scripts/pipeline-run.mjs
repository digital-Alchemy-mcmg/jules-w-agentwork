import './b1-loader.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const { processLiveJobToEnvelope } = await import('../src/services/scoutEngine.ts');
const { ingestB1 } = await import('../src/services/b1Engine.ts');
const { constructB2Tree } = await import('../src/services/b2Engine.ts');
const { bindSpatialDNA } = await import('../src/services/b3Engine.ts');
const { auditTruthGate } = await import('../src/services/b4Engine.ts');
const { reasonSemanticCore } = await import('../src/services/b5Engine.ts');

const samplePosting = [
  'Company: Precision Manufacturing Aerospace',
  'Job title: Plant Quality Operations Director',
  'Application URL: https://example.org/apply/aero-dir-99',
  'Location: Grand Rapids, MI',
  'Employment type: Full-time',
  'Compensation: $140,000–$160,000 per year',
  'Candidates must have a valid engineering license.',
  'Mandatory qualifications:',
  '  - Safety certification required',
  '  - 5 years of experience required',
  'Preferred qualifications:',
  '  - Master of Science degree preferred',
  'Responsibilities:',
  '  - Maintain 2 production lines',
  '  - Coordinate daily inspections',
].join('\r\n');

const candidateEvidence = {
  candidate_id: 'CAND-DEMO-001',
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
  },
};

console.log('================================================================');
console.log('SPATIAL DNA BUILD WAVE: STRAIGHT-THROUGH PIPELINE (SCOUT -> B4)');
console.log('================================================================');

// 1. SCOUT
console.log('\n[1/5] Executing SCOUT Stage (Collection Runner & Envoy 2)...');
const { envelope: scoutEnvelope } = await processLiveJobToEnvelope({
  id: 'JOB-LIVE-STRAIGHT-THROUGH',
  title: 'Plant Quality Operations Director',
  company: 'Precision Manufacturing Aerospace',
  location: 'Grand Rapids, MI',
  payType: 'Annual',
  employmentType: 'Full-time',
  sourceUrl: 'https://example.org/apply/aero-dir-99',
  rawSourceText: samplePosting,
});
console.log(`  ✓ Scout Envelope generated: ${scoutEnvelope.envelope_id}`);
console.log(`  ✓ Stage: ${scoutEnvelope.stage_state.current_stage} | Source Hash: ${scoutEnvelope.payload.scout.original_target_source.source_hash.slice(0, 19)}...`);

// 2. B / B1 Decouple
console.log('\n[2/5] Executing B / B1 Decouple (Candidate-Blind Airlock)...');
const b1Envelope = await ingestB1(scoutEnvelope);
console.log(`  ✓ B1 Stage Complete. Current Stage: ${b1Envelope.stage_state.current_stage}`);
console.log(`  ✓ Airlock: ${b1Envelope.payload.b1.b1_header.candidate_blind_airlock} | Diagnostic: ${b1Envelope.payload.b1.b1_header.malform_diagnostic}`);
console.log(`  ✓ Boundary B-Out Hash: ${b1Envelope.payload.b1.b1_header.boundary_b_out_hash.slice(0, 19)}...`);

// 3. B2 Create Tree
console.log('\n[3/5] Executing B2 Create Tree (Deterministic Hierarchy)...');
const b2Envelope = await constructB2Tree(b1Envelope);
console.log(`  ✓ B2 Target Tree Frozen: ${b2Envelope.payload.b2.frozen}`);
console.log(`  ✓ Total Nodes: ${b2Envelope.payload.b2.total_nodes} | Mandatory Hard Gates: ${b2Envelope.payload.b2.gate_count}`);
console.log(`  ✓ Current Stage: ${b2Envelope.stage_state.current_stage}`);

// 4. B3 Bind Spatial DNA
console.log('\n[4/5] Executing B3 Bind (Inverted Inquiry against Spatial DNA)...');
const b3Envelope = await bindSpatialDNA(b2Envelope, candidateEvidence);
console.log(`  ✓ Total B3 Bindings Formed: ${b3Envelope.payload.b3.total_bindings}`);
console.log(`  ✓ Current Stage: ${b3Envelope.stage_state.current_stage}`);

// 5. B4 Truth Gate
console.log('\n[5/6] Executing B4 Truth Gate (Defensible Audit & Hard Gate Enforcement)...');
const b4Envelope = await auditTruthGate(b3Envelope);
const summary = b4Envelope.payload.b4.disposition_summary;
console.log(`  ✓ B4 Audit Complete. Disposition Summary:`);
console.log(`    - PASS: ${summary.pass_count}`);
console.log(`    - QUALIFIED_BOUNDED: ${summary.qualified_count}`);
console.log(`    - UNRESOLVED: ${summary.unresolved_count}`);
console.log(`    - CONTRADICTED: ${summary.contradicted_count}`);
console.log(`    - HARD GATE VIOLATIONS: ${summary.hard_gate_violations}`);
console.log(`  ✓ Admitted for B5: ${b4Envelope.payload.b4.admitted_for_b5}`);
console.log(`  ✓ Boundary B4 Seal Hash: ${b4Envelope.payload.b4.boundary_b4_hash.slice(0, 24)}...`);
console.log(`  ✓ Current Stage: ${b4Envelope.stage_state.current_stage}`);

// 6. B5 Semantic Core
console.log('\n[6/6] Executing B5 Semantic Core (5-Prism Reasoning & Presentation Geometry)...');
const b5Envelope = await reasonSemanticCore(b4Envelope);
console.log(`  ✓ B5 Semantic Core Complete.`);
console.log(`    - Owner Prism: ${b5Envelope.payload.b5.owner_prism}`);
console.log(`    - Emphasis: ${JSON.stringify(b5Envelope.payload.b5.projection_emphasis_percentages)}`);
console.log(`    - Geometry Posture: ${b5Envelope.payload.b5.presentation_geometry.posture}`);
console.log(`    - Foreground Assertions: ${b5Envelope.payload.b5.semantic_priorities.foreground.length}`);
console.log(`    - Prohibited Implications: ${b5Envelope.payload.b5.prohibited_implications.length}`);
console.log(`  ✓ Boundary B5 Seal Hash: ${b5Envelope.payload.b5.boundary_b5_hash.slice(0, 24)}...`);
console.log(`  ✓ Final Traveling Envelope Status: ${b5Envelope.stage_state.status} | Stage: ${b5Envelope.stage_state.current_stage}`);

const outDir = process.argv[2] || '.pipeline-execution';
await mkdir(outDir, { recursive: true });
const outFile = join(outDir, 'traveling-envelope-complete.json');
await writeFile(outFile, JSON.stringify(b5Envelope, null, 2) + '\n');
console.log(`\n✓ Full Traveling Envelope saved to: ${outFile}`);
