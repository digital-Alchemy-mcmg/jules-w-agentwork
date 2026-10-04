# SDNA Sidecar Integration Baseline

## Repository role

This repository remains the MARA Corridor / Antigravity application baseline. The material under `integrations/sdna-sidecar-envelope-v2/` is an integration substrate for the existing application, not a parallel application or replacement runtime.

## Preserved source artifact

The exact received archive is stored at:

`artifacts/integration-substrates/ANTIGRAVITY_FORK_SDNA_SIDECAR_ENVELOPE_V2.zip`

Archive SHA-256:

`11f0e192f7f4b465b4ab67bfe3d6dab19a417f44325c1ac8a74ae6e9de4bb876`

Drive source:

`https://drive.google.com/file/d/1NJt86_BWHA6mGksTuRpvI83o7P0o5OwZ/view?usp=drivesdk`

## Integration boundary

The existing application UI and Scout through B5 engines remain the product execution path. The substrate contributes:

- SDNA runtime-ingress state machine
- YAML parsing and validation primitives
- runtime-local candidate context
- stationary B-sidecar access controls
- sidecar lifecycle and attestation structures
- append-once envelope boundaries
- C1 handoff readiness checks
- associated unit tests

The substrate's demonstration orchestrator and UI simulation fallback are not production execution authority. They must be replaced by adapters into the repository's existing services before product activation.

## Verified package behavior

The isolated substrate test suite contains 12 `unittest` tests. All 12 passed before repository intake using:

`python3 -m unittest discover -s tests -v`

## Shared-work rule

Further SDNA gate, sidecar, envelope, and lifecycle work should extend this repository branch and preserve the existing Scout through B5 services rather than creating another standalone build.
