import type {
  B1MalformDiagnostic, B1Marker, B1OutputEnvelope, B1Payload,
  B1Primitive, B1SourceSpan, TravelingEnvelope,
} from '../types/scout';

/** A halt never returns an eligible downstream envelope. Malform details remain inspectable. */
export class B1Halt extends Error {
  constructor(public readonly code: string, public readonly diagnostic?: B1Payload) {
    super(code);
    this.name = 'B1Halt';
  }
}

async function hash(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return 'sha256:' + Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}

/** Recursive stable JSON; unlike a replacer key list, nested fields are retained. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return '{' + Object.keys(object).sort().map(k => JSON.stringify(k) + ':' + canonical(object[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

export function diagnoseB1Object(origin: boolean, destination: boolean): B1MalformDiagnostic {
  if (!origin && !destination) return 'MALFORMED — UNROUTABLE JOB OBJECT';
  if (!origin) return 'MALFORMED — ORIGIN MISSING';
  if (!destination) return 'MALFORMED — DESTINATION MISSING';
  return 'VALID_JOB_OBJECT';
}

type IdentityKey = keyof B1Payload['target_identification_envelope'];
type RoutingKey = keyof B1Payload['application_routing'];
const identityLabels: Array<[IdentityKey, RegExp]> = [
  ['company_organization', /^(?:company|organization|organisation|employer)\s*:\s*\S/i],
  ['posting_party', /^(?:posting party|posted by|agency)\s*:\s*\S/i],
  ['job_title', /^(?:job title|position|role|title)\s*:\s*\S/i],
  ['requisition_id', /^(?:requisition(?: id)?|posting id|job id|reference)\s*:\s*\S/i],
  ['employment_type', /^(?:employment type|employment|job type)\s*:\s*\S/i],
  ['location', /^(?:location|job location)\s*:\s*\S/i],
  ['work_arrangement', /^(?:work arrangement|work model|workplace)\s*:\s*\S/i],
  ['relocation_terms', /^(?:relocation|relocation terms)\s*:\s*\S/i],
  ['compensation', /^(?:compensation|salary|pay|bonus|additional compensation|benefits)\s*:\s*\S/i],
  ['schedule_posting_date', /^(?:schedule|hours|shift|posting date|posted|closing date|deadline)\s*:\s*\S/i],
];
const routingLabels: Array<[RoutingKey, RegExp]> = [
  ['application_method', /^(?:application method|how to apply|apply)\s*:\s*\S/i],
  ['destination_url', /^(?:application (?:url|endpoint)|destination(?: url)?|apply (?:at|to))\s*:\s*\S/i],
  ['recruiter_contact', /^(?:recruiter(?: contact)?|contact|email)\s*:\s*\S/i],
  ['required_submission_materials', /^(?:required (?:submission )?materials|submission materials|documents)\s*:\s*\S/i],
  ['special_instructions', /^(?:special instructions|subject(?: line)?|application instructions)\s*:\s*\S/i],
];

type Section = 'context' | 'hard' | 'soft' | 'duty';
const sections: Array<[Section, RegExp]> = [
  ['hard', /^(?:mandatory|required|minimum) (?:qualifications|requirements|candidate gates):?$/i],
  ['soft', /^(?:preferred|desirable|optional) (?:qualifications|requirements|skills):?$/i],
  ['duty', /^(?:responsibilities|duties|key responsibilities|role responsibilities|what you will do):?$/i],
  ['context', /^(?:qualifications|requirements|about us|about the role|benefits|how to apply):?$/i],
];
const soft = /\b(?:preferred|preferably|desirable|desired|optional|ideally|ideally suited|not required|not mandatory|not necessary|no .{0,40} required|nice[- ]to[- ]have|a plus|may|should)\b/i;
const duty = /^(?:(?:you|the role|the successful candidate)\s+(?:will|must)\s+|responsible for\s+)?(?:manage|lead|maintain|coordinate|operate|oversee|prepare|deliver|conduct|ensure|supervise|develop|support|report|monitor|perform|process|execute|organize|organise|train|schedule)\b/i;
const qualification = /\b(?:experience|degree|diploma|certification|certificate|licen[cs]e|eligible|eligibility|authorized|authorised|authorization|authorisation|clearance|qualification|years? of|ability|able to|proficiency|proficient|fluent|fluency|background check|work permit|work authorization)\b/i;

/** Classification is deliberately conservative: numbers and bare imperatives never imply admission gates. */
function force(text: string, section: Section): { marker: B1Marker; reason: string } {
  if (soft.test(text) || section === 'soft') return { marker: '≈', reason: 'Source soft/negative qualifier retained.' };
  if (section === 'duty' || duty.test(text)) return { marker: '', reason: 'Source operating duty, not an admission gate.' };
  if (section === 'hard' || (qualification.test(text) && /\b(?:must|required|mandatory|minimum|need to)\b/i.test(text))) {
    return { marker: '*', reason: 'Explicit mandatory candidate qualification.' };
  }
  return { marker: '≈', reason: 'No explicit hard admission or operating-duty force; retained as context.' };
}

