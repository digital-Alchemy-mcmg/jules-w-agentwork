import '../scripts/b1-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runB1Files } from '../scripts/b1-run.mjs';
const { ingestB1, B1Halt } = await import('../src/services/b1Engine.ts');
const { processLiveJobToEnvelope } = await import('../src/services/scoutEngine.ts');

// Synthetic target fixture, passed through the real, unchanged Scout transformation.
const source = 'Company: Fixture Manufacturing\r\n'
  + 'Job title: Operations Manager\r\nRequisition ID: TEST-42\r\n'
  + 'Employment type: Full-time\r\nLocation: Detroit\r\nWork arrangement: Hybrid\r\n'
  + 'Relocation: Not offered\r\nCompensation: $80,000–$90,000 plus 5% bonus\r\n'
  + 'Schedule: 40 hours/week\r\nPosting date: 2026-09-01\r\n'
  + 'Application URL: https://example.org/apply/TEST-42\r\n'
  + 'Required materials: Résumé and cover letter\r\nSubject line: TEST-42\r\n'
  + 'Candidates must have a valid license.\r\n'
  + '3 years of experience preferred; No degree required.\r\n'
  + 'Responsibilities:\r\n  - Maintain 2 production lines.\r\n'
  + 'Required qualifications:\r\n  - Safety certification\r\n'
  + 'Preferred qualifications:\r\n  - 5 years of experience\r\n'
  + 'About the role:\r\nJoin our amazing family — training may be available.\r\n';

async function fixture(text = source) {
  const { envelope } = await processLiveJobToEnvelope({ id: 'B1-TEST', title: 'Operations Manager',
    company: 'Fixture Manufacturing', location: 'Detroit, MI', payType: 'Annual', employmentType: 'Full-time',
    sourceUrl: 'https://example.org/posting/TEST-42', rawSourceText: text });
  assert.ok(envelope, 'Real Scout engine must produce the test input');
  return envelope;
}
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function allPrimitives(b1) {
  return [...Object.values(b1.target_identification_envelope), ...Object.values(b1.application_routing),
    ...Object.values(b1.operational_primitives)].flat();
}
async function halt(envelope, code) {
  await assert.rejects(ingestB1(envelope), error => error instanceof B1Halt && error.code === code);
}

test('real Scout input -> B1 -> B2 eligibility; full upstream immutability and separate object graph', async () => {
  const input = freeze(await fixture());
  const before = JSON.stringify(input);
  const output = await ingestB1(input);
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(output.payload.scout, input.payload.scout);
  assert.deepEqual(output.persistent, input.persistent);
  assert.deepEqual(output.append_log.slice(0, -1), input.append_log);
  assert.notEqual(output.payload.scout, input.payload.scout);
  const preserved = output.payload.scout.original_target_source;
  assert.deepEqual(Buffer.from(preserved.source_text), Buffer.from(source));
  assert.equal(preserved.source_hash, input.payload.scout.original_target_source.source_hash);
  assert.equal(preserved.source_hash, 'sha256:' + createHash('sha256').update(source).digest('hex'));
  assert.deepEqual(output.stage_state, { current_stage: 'b2', completed_stages: ['scout', 'b1'], status: 'ready' });
  for (const stage of ['b', 'b2', 'b3', 'b4', 'b5']) assert.equal(output.payload[stage], null);
  assert.equal(output.payload.b1.b1_header.candidate_blind_airlock, 'VERIFIED_LOCKED');
  output.payload.scout.atomic_statements.push('output-only change');
  assert.equal(JSON.stringify(input), before);
});

test('every primitive has exact stable half-open provenance, including Unicode and CRLF', async () => {
  const input = await fixture();
  const a = (await ingestB1(input)).payload.b1;
  const b = (await ingestB1(input)).payload.b1;
  assert.deepEqual(a.source_spans, b.source_spans);
  for (const p of allPrimitives(a)) {
    const span = a.source_spans.find(s => s.source_span_id === p.source_span_id);
    assert.ok(span);
    assert.equal(source.slice(span.start_offset, span.end_offset), span.raw_text);
    assert.equal(p.node_text, span.raw_text);
  }
  assert.match(a.target_identification_envelope.compensation[0].node_text, /80,000–\$90,000 plus 5%/);
});

test('hard, soft, negative qualifiers, numbers, imperatives and inherited qualifier scope', async () => {
  const { operational_primitives: p } = (await ingestB1(await fixture())).payload.b1;
  assert.ok(p.hard_candidate_gates.some(n => n.node_text.includes('must have a valid license') && n.marker === '*'));
  assert.ok(p.hard_candidate_gates.some(n => n.node_text.includes('Safety certification') && n.qualifier_scope));
  for (const text of ['3 years', 'No degree', '5 years']) {
    assert.ok(p.contextual_conditions.some(n => n.node_text.includes(text) && n.marker === '≈'));
    assert.ok(!p.hard_candidate_gates.some(n => n.node_text.includes(text)));
  }
  assert.ok(p.required_role_responsibilities.some(n => n.node_text.includes('Maintain 2') && n.marker === ''));
});

