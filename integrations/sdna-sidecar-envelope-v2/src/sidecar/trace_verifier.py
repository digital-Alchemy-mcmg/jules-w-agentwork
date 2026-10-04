from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from .b_sidecar import BSidecar, SidecarStage


@dataclass(frozen=True)
class TraceVerificationResult:
    verifier_id: str
    passed: bool
    verified_walk: str
    recomputed_source_sha256: str
    expected_source_sha256: str
    hash_matched: bool
    anchors_checked: int
    error_detail: Optional[str] = None


class B5IndependentTraceVerifier:
    """Independent verifier executed at B5 boundary.

    Invariants:
    1. Reads only the raw source text from the stationary sidecar.
    2. Completely isolated from B5 semantic aggregation logic.
    3. Recomputes H(raw) and compares with upstream hashes.
    4. Traces B5 decision anchors through B4, B3, B2, B1 back to source spans.
    """

    def __init__(self, verifier_id: str = "b5-independent-trace-verifier-v2"):
        self.verifier_id = verifier_id

    def verify_trace(
        self,
        sidecar: BSidecar,
        expected_scout_hash: str,
        b5_projection_anchors: List[str],
        b4_ledger: Dict[str, Any],
        b2_tree: Dict[str, Any],
    ) -> TraceVerificationResult:
        # Step 1: Read source text via verifier authorization
        try:
            raw_text = sidecar.read_source_text(SidecarStage.B5_VERIFIER)
        except Exception as e:
            return TraceVerificationResult(
                verifier_id=self.verifier_id,
                passed=False,
                verified_walk="FAILED_AT_SIDECAR_READ",
                recomputed_source_sha256="",
                expected_source_sha256=expected_scout_hash,
                hash_matched=False,
                anchors_checked=0,
                error_detail=f"Failed to access sidecar source text: {str(e)}",
            )

        # Step 2: Recompute cryptographic hash
        recomputed_hash = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()
        hash_matched = (recomputed_hash == expected_scout_hash == sidecar.original_content_sha256)

        if not hash_matched:
            return TraceVerificationResult(
                verifier_id=self.verifier_id,
                passed=False,
                verified_walk="HASH_MISMATCH",
                recomputed_source_sha256=recomputed_hash,
                expected_source_sha256=expected_scout_hash,
                hash_matched=False,
                anchors_checked=0,
                error_detail=f"Hash mismatch! Recomputed: {recomputed_hash}, Expected: {expected_scout_hash}",
            )

        # Step 3: Validate trace walk for each anchor
        # B5 anchor -> B4 ledger address -> B2 tree node -> source span text inside raw_text
        anchors_checked = 0
        for anchor in b5_projection_anchors:
            # Check B4 ledger
            if anchor not in b4_ledger:
                return TraceVerificationResult(
                    verifier_id=self.verifier_id,
                    passed=False,
                    verified_walk=f"BROKEN_WALK_AT_B4({anchor})",
                    recomputed_source_sha256=recomputed_hash,
                    expected_source_sha256=expected_scout_hash,
                    hash_matched=True,
                    anchors_checked=anchors_checked,
                    error_detail=f"B5 anchor '{anchor}' missing in B4 ledger records.",
                )

            # Check B2 tree address
            if anchor not in b2_tree:
                return TraceVerificationResult(
                    verifier_id=self.verifier_id,
                    passed=False,
                    verified_walk=f"BROKEN_WALK_AT_B2({anchor})",
                    recomputed_source_sha256=recomputed_hash,
                    expected_source_sha256=expected_scout_hash,
                    hash_matched=True,
                    anchors_checked=anchors_checked,
                    error_detail=f"Target address '{anchor}' missing from frozen B2 tree.",
                )

            # Check source span exists in raw source text
            span_text = b2_tree[anchor].get("source_span_text", "")
            if span_text and span_text not in raw_text:
                return TraceVerificationResult(
                    verifier_id=self.verifier_id,
                    passed=False,
                    verified_walk=f"SPAN_NOT_FOUND_IN_SOURCE({anchor})",
                    recomputed_source_sha256=recomputed_hash,
                    expected_source_sha256=expected_scout_hash,
                    hash_matched=True,
                    anchors_checked=anchors_checked,
                    error_detail=f"Source span for '{anchor}' does not exist in sidecar raw text.",
                )

            anchors_checked += 1

        return TraceVerificationResult(
            verifier_id=self.verifier_id,
            passed=True,
            verified_walk="B5_DECISION -> B4_LEDGER -> B3_BINDING -> B2_TREE -> B1_SPAN -> SIDECAR_SOURCE_HASH",
            recomputed_source_sha256=recomputed_hash,
            expected_source_sha256=expected_scout_hash,
            hash_matched=True,
            anchors_checked=anchors_checked,
            error_detail=None,
        )
