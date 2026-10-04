from __future__ import annotations

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.orchestrator.forked_runtime import ForkedRuntimeOrchestrator
from tests.test_sdna_gate import SAMPLE_VALID_YAML


class TestIntegratedFork(unittest.TestCase):

    def test_full_pipeline_run_to_c1_handoff(self):
        orchestrator = ForkedRuntimeOrchestrator(session_id="integration-sess-001")

        # 1. Boot Gate & Ingress
        boot_success = orchestrator.boot(SAMPLE_VALID_YAML)
        self.assertTrue(boot_success)

        # 2. Intake Target
        raw_posting = "Leading FinTech seeks Principal Infrastructure Architect with Go and Kubernetes expertise."
        orchestrator.intake_target(
            target_id="tgt-fintech-01",
            company_name="Apex Financial",
            job_title="Principal Infrastructure Architect",
            destination_context="Workday Portal",
            raw_posting_text=raw_posting,
            hard_requirements=["Go", "Kubernetes", "Distributed Systems"],
            soft_requirements=["Technical Leadership"],
            keyword_lexicon=["K8s", "Raft", "Consensus", "Go"],
            source_url="https://apex.example.com/careers/123",
        )

        self.assertIsNotNone(orchestrator.sidecar)
        self.assertIsNotNone(orchestrator.envelope)
        self.assertFalse(orchestrator.sidecar.is_destroyed)

        # 3. Execute B Cycle (B1 -> B2 -> B3 -> B4 -> B5 -> Trace Verification -> Shredder)
        tombstone = orchestrator.execute_b_cycle()

        self.assertEqual(tombstone["status"], "TERMINATED_AND_VERIFIED")
        self.assertTrue(orchestrator.sidecar.is_destroyed)

        # 4. Handoff to C1 Resume Factory
        envelope = orchestrator.handoff_to_c1()
        self.assertEqual(envelope.current_stage, "B5_COMPLETE")
        self.assertEqual(envelope.status, "complete:STOP_BEFORE_RESUME_FACTORY")

        # Verify envelope contents
        env_dict = envelope.to_dict()
        self.assertEqual(env_dict["Z_state"]["candidate_id"], "cand-0412")
        self.assertEqual(env_dict["Z_state"]["target_id"], "tgt-fintech-01")
        self.assertIsNotNone(env_dict["A_scout"])
        self.assertIsNotNone(env_dict["B_sdna"])
        self.assertIn("B_sidecar_attestation", env_dict["B_sdna"])
        self.assertIn("b5_projection", env_dict["B_sdna"])

        # Confirm zero raw text was leaked into envelope
        env_json = envelope.to_json()
        self.assertNotIn("raw_posting_text", env_json)
        self.assertNotIn("Leading FinTech seeks Principal", env_json)


if __name__ == "__main__":
    unittest.main()
