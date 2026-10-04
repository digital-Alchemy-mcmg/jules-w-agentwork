from __future__ import annotations

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.envelope.master_envelope import MasterTravelingEnvelope


class TestMasterEnvelope(unittest.TestCase):

    def setUp(self):
        self.envelope = MasterTravelingEnvelope(
            candidate_id="cand-0412",
            target_id="tgt-9941",
        )

    def test_initial_envelope_state(self):
        self.assertEqual(self.envelope.candidate_id, "cand-0412")
        self.assertEqual(self.envelope.target_id, "tgt-9941")
        self.assertEqual(self.envelope.current_stage, "INITIALIZED")
        self.assertEqual(len(self.envelope._audit_trail), 1)

    def test_scout_append_and_leak_prevention(self):
        # Valid scout append
        self.envelope.append_scout(
            target_entity={"company_name": "Acme", "job_title": "Staff Engineer", "destination_context": "Greenhouse"},
            requirements_taxonomy={"hard_requirements": ["Go", "K8s"]},
            original_content_sha256="abc12345hash",
        )
        self.assertEqual(self.envelope.current_stage, "A_SCOUT")

        # Second append is rejected (immutable)
        with self.assertRaises(RuntimeError):
            self.envelope.append_scout(
                target_entity={"company_name": "Acme"},
                requirements_taxonomy={},
                original_content_sha256="abc",
            )

    def test_raw_text_leakage_prohibited(self):
        env = MasterTravelingEnvelope(candidate_id="c1", target_id="t1")
        # Attempting to put raw posting into the envelope raises ValueError
        with self.assertRaises(ValueError):
            env.append_scout(
                target_entity={"company_name": "Acme", "raw_job_description_text": "Should be in sidecar!"},
                requirements_taxonomy={},
                original_content_sha256="abc",
            )

    def test_c1_handoff_readiness_barrier(self):
        env = MasterTravelingEnvelope(candidate_id="c1", target_id="t1")
        env.append_scout(
            target_entity={"company_name": "Acme", "job_title": "SE", "destination_context": "Portal"},
            requirements_taxonomy={},
            original_content_sha256="hash1",
        )

        # Readiness fails because B_sdna is not yet appended
        ready, errors = env.verify_c1_handoff_readiness()
        self.assertFalse(ready)
        self.assertIn("B_sdna is missing.", errors)

        # Append incomplete B layer without verified tombstone
        with self.assertRaises(ValueError):
            env.append_b_layer(
                competency_tree={},
                b4_ledger={},
                b5_projection={"prism_intro_evaluation": "intro", "projection_posture": "posture"},
                b_sidecar_attestation={"status": "STILL_ALIVE"},
            )

        # Append with verified tombstone
        tombstone = {
            "sidecar_id": "sc-1",
            "status": "TERMINATED_AND_VERIFIED",
            "lifecycle_metrics": {"created_at": "t1", "tags_purged_at": "t2", "destroyed_at": "t3"},
            "cryptographic_proofs": {
                "original_content_sha256": "h1",
                "tag_layer_sha256": "h2",
                "b2_frozen_tree_sha256": "h3",
                "b4_lineage_ledger_sha256": "h4",
            },
            "b5_trace_verification": {"verifier_id": "v1", "result": "PASSED", "verified_walk": "walk", "hash_matched": True},
            "destruction_verification": {"method": "SHRED", "verified_zeroed": True, "attested_by": "monitor"},
        }

        env.append_b_layer(
            competency_tree={"root": {}},
            b4_ledger={"root": {}},
            b5_projection={"prism_intro_evaluation": "intro", "projection_posture": "posture"},
            b_sidecar_attestation=tombstone,
        )

        ready, errors = env.verify_c1_handoff_readiness()
        self.assertTrue(ready)
        self.assertEqual(len(errors), 0)


if __name__ == "__main__":
    unittest.main()
