# AGENTS.md — Repository Agent Operating Contract

## Repository

`digital-Alchemy-mcmg/jules-w-agentwork`

This repository is a controlled multi-agent workspace. Human/operator authority controls what enters authoritative branches. Agents work through isolated branches and return verifiable receipts.

Every agent operating in this repository must read the shared rules. An agent must obey the shared rules plus the section explicitly named for that agent. Sections named for other agents are coordination context only and are not executable instructions for the current agent.

## SHARED WORKSTATION RULES — ANY AGENT

### 0. Initialization handshake — mandatory

On the first read of this file in a session, the agent must identify itself, read these shared rules, locate its named section if one exists, and halt before executing commands, modifying files, generating code, or changing repository state.

Reply exactly:

*"Protocol acknowledged. Workstation active. Awaiting branch name and task."*

Do not summarize this file before the handshake. The handshake is the initialization lock.

### 1. Global rules for all agents

- Preserve source fidelity.
- Never silently reconstruct, summarize, normalize, repair, or replace authoritative source material.
- Inspect before modifying.
- Keep work reversible.
- Work only on an isolated agent branch unless explicitly authorized otherwise.
- Do not modify `main` directly except when the operator explicitly authorizes that specific operation.
- Do not modify `scout-v2.2.0-verification` directly.
- Do not merge your own work.
- Do not treat self-reported success as verification.
- Do not cross stage boundaries without explicit authorization.
- Do not claim completion without a verifiable artifact and execution receipt.
- If multiple credible failure causes exist, preserve them until a discriminating test eliminates alternatives.

### 2. Capability, authority, and state verification

Before changing repository state after receiving a task, verify the repository, current branch, requested target branch, available write/push authority, and task-specific constraints.

Never claim access, branch state, persistence, push capability, or completion unless directly verified.

If a required capability or authority is unavailable, stop at that boundary and report the exact blocker and last verified state. Do not simulate execution.

### 3. Execution over choreography

Once the task, target, authority, and constraints are resolved, execute. Do not consume turns narrating intended steps, repeating the assignment, or substituting planning for work. Ask a question only when an unresolved ambiguity prevents correct execution.

### 4. State fidelity and structural integrity

Before modifying an existing file, read its authoritative current version from the target branch. Before reporting completion, verify the resulting repository state.

Do not use naive string replacement, brittle regex mutation, disposable patch scripts, or blind append operations for structural edits. Preserve schema, surrounding structure, and intended behavior.

### 5. Egress, handoff, and truthful receipts

For repository work, successful delivery means the requested Git state exists remotely.

Do not substitute `localhost` URLs, mock web servers, synthetic ZIP links, pseudo-receipts, or descriptions of intended work for repository delivery.

Never report a file as written, committed, pushed, merged, deployed, saved, tested, or verified unless that action actually succeeded.

A repository completion receipt must identify the repository, branch, changed files, commit SHA, and materially relevant verification/test result.

### 6. Agent boundaries

Agent-specific instructions override shared rules only where the named section explicitly says so.

An agent must not adopt another agent's identity, permissions, tool assumptions, assignment, or agent-specific execution rules merely because those instructions are visible in this file.

If no named section exists for the current agent, the shared rules still apply. Do not invent special authority.

## ~END SHARED AGENT INSTRUCTIONS

## B1 PLUG-IN FREEZE — DO NOT REOPEN DURING B2 WORK

B1 is frozen as a plug-in boundary for downstream work.

- Frozen branch: `release/b1-plugin-v1`
- Frozen commit: `40cf71b4c87992d7ae3dba11b5ea9c0d71926e19`
- Provenance branch: `codex/b1-decouple`
- Upstream Scout source: `scout-v2.2.0-verification`
- Upstream Scout source HEAD: `d237385a7464617d3d127f54868c983d5800a992`
- Entry boundary: Scout envelope at `b / [scout] / ready`
- Exit boundary: B1-populated envelope at `b2 / [scout, b1] / ready`
- Downstream slots `b2` through `b5` remain null at B1 exit.

### Freeze rule

Any agent beginning B2 work must consume the B1 output contract from `release/b1-plugin-v1` at the frozen commit above. Do not redesign, reinterpret, reconcile with another agent's B1 implementation, or modify B1 merely to begin B2.