/** Exact line/semicolon spans. Do not split on periods (URLs, decimals) or strip modifiers. */
function spans(source: string): B1SourceSpan[] {
  const result: B1SourceSpan[] = [];
  for (const match of source.matchAll(/[^\r\n;]+/g)) {
    if (!match[0].trim()) continue;
    result.push({ source_span_id: `S-${String(result.length + 1).padStart(2, '0')}`,
      raw_text: match[0], start_offset: match.index!, end_offset: match.index! + match[0].length });
  }
  return result;
}

function makePrimitive(span: B1SourceSpan, marker: B1Marker, scope?: string): B1Primitive {
  return { marker, node_text: span.raw_text, source_span_id: span.source_span_id,
    ...(scope ? { qualifier_scope: scope } : {}) };
}

function hasValue(text: string): boolean {
  const value = text.slice(text.indexOf(':') + 1).trim();
  return !!value && !/^(?:n\/?a|none|unknown|not (?:specified|provided|available)|tbd|[-—])\.?$/i.test(value);
}

function hasDestination(text: string): boolean {
  // A company home page alone is not assumed to be an application destination.
  return /https?:\/\/[^\s<>]+|\b[^\s@]+@[^\s@]+\.[a-z]{2,}\b/i.test(text)
    || /\b(?:apply|submit|send|deliver)\b.*\b(?:in person|at|to)\b\s+\S/i.test(text)
    || (/^destination\s*:\s*\S/i.test(text.trim()) && hasValue(text));
}

/**
 * No candidate input, external fetch, model call, or Scout atom reuse.
 * Input must be a JSON Scout envelope; persistent data is opaque passthrough.
 */
