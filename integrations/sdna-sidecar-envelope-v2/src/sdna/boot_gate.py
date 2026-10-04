from __future__ import annotations

from enum import Enum
from pathlib import Path
from typing import Optional, Tuple
from .validator import SDNAValidator, SDNAValidationReport
from .candidate_vault import CandidateVault


class RuntimeBootState(str, Enum):
    RUNTIME_START = "RUNTIME_START"
    AWAITING_SDNA = "AWAITING_SDNA"
    INPUT_PRESENT = "INPUT_PRESENT"
    VALIDATING = "VALIDATING"
    SDNA_MOUNTED = "SDNA_MOUNTED"
    RUNTIME_INITIALIZED = "RUNTIME_INITIALIZED"
    REJECTED = "REJECTED"


class SDNABootGate:
    """Controls the entry gate into the Spatial DNA runtime.

    Invariants:
    1. Every fresh runtime begins in AWAITING_SDNA.
    2. No candidate is preloaded, mocked, or defaulted.
    3. Both file path (.yaml/.yml) and direct YAML text pass through the same validator.
    4. Rejected envelopes transition to REJECTED and cleanly reset to AWAITING_SDNA.
    5. No downstream pipeline stage (Scout, B, C) can initialize before SDNA_MOUNTED.
    """

    def __init__(self, session_id: str):
        self.session_id: str = session_id
        self._state: RuntimeBootState = RuntimeBootState.AWAITING_SDNA
        self._raw_input: Optional[str] = None
        self._source_descriptor: Optional[str] = None
        self._last_report: Optional[SDNAValidationReport] = None
        self._vault: Optional[CandidateVault] = None

    @property
    def state(self) -> RuntimeBootState:
        return self._state

    @property
    def vault(self) -> Optional[CandidateVault]:
        return self._vault

    @property
    def last_report(self) -> Optional[SDNAValidationReport]:
        return self._last_report

    def provide_file(self, file_path: str) -> None:
        """Dual ingress path 1: file path."""
        p = Path(file_path)
        if p.suffix.lower() not in [".yaml", ".yml"]:
            raise ValueError(f"Unsupported file extension '{p.suffix}'. Must be .yaml or .yml")
        if not p.is_file():
            raise FileNotFoundError(f"SDNA file not found: {file_path}")

        raw_content = p.read_text(encoding="utf-8")
        self._set_input(raw_content, f"file://{p.name}")

    def provide_yaml_text(self, yaml_text: str, source_label: str = "pasted_yaml") -> None:
        """Dual ingress path 2: direct string/paste."""
        if not yaml_text or not yaml_text.strip():
            raise ValueError("Provided YAML text is empty.")
        self._set_input(yaml_text, source_label)

    def _set_input(self, raw_text: str, descriptor: str) -> None:
        if self._state not in [RuntimeBootState.AWAITING_SDNA, RuntimeBootState.REJECTED]:
            raise RuntimeError(f"Cannot accept input while in state {self._state}")
        self._raw_input = raw_text
        self._source_descriptor = descriptor
        self._state = RuntimeBootState.INPUT_PRESENT

    def validate_and_mount(self) -> Tuple[bool, SDNAValidationReport]:
        """Runs the 10 validation gates and mounts if valid."""
        if self._state != RuntimeBootState.INPUT_PRESENT or not self._raw_input:
            raise RuntimeError("Cannot validate: no input is currently present.")

        self._state = RuntimeBootState.VALIDATING
        is_valid, parsed_data, report = SDNAValidator.validate(self._raw_input)
        self._last_report = report

        if is_valid and parsed_data:
            self._vault = CandidateVault(self._raw_input, parsed_data, report.content_sha256)
            self._state = RuntimeBootState.SDNA_MOUNTED
            return True, report
        else:
            self._vault = None
            self._state = RuntimeBootState.REJECTED
            return False, report

    def initialize_runtime(self) -> None:
        """Transitions from SDNA_MOUNTED to RUNTIME_INITIALIZED, unlocking A_Scout."""
        if self._state != RuntimeBootState.SDNA_MOUNTED or not self._vault:
            raise RuntimeError(f"Cannot initialize runtime: current state is {self._state} (must be SDNA_MOUNTED)")
        self._state = RuntimeBootState.RUNTIME_INITIALIZED

    def reset(self) -> None:
        """Tears down mounted memory and resets back to AWAITING_SDNA."""
        if self._vault:
            self._vault.unmount()
            self._vault = None
        self._raw_input = None
        self._source_descriptor = None
        self._last_report = None
        self._state = RuntimeBootState.AWAITING_SDNA
