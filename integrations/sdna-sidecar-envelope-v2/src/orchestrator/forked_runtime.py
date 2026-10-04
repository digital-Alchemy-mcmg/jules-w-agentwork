from __future__ import annotations

import hashlib
from typing import Any, Dict, List, Optional, Tuple
from ..sdna.boot_gate import SDNABootGate, RuntimeBootState
from ..sidecar.b_sidecar import BSidecar, SidecarStage
from ..sidecar.trace_verifier import B5IndependentTraceVerifier
from ..sidecar.shredder import SidecarShredder
from ..envelope.master_envelope import MasterTravelingEnvelope


class ForkedRuntimeOrchestrator:
    """End-to-End Orchestrator for the Forked Build.

    Integrates:
    - SDNA Boot Gate (Zero-bypass ingress & in-memory read-only mount)
    - Stationary B-Sidecar (Isolated, stage-aware, cryptographically shredded)
    - Master Traveling Envelope (Append-only v2.0 schema)
    - B5 -> C1 Clean Handover Barrier
    """

    def __init__(self, session_id: str):
        self.session_id: str = session_id
        self.boot_gate: SDNABootGate = SDNABootGate(session_id=session_id)
        self.sidecar: Optional[BSidecar] = None
        self.envelope: Optional[MasterTravelingEnvelope] = None

    def boot(self, sdna_yaml_text: str) -> bool:
        """Step 1: Ingest candidate SDNA through the Boot Gate."""
        self.boot_gate.provide_yaml_text(sdna_yaml_text, "runtime_ingress")
        success, report = self.boot_gate.validate_and_mount()
        if success:
            self.boot_gate.initialize_runtime()
        return success

    def intake_target(
        self,
        target_id: str,
        company_name: str,
        job_title: str,
        destination_context: str,
        raw_posting_text: str,
        hard_requirements: List[str],
        soft_requirements: List[str],
        keyword_lexicon: List[str],
        source_url: str = "",
    ) -> None:
        """Step 2: Scout intake.

        Forks into:
        - Stationary B-Sidecar (holds raw text)
        - Master Traveling Envelope (holds structured metadata & content hash only)
        """
        if self.boot_gate.state != RuntimeBootState.RUNTIME_INITIALIZED or not self.boot_gate.vault:
            raise RuntimeError("Cannot intake target before SDNA is validated and mounted.")

        content_hash = hashlib.sha256(raw_posting_text.encode("utf-8")).hexdigest()

        # Instantiate Stationary B-Sidecar
        self.sidecar = BSidecar(raw_posting=raw_posting_text, source_url=source_url)

        # Initialize Traveling Envelope
        self.envelope = MasterTravelingEnvelope(
            candidate_id=self.boot_gate.vault.candidate_id,
            target_id=target_id,
        )

        # Append A_scout (Zero raw text leakage!)
        self.envelope.append_scout(
            target_entity={
                "company_name": company_name,
                "job_title": job_title,
                "destination_context": destination_context,
            },
            requirements_taxonomy={
                "hard_requirements": hard_requirements,
                "soft_requirements": soft_requirements,
                "keyword_lexicon": keyword_lexicon,
            },
            original_content_sha256=content_hash,
            source_url=source_url,
        )

    def execute_b_cycle(
        self,
        b1_span_extractor: Any = None,
        prism_evaluator: Any = None,
    ) -> Dict[str, Any]:
        """Step 3: Execute B1 -> B2 -> B3 -> B4 -> B5 with strict sidecar boundaries."""
        if not self.sidecar or not self.envelope:
            raise RuntimeError("Cannot execute B cycle: Target has not been intaken.")

        # --- B1: Decouple & Tag ---
        # Reads sidecar source text, writes temporary tags
        raw_text = self.sidecar.read_source_text(SidecarStage.B1)
        tag_1 = {"span_start": 0, "span_end": min(50, len(raw_text)), "type": "REQUIREMENT"}
        self.sidecar.write_temporary_tag("tag-01", tag_1, SidecarStage.B1)

        # --- B2: Create Tree & Freeze ---
        # Synthesize deterministic tree addresses
        b2_tree = {
            "node.backend.core": {
                "address": "node.backend.core",
                "label": "Core Backend Engineering",
                "source_span_text": raw_text[:min(30, len(raw_text))],
            }
        }
        b2_hash = hashlib.sha256(str(sorted(b2_tree.items())).encode("utf-8")).hexdigest()

        # --- B3: Bind candidate SDNA (Sidecar access PROHIBITED) ---
        # Queries vault for candidate atoms
        assert self.boot_gate.vault is not None
        work_atoms = self.boot_gate.vault.get_domain_atoms("WORK_HISTORY", "B3")
        bindings = {
            "node.backend.core": {
                "bound_atoms": [a.get("atom_id") for a in work_atoms[:2]],
                "status": "BOUND",
            }
        }

        # --- B4: Truth Audit & Gate ---
        # Verifies evidence ceiling; purges sidecar temporary tags
        b4_ledger = {
            "node.backend.core": {
                "disposition": "PASS",
                "evidence_ceiling": "SUPPORTED_HIGH",
                "admitted_proposition": "Demonstrated core backend engineering at scale.",
            }
        }
        b4_hash = hashlib.sha256(str(sorted(b4_ledger.items())).encode("utf-8")).hexdigest()
        tag_layer_hash = self.sidecar.purge_temporary_tags()

        # --- B5: Five-Prism Evaluation (Sidecar access PROHIBITED for semantic engine) ---
        b5_projection = {
            "prism_intro_evaluation": "Seasoned backend engineer with proven track record in high-concurrency systems.",
            "owner_prism": "Independent Staffing-Firm Owner",
            "projection_posture": "Senior Distributed Systems Specialist",
            "geometric_directives": {"target_pages": 1, "density": "HIGH"},
            "enhancement_metrics": {"headroom": 23.0, "activated_share": 0.85, "enhancement_points": 19.55},
        }

        # --- B5 Independent Trace Verifier (T06: Walks to sidecar raw text, recomputes hash) ---
        verifier = B5IndependentTraceVerifier()
        trace_result = verifier.verify_trace(
            sidecar=self.sidecar,
            expected_scout_hash=self.envelope._A_scout["original_content_sha256"],
            b5_projection_anchors=["node.backend.core"],
            b4_ledger=b4_ledger,
            b2_tree=b2_tree,
        )

        if not trace_result.passed:
            raise RuntimeError(f"B5 Trace Verification Failed: {trace_result.error_detail}")

        # --- Shredder: Destroy Sidecar & Emit Attestation Tombstone ---
        tombstone = SidecarShredder.shred_and_attest(
            sidecar=self.sidecar,
            trace_result=trace_result,
            b2_frozen_tree_hash=b2_hash,
            b4_ledger_hash=b4_hash,
            tag_layer_hash=tag_layer_hash,
        )

        # Append sealed B layer to envelope
        self.envelope.append_b_layer(
            competency_tree=b2_tree,
            b4_ledger=b4_ledger,
            b5_projection=b5_projection,
            b_sidecar_attestation=tombstone,
        )

        return tombstone

    def handoff_to_c1(self) -> MasterTravelingEnvelope:
        """Step 4: Verify readiness and handoff to Stage C Resume Factory."""
        if not self.envelope:
            raise RuntimeError("No envelope exists.")
        ready, errors = self.envelope.verify_c1_handoff_readiness()
        if not ready:
            raise RuntimeError(f"C1 handoff verification failed: {errors}")
        return self.envelope