export async function ingestB1(envelope: TravelingEnvelope): Promise<B1OutputEnvelope> {
  if (!envelope || envelope.schema_version !== '0.2.0'
    || envelope.stage_state?.current_stage !== 'b'
    || envelope.stage_state.status !== 'ready'
    || JSON.stringify(envelope.stage_state.completed_stages) !== '["scout"]') throw new B1Halt('INVALID_SCOUT_BOUNDARY');
  const allowedTop = ['schema_version', 'envelope_id', 'created_at', 'persistent', 'stage_state', 'append_log', 'payload'];
  const allowedPayload = ['scout', 'b', 'b1', 'b2', 'b3', 'b4', 'b5'];
  if (Object.keys(envelope).some(k => !allowedTop.includes(k))
    || !envelope.payload || Object.keys(envelope.payload).some(k => !allowedPayload.includes(k))) throw new B1Halt('AIRLOCK_UNEXPECTED_INPUT');
  if (['b', 'b1', 'b2', 'b3', 'b4', 'b5'].some(k => envelope.payload[k as keyof TravelingEnvelope['payload']] !== null)) throw new B1Halt('DOWNSTREAM_SLOT_OCCUPIED');
  const original = envelope.payload.scout?.original_target_source;
  if (!original || typeof original.source_text !== 'string' || !original.source_text.trim()) throw new B1Halt('AUTHORITATIVE_SOURCE_MISSING');
  if (!original.is_preserved_source || typeof original.source_hash !== 'string') throw new B1Halt('INVALID_SOURCE_PRESERVATION');
  // Clone before asynchronous hashing so caller changes during awaits cannot alter validated output.
  const output = structuredClone(envelope);
  const source = output.payload.scout.original_target_source;
  if (await hash(source.source_text) !== source.source_hash) throw new B1Halt('SOURCE_HASH_MISMATCH');
  const b1: B1Payload = {
    b1_header: { session_uid: crypto.randomUUID(), stage_status: 'halted',
      malform_diagnostic: 'MALFORMED — UNROUTABLE JOB OBJECT', candidate_blind_airlock: 'VERIFIED_LOCKED',
      boundary_b_in_hash: await hash(canonical({ schema_version: output.schema_version, envelope_id: output.envelope_id,
        source_text: source.source_text, source_hash: source.source_hash })),
      boundary_b_out_hash: '', mode: 'HALT_ON_MALFORM' },
    target_identification_envelope: { company_organization: [], posting_party: [], job_title: [], requisition_id: [],
      employment_type: [], location: [], work_arrangement: [], relocation_terms: [], compensation: [], schedule_posting_date: [] },
    application_routing: { application_method: [], destination_url: [], recruiter_contact: [], required_submission_materials: [], special_instructions: [] },
    operational_primitives: { target_role: [], hard_candidate_gates: [], contextual_conditions: [], required_role_responsibilities: [] },
    source_spans: spans(source.source_text), de_theatricalization_log: [], diagnostic_trace: [],
  };
  let section: Section = 'context';
  let sectionSpan: string | undefined;
  for (const span of b1.source_spans) {
    const text = span.raw_text.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, '');
    const heading = sections.find(([, pattern]) => pattern.test(text));
    if (heading) {
      section = heading[0]; sectionSpan = span.source_span_id;
      b1.diagnostic_trace.push({ source_span_id: span.source_span_id, code: 'SECTION_SCOPE', detail: section });
      continue;
    }
    let captured = false;
    // Provenance labels are hints only: they cannot supply absent text. Match whole
    // values against exact source spans, never copy Scout defaults into B1.
    for (const [key, value] of [
      ['company_organization', source.source_provenance?.employer],
      ['job_title', source.source_provenance?.job_title],
    ] as const) {
      if (value && value.trim() && span.raw_text.trim() === value) {
        b1.target_identification_envelope[key].push(makePrimitive(span, '≈'));
        if (key === 'job_title') b1.operational_primitives.target_role.push(makePrimitive(span, '≈'));
        captured = true;
      }
    }
    for (const [key, pattern] of identityLabels) {
      if (pattern.test(text) && hasValue(text)) {
        b1.target_identification_envelope[key].push(makePrimitive(span, '≈'));
        if (key === 'job_title') b1.operational_primitives.target_role.push(makePrimitive(span, '≈'));
        captured = true;
      }
    }
    for (const [key, pattern] of routingLabels) {
      if (pattern.test(text) && hasValue(text)) {
        b1.application_routing[key].push(makePrimitive(span, '≈')); captured = true;
      }
    }
    if (/\b(?:apply|submit|send (?:your|a)|applications? (?:to|at))\b/i.test(text) && hasDestination(text)) {
      if (!b1.application_routing.destination_url.some(p => p.source_span_id === span.source_span_id)) {
        b1.application_routing.destination_url.push(makePrimitive(span, '≈'));
      }
      captured = true;
    }
    if (captured) { section = 'context'; sectionSpan = undefined; continue; }
    const classification = force(text, section);
    // Preserve the complete containing line as qualifier context for split clauses.
    const lineStart = source.source_text.lastIndexOf('\n', span.start_offset - 1) + 1;
    const nextNewline = source.source_text.indexOf('\n', span.end_offset);
    const line = source.source_text.slice(lineStart, nextNewline < 0 ? undefined : nextNewline).replace(/\r$/, '');
    const scope = [sectionSpan ? `${sectionSpan}: ${section}` : '', line].filter(Boolean).join('\n');
    const primitive = makePrimitive(span, classification.marker, scope);
    const bucket = classification.marker === '*' ? 'hard_candidate_gates'
      : classification.marker === '' ? 'required_role_responsibilities' : 'contextual_conditions';
    b1.operational_primitives[bucket].push(primitive);
    b1.diagnostic_trace.push({ source_span_id: span.source_span_id, code: 'SEMANTIC_FORCE', detail: classification.reason });
    if (/\b(?:rockstar|amazing|exciting|world.class|dynamic|family)\b/i.test(text)) {
      b1.de_theatricalization_log.push({ source_span_id: span.source_span_id, action: 'retained',
        reason: 'Rhetoric retained with exact qualifiers; no unsupported material deletion.' });
    }
  }
  const origin = b1.target_identification_envelope.company_organization.length > 0
    || b1.target_identification_envelope.posting_party.length > 0;
  const routing = b1.application_routing;
  const destination = [...routing.destination_url, ...routing.application_method, ...routing.recruiter_contact]
    .some(p => hasDestination(p.node_text));
  b1.b1_header.malform_diagnostic = diagnoseB1Object(origin, destination);
  b1.b1_header.stage_status = b1.b1_header.malform_diagnostic === 'VALID_JOB_OBJECT' ? 'completed' : 'halted';
  b1.diagnostic_trace.push({ code: 'EXTRACTION_POLICY', detail: 'Explicit labeled identity/routing and line/semicolon clauses; ambiguous prose retained as context. No candidate interpretation or B2 construction.' });
  // Self-excluding seal: hash complete B1 payload with boundary_b_out_hash set to empty string.
  b1.b1_header.boundary_b_out_hash = await hash(canonical(b1));
  if (b1.b1_header.stage_status === 'halted') throw new B1Halt(b1.b1_header.malform_diagnostic, b1);
  output.payload.b1 = b1;
  output.stage_state = { current_stage: 'b2', completed_stages: ['scout', 'b1'], status: 'ready' };
  output.append_log.push({ stage: 'b1', operation: 'decouple_and_append', timestamp: new Date().toISOString(),
    details: { observation_id: output.payload.scout.observation_id, deduplication_key: output.payload.scout.deduplication_key, contract_version: '0.2.0' } });
  return output as B1OutputEnvelope;
}
