from __future__ import annotations

from typing import Any, Dict, List, Optional
from .validator import REQUIRED_DOMAINS


class CandidateVault:
    """Read-only runtime memory container for mounted candidate Spatial DNA.

    Strict zero-persistence guarantee:
    - Never writes candidate data to an application database or disk.
    - Operates under read-only access.
    - Enforces stage-quarantine (B/B1/B2 cannot read candidate data; only B3 and later).
    - Cleared completely upon runtime end.
    """

    def __init__(self, raw_yaml: str, parsed_data: Dict[str, Any], content_hash: str):
        self._raw_yaml: str = raw_yaml
        self._data: Dict[str, Any] = parsed_data
        self._content_hash: str = content_hash
        self._candidate_id: str = parsed_data["candidate"]["candidate_id"]
        self._full_name: str = parsed_data["candidate"]["full_name"]
        self._is_mounted: bool = True

    @property
    def is_mounted(self) -> bool:
        return self._is_mounted

    @property
    def candidate_id(self) -> str:
        self._assert_mounted()
        return self._candidate_id

    @property
    def full_name(self) -> str:
        self._assert_mounted()
        return self._full_name

    @property
    def content_hash(self) -> str:
        return self._content_hash

    def get_domain_atoms(self, domain_name: str, requesting_stage: str) -> List[Dict[str, Any]]:
        """Quarantine enforcement: Only B3, B4, B5 and C stages are permitted to read candidate atoms."""
        self._assert_mounted()
        stage = requesting_stage.upper()
        if stage in ["A", "B", "B1", "B2"]:
            raise PermissionError(
                f"Quarantine violation: Stage {requesting_stage} is strictly prohibited from reading candidate atoms."
            )

        domains = self._data.get("domains", {})
        if domain_name not in domains:
            return []
        return domains[domain_name].get("atoms", [])

    def unmount(self) -> None:
        """Teardown: Wipe references to enforce zero retention."""
        self._data = {}
        self._raw_yaml = ""
        self._is_mounted = False

    def _assert_mounted(self) -> None:
        if not self._is_mounted:
            raise RuntimeError("CandidateVault is unmounted. Access is prohibited.")
