from __future__ import annotations

import hashlib
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional


class SidecarStage(str, Enum):
    ENTRY = "ENTRY"
    B1 = "B1"
    B2 = "B2"
    B3 = "B3"
    B4 = "B4"
    POST_B4 = "POST_B4"
    B5_SEMANTIC = "B5_SEMANTIC"
    B5_VERIFIER = "B5_VERIFIER"
    TERMINATED = "TERMINATED"
    C_STAGES = "C_STAGES"


class BSidecar:
    """Stationary B-Sidecar container.

    Invariants:
    1. Instantiated at entry to B with raw Scout target payload.
    2. Remains stationary throughout B1–B5.
    3. Never enters or travels within the traveling envelope.
    4. Access rules:
       - B1: Read/Write (source text + structural decomposition + temporary tag layer).
       - B2: Read-Only (structural elements to freeze B2 tree).
       - B3: PROHIBITED (must read only frozen B2 tree + mounted SDNA).
       - B4: Read-Only (tags & source text for truth auditing).
       - Post-B4: Temporary tags purged.
       - B5 Semantic Engine: PROHIBITED.
       - B5 Independent Trace Verifier: Read-only source text solely to recompute/validate lineage hashes.
       - C1-C5: PROHIBITED (sidecar destroyed).
    """

    def __init__(self, raw_posting: str, raw_html: str = "", source_url: str = "", metadata: Optional[Dict[str, Any]] = None):
        self.sidecar_id: str = f"sc-b-{uuid.uuid4().hex[:12]}"
        self.created_at: str = datetime.now(timezone.utc).isoformat()
        self._raw_posting: str = raw_posting
        self._raw_html: str = raw_html
        self._source_url: str = source_url
        self._metadata: Dict[str, Any] = metadata or {}

        # Computed hashes
        self.original_content_sha256: str = hashlib.sha256(raw_posting.encode("utf-8")).hexdigest()

        # Working layers
        self._temporary_tags: Dict[str, Any] = {}
        self._tags_purged: bool = False
        self._tags_purged_at: Optional[str] = None
        self._is_destroyed: bool = False
        self._destroyed_at: Optional[str] = None

    @property
    def is_destroyed(self) -> bool:
        return self._is_destroyed

    @property
    def tags_purged(self) -> bool:
        return self._tags_purged

    def read_source_text(self, requesting_stage: SidecarStage) -> str:
        self._assert_active()
        if requesting_stage in [SidecarStage.B3, SidecarStage.B5_SEMANTIC, SidecarStage.C_STAGES]:
            raise PermissionError(
                f"Sidecar access violation: Stage '{requesting_stage.value}' is strictly forbidden from reading raw source text."
            )
        return self._raw_posting

    def read_structural_html(self, requesting_stage: SidecarStage) -> str:
        self._assert_active()
        if requesting_stage in [SidecarStage.B3, SidecarStage.B4, SidecarStage.B5_SEMANTIC, SidecarStage.B5_VERIFIER, SidecarStage.C_STAGES]:
            raise PermissionError(
                f"Sidecar access violation: Stage '{requesting_stage.value}' cannot read raw HTML structures."
            )
        return self._raw_html

    def write_temporary_tag(self, tag_id: str, tag_payload: Dict[str, Any], requesting_stage: SidecarStage) -> None:
        self._assert_active()
        if requesting_stage != SidecarStage.B1:
            raise PermissionError(f"Sidecar write violation: Only Stage B1 may write temporary tags, not '{requesting_stage.value}'.")
        if self._tags_purged:
            raise RuntimeError("Cannot write temporary tag: tag layer was already purged.")
        self._temporary_tags[tag_id] = tag_payload

    def read_temporary_tags(self, requesting_stage: SidecarStage) -> Dict[str, Any]:
        self._assert_active()
        if self._tags_purged:
            return {}
        if requesting_stage not in [SidecarStage.B1, SidecarStage.B4]:
            raise PermissionError(f"Sidecar tag read violation: Stage '{requesting_stage.value}' cannot read temporary tags.")
        return dict(self._temporary_tags)

    def purge_temporary_tags(self) -> str:
        """Executed immediately after B4 gate closes."""
        self._assert_active()
        # Compute tag layer hash before purging for audit ledger
        tag_str = str(sorted(self._temporary_tags.items()))
        tag_hash = hashlib.sha256(tag_str.encode("utf-8")).hexdigest()
        self._temporary_tags.clear()
        self._tags_purged = True
        self._tags_purged_at = datetime.now(timezone.utc).isoformat()
        return tag_hash

    def get_tag_layer_hash(self) -> str:
        tag_str = str(sorted(self._temporary_tags.items()))
        return hashlib.sha256(tag_str.encode("utf-8")).hexdigest()

    def mark_destroyed(self, timestamp: str) -> None:
        self._raw_posting = ""
        self._raw_html = ""
        self._metadata = {}
        self._temporary_tags = {}
        self._is_destroyed = True
        self._destroyed_at = timestamp

    def _assert_active(self) -> None:
        if self._is_destroyed:
            raise RuntimeError("BSidecar is destroyed. All read/write operations are permanently blocked.")