B1 may be reopened only by explicit operator instruction prompted by a demonstrated B1→B2 integration failure, contract defect, or later intentional revision.

The working branch `codex/b1-decouple` is provenance, not the downstream dependency. The release branch and frozen commit above are the B1 plug-in dependency.

## Protected Scout source

Authoritative Scout source branch:

`scout-v2.2.0-verification`

Scout v2.2.0 is upstream input authority. Its `payload.scout.original_target_source.source_text` must remain verbatim and its source hash must remain valid. Missing authoritative source must halt rather than trigger reconstruction.

The Scout output boundary is:

- `stage_state.current_stage === "b"`
- `stage_state.completed_stages === ["scout"]`
- `payload.b1 === null` before B1 execution

## ~JULES BEGIN

You are Jules, Google's coding agent operating in the `jules-w-agentwork` repository.

### Jules-specific rules

- Treat this repository as your persistent workstation.
- After the shared initialization handshake, wait for the operator's branch name and task.
- Use an isolated Jules branch unless the operator explicitly authorizes a different branch or direct work on `main`.
- Do not execute a Codex-specific assignment merely because it is visible in this file.
- Your repository handoff requires an atomic Git commit and remote push to the requested branch.
- State the pushed branch and commit SHA when the task is complete.

## ~END JULES INSTRUCTIONS

---

## ~CODEX BEGIN

## CODEX — current assignment: B1 Decouple

The repository-authority probe already passed. Do not repeat it.

Do not summarize a plan. Execute the assignment.

### Source and working branch

Start from the exact current HEAD of:

`scout-v2.2.0-verification`

Create and work only on:

`codex/b1-decouple`

Do not write B1 implementation to `main`, `scout-v2.2.0-verification`, or `codex/scout-probe`.

### B1 stage identity

B1 = **Decouple / Target Decomposition**.

B1 asks:

`WHAT DOES THIS TARGET OBJECT ACTUALLY CONTAIN?`

B1 is tabula-rasa, target-side, and candidate-blind.

B1 receives the schema-valid Scout Traveling Envelope and decomposes the target exactly as written.

B1 must stop before B2 tree construction.

### Input contract

Accept the existing Scout `TravelingEnvelope`.

Required entry condition:

- `stage_state.current_stage === "b"`
- authoritative Scout source exists at `payload.scout.original_target_source.source_text`
- upstream Scout source/hash integrity remains valid
- no candidate evidence may be consulted

Reject/halt rather than repair if the required authoritative source is absent or invalid.

### Source authority and immutability

The original posting/job object is authoritative.

B1 must:

- preserve `payload.scout` unchanged
- preserve the exact source text unchanged
- preserve upstream source hash unchanged
- clone/append rather than mutate upstream payload
- retain exact source-span provenance for every decomposed primitive
- preserve qualifiers, numbers, and missing fields
- never synthesize missing source material

### B1 owned payload contract

Replace `payload.b1: null` with a B1-owned object conforming to this structure:

`b1_header`
- `session_uid`
- `stage_status`
- `malform_diagnostic`
- `candidate_blind_airlock`
- `boundary_b_in_hash`
- `boundary_b_out_hash`
- `mode`

`target_identification_envelope`
- `company_organization`
- `posting_party`
- `job_title`
- `requisition_id`
- `employment_type`
- `location`
- `work_arrangement`
- `relocation_terms`
- `compensation`
- `schedule_posting_date`

`application_routing`
- `application_method`
- `destination_url`
- `recruiter_contact`
- `required_submission_materials`
- `special_instructions`

`operational_primitives`
- `target_role`
- `hard_candidate_gates`
- `contextual_conditions`
- `required_role_responsibilities`

Each semantic primitive must contain:
- `marker`
- `node_text`
- `source_span_id`
- optional `qualifier_scope`

Also include:
- `de_theatricalization_log`
- `diagnostic_trace`

### Semantic-force contract

Only these three source-supported classes exist:

- `*` = explicit hard candidate gate / mandatory admission condition
- `≈` = soft, contextual, preferred, desirable, interpretive, or non-hard condition
- unmarked = required role responsibility / operating duty

Controls:

- a number does not automatically make a condition hard
- imperative wording does not automatically make a condition hard
- do not convert soft requirements into hard gates
- do not invent thresholds
- do not invent requirements
- preserve source-supported qualifiers

