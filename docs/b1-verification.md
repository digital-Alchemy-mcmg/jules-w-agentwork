# B1 execution receipt

- Repository: `digital-Alchemy-mcmg/jules-w-agentwork`
- Assignment: `main:AGENTS.md`, blob `508d0b55aa7cd9bae4b1009da88ed79e50ff757d`
- Source: `scout-v2.2.0-verification`
- Source HEAD: `d237385a7464617d3d127f54868c983d5800a992`
- Working branch: `codex/b1-decouple`
- Environment: Windows, Node 22.17.0, npm 10.9.2
- `npm run lint`: PASS (TypeScript, no emit).
- `npm run test:b1`: PASS, 10 tests, zero failures.
- `node scripts/b1-demo.mjs` then `npm run b1 -- .b1-execution/scout-envelope.json .b1-execution/b1-envelope.json`: PASS.
- Demo output: `current_stage: b2`, completed stages `[scout, b1]`, B2–B5 null.
- Demo source seal: `sha256:a4f507ec8265e9ba5cc552e2814c233b2f0ec0d4654091e6e2d3560eb1f9d487`.
- Source bytes/hash and entire Scout payload: unchanged; deep-frozen input and detached output tested.
- Malform tests: all four origin/destination states passed; missing ordinary fields remain absent.
- Candidate boundary: no candidate argument or retrieval; unexpected candidate input rejected; Scout atoms and candidate notes do not influence decomposition.
- Span provenance, qualifiers, semantic-force classes, nested seals, replay/occupied-slot rejection and exclusive file output: PASS.
- `git diff --check`: PASS.

## Unresolved / practical limits

`npm run build` failed during Vite config loading: Windows blocked Vite's `net use`
child process with `spawn EPERM`; config bundling also reported an unloadable
Tailwind native dependency. A production UI build is not verified in this
environment. Existing build configuration and Scout engine were not changed.

Tests execute through Node's in-process test mode because the sandbox also blocks
Node's subprocess-based test isolation. npm's cache was placed outside the repo in
the task workspace after the default cache location was denied.

The extractor is deterministic and conservative, with the supported syntax and
unrecognized-prose behavior described in `docs/b1-decouple.md`. No claim of general
natural-language completeness or production-posting coverage is made. The demo
is synthetic target data passed through the actual Scout implementation, not a
production job or candidate record.

Remote commit/ref verification is returned separately after publication. No PR,
merge, source-branch write, Scout-probe update or B2 construction is authorized by
this assignment.
