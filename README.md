# Jules Agent Work

This repository is a controlled workspace for agent-produced and agent-tested project artifacts.

## Branch policy

The `main` branch is the neutral control surface. It contains repository-level operating instructions only.

Implementation artifacts are placed on dedicated working or verification branches. Do not place project implementation directly on `main`.

Do not merge a working branch into `main` merely because an agent reports completion. Artifacts must be independently inspected and verified before any merge decision.

## Current use

Spatial DNA Scout Stage work is reconstructed from its authoritative serialized source onto a dedicated verification branch. The serialized source is unpacked into its original repository paths; the serialization container itself is not treated as the implementation artifact.

## Operating rule

Preserve source fidelity. Keep changes reversible. Separate worker output from verification. Record the commit or branch used for every verification run.
