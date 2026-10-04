# Spatial DNA — Build Wave Pipeline Console (v2.2.0)

A cleanroom production operator console and cryptographic audit workbench for the Spatial DNA Pipeline: **SCOUT → B → B1 → B2 → B3 → B4 → B5**.

## Key Invariants
1. **Zero Hardcoded Bias**: Contains no hard-coded legacy training jobs or promotional candidate bias.
2. **Authentic Web Crypto SHA-256**: Real Web Crypto SHA-256 hashing directly over raw source bytes and boundary handoffs.
3. **Section 8 Source Preservation**: Preserves the complete, verbatim job posting without metadata synthesis in `payload.scout.original_target_source`.
4. **12-Rule Semantic Decomposition**: Converts messy prose into discrete atomic facts stripped of marketing fluff and pronouns.
5. **14 Semantic Categories**: Indexes atomic statements via exact-string reference.
6. **Traveling Envelope v0.2**: Immutable stage progression:
   - **SCOUT**: collection, decomposition, and source preservation (`current_stage: "b"`).
   - **B1 (Decouple)**: candidate-blind airlock (`VERIFIED_LOCKED`), half-open UTF-16 source spans, operational force (`*`, `≈`, `""`), and 4-state malform diagnostic (`current_stage: "b2"`).
   - **B2 (Create Tree)**: deterministic lowercase alphanumeric hierarchy (`t.id.*`, `t.route.*`, `t.gate.*`, `t.cond.*`, `t.duty.*`) with bidirectional provenance, frozen via `Object.freeze()` (`current_stage: "b3"`).
   - **B3 (Bind)**: inverted inquiry against Spatial DNA planes (`Experience`, `Skills`, `Education`, `Certifications`, `Operations`, `Leadership`, `Performance`) distinguishing considered vs selected atoms (`current_stage: "b4"`).
   - **B4 (Truth Gate)**: truth-admission gate auditing strictly B3-selected evidence; dispositions (`PASS`, `QUALIFIED_BOUNDED`, `UNRESOLVED`, `CONTRADICTED`); non-negotiable hard-gate defense (`*`); evidence ceiling computation and cryptographic boundary seal (`current_stage: "b5"`).
   - **B5 (Semantic Core)**: 5 projection prisms (`Sales Headhunter`, `Independent Staffing-Firm Owner`, `Sports Agent`, `Discovery Scout`, `Casting Director`); normalized 100% projection emphasis; writing boundaries; prohibited implications; and presentation geometry posture (`current_stage: "stop_before_resume_factory"`, `status: "complete"`).

## Verification Commands
```bash
# Typecheck
npm run lint

# Run isolated B1 test suite
npm run test:b1

# Run complete straight-through pipeline test suite (13/13 passing)
npm run test:pipeline

# Run live CLI pipeline runner (SCOUT -> B5)
npm run pipeline

# Production UI bundle build
npm run build
```

## SDNA Runtime and Sidecar Integration

The preserved SDNA boot-gate, runtime mount, stationary sidecar, and traveling-envelope substrate is maintained under `integrations/sdna-sidecar-envelope-v2/`. Its repository role, source receipt, verification status, and integration boundary are recorded in `docs/sdna-sidecar-integration-baseline.md`.
