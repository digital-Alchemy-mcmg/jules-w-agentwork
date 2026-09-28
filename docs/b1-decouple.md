# B1 Decouple

`ingestB1(envelope)` accepts a schema-valid Scout v0.2.0 JSON envelope at
`b / [scout] / ready`, verifies the preserved source SHA-256, and returns a deep
clone at `b2 / [scout, b1] / ready`. Only B1, stage state and one append-log entry
are added. B2–B5 stay null. Scout code is unchanged.

## Execute

Requires Node >=22.15 and installed project dependencies.

```sh
npm install
npm run test:b1
node scripts/b1-demo.mjs
npm run b1 -- .b1-execution/scout-envelope.json .b1-execution/b1-envelope.json
```

The demo creates synthetic target text and invokes the actual Scout engine to
produce the input envelope. It does not use or represent real candidate evidence.
For an existing Scout envelope, supply its path directly to `npm run b1`.
Output creation is exclusive; existing input/output files are never overwritten.
Halts exit with code 1, write diagnostics to stderr, and produce no B2-eligible file.

## Representation and force

Missing fields are empty arrays. Each populated identification/routing field and
operational primitive contains exact source text and a span reference. Offsets are
half-open JavaScript UTF-16 code-unit positions, not UTF-8 byte positions. Source
hashes use the unchanged text encoded as UTF-8, matching Scout.

The deterministic extractor recognizes explicit labeled identity and routing
fields, exact standalone employer/title values from source provenance, application
destinations, qualification headings, mandatory candidate qualifications, soft
qualifiers, and operating duties. Lines and semicolons delimit clauses. Compound
wording inside a clause stays intact; containing-line and heading context retain
qualifier scope. Numbers and bare imperatives cannot independently create `*` gates.
Responsibilities use the empty marker; soft/unknown context uses `≈`.

Unrecognized prose is retained as context with a diagnostic, not discarded or
promoted into a hard gate. Rhetoric is retained and logged rather than deleted
along with possibly material qualifiers. This is a conservative deterministic
extractor, not unrestricted natural-language understanding. Unlabeled identity
prose that is not an exact standalone provenance value needs operator review:
the extractor can halt on an unrecognized origin/destination. It never fills
missing fields from Scout defaults or infers a destination from a posting URL.

The candidate-blind airlock has no candidate argument, retrieval, model, fit or
archetype operation. Unknown envelope/payload keys halt before their values are
read. Scout atoms and persistent notes remain opaque passthrough and do not
participate in target decomposition.

## Seals and halts

`boundary_b_in_hash` seals recursively canonicalized JSON containing schema version,
envelope ID, authoritative source text and source hash. `boundary_b_out_hash` seals
the complete B1 object with that output-hash field set to the empty string (avoiding
self-reference). The session UID identifies an execution; hashes are not a claim
of external certification.

`B1Halt` carries a code. Object malforms also carry the B1 diagnostic payload with
`stage_status: halted` and `mode: HALT_ON_MALFORM`. Ordinary missing fields do not
invalidate the object. There is no diagnostic-continuation mode.