test('missing source, whitespace source and invalid preservation/hash halt without repair', async () => {
  for (const value of [undefined, '', ' \r\n ']) {
    const input = await fixture(); input.payload.scout.original_target_source.source_text = value;
    await halt(input, 'AUTHORITATIVE_SOURCE_MISSING');
  }
  const bad = await fixture(); bad.payload.scout.original_target_source.source_text += 'changed';
  await halt(bad, 'SOURCE_HASH_MISMATCH');
  const flag = await fixture(); flag.payload.scout.original_target_source.is_preserved_source = false;
  await halt(flag, 'INVALID_SOURCE_PRESERVATION');
});

test('all four origin/destination states; ordinary missing fields do not invalidate a job', async () => {
  for (const [text, expected] of [
    ['Company: Example\nApply at https://example.org/jobs', 'VALID_JOB_OBJECT'],
    ['Apply at https://example.org/jobs', 'MALFORMED — ORIGIN MISSING'],
    ['Company: Example\nMaintain systems.', 'MALFORMED — DESTINATION MISSING'],
    ['Maintain systems.', 'MALFORMED — UNROUTABLE JOB OBJECT'],
  ]) {
    const input = await fixture(text); const before = JSON.stringify(input);
    if (expected === 'VALID_JOB_OBJECT') {
      const output = await ingestB1(input);
      assert.equal(output.payload.b1.b1_header.malform_diagnostic, expected);
      assert.deepEqual(output.payload.b1.target_identification_envelope.compensation, []);
    } else {
      await assert.rejects(ingestB1(input), error => {
        assert.equal(error.code, expected);
        assert.equal(error.diagnostic.b1_header.stage_status, 'halted');
        assert.equal(error.diagnostic.b1_header.malform_diagnostic, expected);
        return true;
      });
    }
    assert.equal(JSON.stringify(input), before);
  }
});

test('candidate data is not an input; Scout atoms and persistent candidate notes do not affect decomposition', async () => {
  const input = await fixture();
  const output = await ingestB1(input);
  input.payload.scout.atomic_statements = ['Invented candidate gate: must have 900 years of experience'];
  input.persistent.application_routing.notes = 'Candidate evidence: unqualified';
  const second = await ingestB1(input);
  assert.deepEqual(output.payload.b1.operational_primitives, second.payload.b1.operational_primitives);
  Object.defineProperty(input, 'candidate_evidence', { enumerable: true, get() { throw new Error('Must never read'); } });
  await halt(input, 'AIRLOCK_UNEXPECTED_INPUT');
});

test('invalid stage, replay and occupied downstream slots halt', async () => {
  const input = await fixture(); input.stage_state.current_stage = 'b2';
  await halt(input, 'INVALID_SCOUT_BOUNDARY');
  const ready = await fixture(); ready.payload.b3 = {};
  await halt(ready, 'DOWNSTREAM_SLOT_OCCUPIED');
  const complete = await ingestB1(await fixture());
  await halt(complete, 'INVALID_SCOUT_BOUNDARY');
});

test('boundary seals verify and include nested material changes', async () => {
  const input = await fixture();
  const b1 = (await ingestB1(input)).payload.b1;
  const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
    : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}'
    : JSON.stringify(value);
  const hash = value => 'sha256:' + createHash('sha256').update(canonical(value)).digest('hex');
  assert.equal(b1.b1_header.boundary_b_in_hash, hash({ schema_version: input.schema_version,
    envelope_id: input.envelope_id, source_text: source, source_hash: input.payload.scout.original_target_source.source_hash }));
  const seal = b1.b1_header.boundary_b_out_hash;
  b1.b1_header.boundary_b_out_hash = '';
  assert.equal(hash(b1), seal);
  b1.operational_primitives.hard_candidate_gates[0].node_text += 'tampered';
  assert.notEqual(hash(b1), seal);
});

test('exact standalone provenance values are captured, placeholders remain absent, postal destination is retained', async () => {
  const input = await fixture('Fixture Manufacturing\nOperations Manager\nDestination: 123 Example Street\nSalary: Not specified');
  const b1 = (await ingestB1(input)).payload.b1;
  assert.equal(b1.target_identification_envelope.company_organization[0].node_text, 'Fixture Manufacturing');
  assert.deepEqual(b1.target_identification_envelope.compensation, []);
  await halt(await fixture('Company: Unknown\nApply at https://example.org/apply'), 'MALFORMED — ORIGIN MISSING');
});

test('isolated file input -> CLI -> inspectable envelope; existing output cannot be overwritten', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'b1-execution-'));
  const inputPath = join(directory, 'scout.json'); const outputPath = join(directory, 'b1.json');
  await writeFile(inputPath, JSON.stringify(await fixture()));
  const inputBefore = await readFile(inputPath, 'utf8');
  await runB1Files(inputPath, outputPath);
  const output = JSON.parse(await readFile(outputPath, 'utf8'));
  assert.equal(output.stage_state.current_stage, 'b2');
  assert.equal(output.payload.b1.b1_header.stage_status, 'completed');
  assert.equal(await readFile(inputPath, 'utf8'), inputBefore);
  await assert.rejects(runB1Files(inputPath, outputPath), { code: 'EEXIST' });
});