### Target identification capture

Capture when present:

- company / organization / posting party
- job title
- requisition or posting ID
- employment type
- location and work arrangement
- relocation terms
- compensation and additional compensation
- schedule
- posting / closing date
- other material target identity information

Absence of an ordinary field must remain absence. Do not fabricate it.

### Application routing capture

Capture when present:

- application method
- destination
- URL / endpoint
- recruiter or contact
- required materials
- subject line
- special instructions

### Malform diagnostic

Only origin and destination are hard object-validity fields.

States:

- origin present + destination present -> `VALID_JOB_OBJECT`
- origin absent -> `MALFORMED — ORIGIN MISSING`
- destination absent -> `MALFORMED — DESTINATION MISSING`
- both absent -> `MALFORMED — UNROUTABLE JOB OBJECT`

Missing salary, location, schedule, or other ordinary posting fields does **not** by itself make the target malformed.

Normal production mode is `HALT_ON_MALFORM`.

Diagnostic continuation, if implemented, must preserve the malform flag and may not silently turn a malformed object into a valid one.

### Candidate-blind airlock

B1 may not:

- inspect candidate Spatial DNA
- inspect candidate evidence
- select an archetype or candidate type
- activate candidate planes
- determine candidate fit or relevance
- bind candidate evidence
- alter candidate evidence
- use candidate history to interpret the target

Set `candidate_blind_airlock` to `VERIFIED_LOCKED` only when this boundary is preserved.

### Source spans and decomposition

Every operational primitive must remain traceable to exact source text.

Use stable span identifiers such as `S-01`, `S-02`, etc.

For every span preserve:

- exact raw span text
- start offset
- end offset

Do not substitute Scout's existing `atomic_statements` as the B1 payload wholesale. Scout atoms may be inspected only as upstream Scout-owned data; B1 must produce its own stage-owned decomposition from the preserved authoritative source under the B1 contract.

### Traveling Envelope behavior

The same Traveling Envelope continues downstream.

B1 must append only `payload.b1` and the minimum stage/log metadata necessary for the legal handoff.

After successful B1 completion:

- preserve all upstream/persistent data unchanged
- mark B1 completed
- advance the envelope to B2 eligibility
- leave `payload.b2`, `payload.b3`, `payload.b4`, and `payload.b5` null
- do not construct the B2 tree

Follow the existing repository casing/conventions for stage-state literals; do not create a parallel incompatible envelope format.

### Required implementation

At minimum:

1. Create `src/services/b1Engine.ts`.
2. Extend `src/types/scout.ts` with the B1 types and legal Traveling Envelope B1 output state.
3. Add an isolated B1 executable/test surface sufficient to feed an actual Scout Traveling Envelope into B1 and inspect the resulting envelope.
4. Add tests/assertions proving:
   - valid Scout envelope accepted
   - missing authoritative source halts
   - upstream `payload.scout` remains unchanged
   - source text remains byte-for-byte unchanged
   - source hash remains unchanged
   - B1 primitives retain exact source-span provenance
   - semantic-force classes obey `*` / `≈` / unmarked rules
   - origin/destination malform states are correct
   - candidate-blind boundary is preserved
   - downstream B2-B5 payloads remain null
   - output is B2-eligible without constructing B2

Do not build B2.

### Commit and push

Commit B1 work with:

`feat(b1): implement candidate-blind target decomposition`

Push `codex/b1-decouple` remotely.

Do not merge.

Do not create a PR unless explicitly instructed after verification.

### Required receipt

Return:

- repository
- source branch and source HEAD SHA
- Codex B1 branch
- B1 commit SHA
- files created/modified
- build result
- type/lint result
- B1 execution-test result
- source immutability result
- Scout payload immutability result
- malform test results
- candidate-blind boundary result
- remote push/readback result
- exact unresolved items, if any

Do not claim B1 complete unless the isolated input -> B1 execution -> output path is demonstrated.


## ~END CODEX INSTRUCTIONS

---

## Jules and other agents

Other agents may operate simultaneously, but each must use its own isolated branch. One agent's branch is not another agent's workspace. No agent may merge another agent's work without explicit operator authorization.

## Merge authority

Pull requests are proposals, not authority. The operator controls acceptance into authoritative branches. Verification and merge are separate operations.
