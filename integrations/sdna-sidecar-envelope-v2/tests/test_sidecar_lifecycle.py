from __future__ import annotations

import hashlib
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.sidecar.b_sidecar import BSidecar, SidecarStage
from src.sidecar.trace_verifier import B5IndependentTraceVerifier
from src.sidecar.shredder import SidecarShredder


class TestSidecarLifecycle(unittest.TestCase):

    def setUp(self):
        self.raw_text = "Acme Corp is seeking a Staff Distributed Systems Engineer with 10+ years Go experience."
        self.expected_hash = hashlib.sha256(self.raw_text.encode("utf-8")).hexdigest()
        self.sidecar = BSidecar(raw_posting=self.raw_text)

    def test_sidecar_creation_and_hashes(self):
        self.assertEqual(self.sidecar.original_content_sha256, self.expected_hash)
        self.assertFalse(self.sidecar.is_destroyed)
        self.assertFalse(self.sidecar.tags_purged)

    def test_stage_access_matrix(self):
        # B1 can read and write
        text_b1 = self.sidecar.read_source_text(SidecarStage.B1)
        self.assertEqual(text_b1, self.raw_text)
        self.sidecar.write_temporary_tag("tag-01", {"span": "Go"}, SidecarStage.B1)

        # B1 cannot be written to by other stages
        with self.assertRaises(PermissionError):
            self.sidecar.write_temporary_tag("tag-02", {"span": "Go"}, SidecarStage.B2)

        # B2 can read source text
        self.assertEqual(self.sidecar.read_source_text(SidecarStage.B2), self.raw_text)

        # B3 is strictly PROHIBITED from reading sidecar
        with self.assertRaises(PermissionError):
            self.sidecar.read_source_text(SidecarStage.B3)

        # B4 can read source text and tags
        self.assertEqual(self.sidecar.read_source_text(SidecarStage.B4), self.raw_text)
        tags_b4 = self.sidecar.read_temporary_tags(SidecarStage.B4)
        self.assertIn("tag-01", tags_b4)

        # Purge temporary tags post-B4
        tag_hash = self.sidecar.purge_temporary_tags()
        self.assertTrue(self.sidecar.tags_purged)
        self.assertEqual(len(self.sidecar.read_temporary_tags(SidecarStage.B4)), 0)

        # B5 Semantic Engine is strictly PROHIBITED from reading sidecar
        with self.assertRaises(PermissionError):
            self.sidecar.read_source_text(SidecarStage.B5_SEMANTIC)

        # B5 Trace Verifier is authorized to read source text
        text_verifier = self.sidecar.read_source_text(SidecarStage.B5_VERIFIER)
        self.assertEqual(text_verifier, self.raw_text)

    def test_t06_trace_verification_and_shredder(self):
        # Setup B2 tree and B4 ledger
        b2_tree = {
            "node.go.experience": {
                "address": "node.go.experience",
                "source_span_text": "10+ years Go experience",
            }
        }
        b4_ledger = {
            "node.go.experience": {
                "disposition": "PASS",
                "admitted_proposition": "Candidate has 10+ years Go experience.",
            }
        }
        b2_hash = hashlib.sha256(str(sorted(b2_tree.items())).encode("utf-8")).hexdigest()
        b4_hash = hashlib.sha256(str(sorted(b4_ledger.items())).encode("utf-8")).hexdigest()
        tag_hash = self.sidecar.purge_temporary_tags()

        # Run B5 Trace Verifier
        verifier = B5IndependentTraceVerifier()
        result = verifier.verify_trace(
            sidecar=self.sidecar,
            expected_scout_hash=self.expected_hash,
            b5_projection_anchors=["node.go.experience"],
            b4_ledger=b4_ledger,
            b2_tree=b2_tree,
        )

        self.assertTrue(result.passed)
        self.assertTrue(result.hash_matched)
        self.assertEqual(result.recomputed_source_sha256, self.expected_hash)

        # Shred sidecar
        tombstone = SidecarShredder.shred_and_attest(
            sidecar=self.sidecar,
            trace_result=result,
            b2_frozen_tree_hash=b2_hash,
            b4_ledger_hash=b4_hash,
            tag_layer_hash=tag_hash,
        )

        self.assertEqual(tombstone["status"], "TERMINATED_AND_VERIFIED")
        self.assertEqual(tombstone["cryptographic_proofs"]["original_content_sha256"], self.expected_hash)
        self.assertTrue(self.sidecar.is_destroyed)

        # Attempt to access shredded sidecar raises RuntimeError
        with self.assertRaises(RuntimeError):
            self.sidecar.read_source_text(SidecarStage.B5_VERIFIER)


if __name__ == "__main__":
    unittest.main()
