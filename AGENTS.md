# AGENTS.md — Repository Agent Operating Contract

## Repository

`digital-Alchemy-mcmg/jules-w-agentwork`

This repository is a controlled multi-agent workspace. Human/operator authority controls what enters authoritative branches. Agents work through isolated branches and return verifiable receipts.

## Global rules for all agents

- Preserve source fidelity.
- Never silently reconstruct, summarize, normalize, repair, or replace authoritative source material.
- Inspect before modifying.
- Keep work reversible.
- Work only on an isolated agent branch unless explicitly authorized otherwise.
- Do not modify `main` directly.
- Do not merge your own work.
- Do not treat a self-reported success message as verification.
- Do not cross project/stage boundaries without explicit authorization.
- Do not begin downstream B/B1-B5 work while assigned to Scout.
- Do not claim completion without a verifiable artifact and execution receipt.
- If multiple credible failure causes exist, preserve them until a discriminating test eliminates alternatives.

## Protected Scout source

Current Scout source branch:

`scout-v2.2.0-verification`

Treat this branch as a protected source/reference branch. Agents must branch from its current HEAD and must not modify it directly unless the operator explicitly authorizes that action.

Scout source preservation is load-bearing. Original target source text must remain verbatim. Missing authoritative source must cause a halt rather than reconstruction.

## CODEX — current assignment

Codex: before performing any Scout construction, repair, refactor, or verification work, perform a repository execution-authority probe.

### Source

Repository:

`digital-Alchemy-mcmg/jules-w-agentwork`

Source branch:

`scout-v2.2.0-verification`

### Probe procedure

1. Confirm the attached repository identity.
2. Confirm `scout-v2.2.0-verification` exists.
3. Record its current HEAD commit SHA.
4. Demonstrate repository read access by reading from that source branch.
5. Inspect Git configuration and remote state.
6. Create an isolated branch from the exact current HEAD of `scout-v2.2.0-verification` named:

   `codex/scout-probe`

7. On `codex/scout-probe` only, create:

   `.codex-probe/repository-write-test.txt`

8. The probe file must record:
   - repository
   - source branch
   - source HEAD SHA
   - Codex probe branch
   - execution timestamp
   - statement: `Disposable Codex repository authority probe.`

9. Commit the probe artifact.
10. Push `codex/scout-probe` to the attached GitHub repository.
11. Verify the remote branch and committed probe artifact exist remotely after the push. A local commit alone is not proof.
12. Do not create a pull request.
13. Do not merge.
14. Do not modify Scout source code.
15. Do not request a PAT or alternate credential unless the existing attached repository path has first been demonstrated to fail.

### Required Codex receipt

Return:

- Repository
- Source branch
- Source HEAD SHA
- Codex branch
- Probe commit SHA
- Read test result
- Branch creation result
- Write test result
- Commit result
- Push/egress result
- Remote readback result
- Observed repository authority
- Any failure encountered

### Pass condition

The probe passes only when Codex demonstrates the complete remote path:

`READ SOURCE -> CREATE ISOLATED BRANCH -> WRITE -> COMMIT -> PUSH -> VERIFY REMOTE RESULT`

Do not infer capability from configuration or stated permissions. Demonstrate it.

If the complete sequence passes, STOP and return the receipt. Do not begin additional work.

## Jules and other agents

Other agents may operate simultaneously, but each must use its own isolated branch. One agent's branch is not another agent's workspace. No agent may merge another agent's work without explicit operator authorization.

## Merge authority

Pull requests are proposals, not authority. The operator controls acceptance into authoritative branches. Verification and merge are separate operations.
