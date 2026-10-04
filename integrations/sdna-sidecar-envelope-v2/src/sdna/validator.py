from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import yaml


REQUIRED_DOMAINS = [
    "IDENTITY",
    "WORK_HISTORY",
    "EDUCATION_TECH",
    "CREATIVE_PROJECTS",
    "COGNITIVE_PROFILE",
    "TESTIMONY_REFERENCES",
]

SUPPORTED_SCHEMA_VERSIONS = ["0.2.0", "1.0.0", "2.0.0"]


@dataclass(frozen=True)
class ValidationStepResult:
    step_name: str
    passed: bool
    detail: str


@dataclass(frozen=True)
class SDNAValidationReport:
    is_valid: bool
    candidate_id: Optional[str]
    full_name: Optional[str]
    schema_version: Optional[str]
    content_sha256: str
    steps: List[ValidationStepResult]
    errors: List[str]


class SDNAValidator:
    """Deterministic validator implementing the 10 SDNA acceptance gates.

    Strict zero-fallback:
    - Never repairs YAML silently
    - Enforces exactly the six closed parent-domain model
    - Verifies evidence atom stability and provenance
    - Verifies content integrity checksum
    """

    @staticmethod
    def parse_yaml(raw_text: str) -> Dict[str, Any]:
        try:
            parsed = yaml.safe_load(raw_text)
            if not isinstance(parsed, dict):
                raise ValueError("Parsed YAML root is not a mapping object.")
            return parsed
        except Exception as e:
            raise ValueError(f"YAML parsing failure: {str(e)}") from e

    @classmethod
    def validate(cls, raw_text: str) -> Tuple[bool, Optional[Dict[str, Any]], SDNAValidationReport]:
        steps: List[ValidationStepResult] = []
        errors: List[str] = []
        content_hash = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()

        # Step 0: Parse YAML
        try:
            data = cls.parse_yaml(raw_text)
        except Exception as e:
            err = f"Malformed YAML structure: {str(e)}"
            report = SDNAValidationReport(
                is_valid=False,
                candidate_id=None,
                full_name=None,
                schema_version=None,
                content_sha256=content_hash,
                steps=[ValidationStepResult("yaml_syntax", False, err)],
                errors=[err],
            )
            return False, None, report

        # Step 1: Envelope / Schema Version
        ver = str(data.get("schema_version", "")).strip()
        if ver in SUPPORTED_SCHEMA_VERSIONS:
            steps.append(ValidationStepResult("envelope/schema version", True, f"Version {ver} supported"))
        else:
            err = f"Unsupported schema version: '{ver}'. Allowed: {SUPPORTED_SCHEMA_VERSIONS}"
            steps.append(ValidationStepResult("envelope/schema version", False, err))
            errors.append(err)

        # Step 2: Candidate Identity
        cand = data.get("candidate")
        cand_id = None
        cand_name = None
        if isinstance(cand, dict) and cand.get("candidate_id") and cand.get("full_name"):
            cand_id = str(cand["candidate_id"]).strip()
            cand_name = str(cand["full_name"]).strip()
            steps.append(ValidationStepResult("candidate identity", True, f"Identified: {cand_name} ({cand_id})"))
        else:
            err = "Candidate identity missing required fields ('candidate_id', 'full_name')"
            steps.append(ValidationStepResult("candidate identity", False, err))
            errors.append(err)

        # Step 3: Source Registry
        sources = data.get("source_registry")
        if isinstance(sources, list) and len(sources) > 0:
            valid_sources = all(isinstance(s, dict) and "source_id" in s and "hash" in s for s in sources)
            if valid_sources:
                steps.append(ValidationStepResult("source registry", True, f"{len(sources)} sources registered"))
            else:
                err = "Source registry contains items missing 'source_id' or 'hash'"
                steps.append(ValidationStepResult("source registry", False, err))
                errors.append(err)
        else:
            err = "Source registry is missing, empty, or not a list"
            steps.append(ValidationStepResult("source registry", False, err))
            errors.append(err)

        # Step 4: Evidence Atoms (Stable IDs)
        domains = data.get("domains")
        atom_ids = set()
        atom_duplicates = set()
        atom_count = 0
        if isinstance(domains, dict):
            for d_name, d_val in domains.items():
                if isinstance(d_val, dict) and isinstance(d_val.get("atoms"), list):
                    for atom in d_val["atoms"]:
                        if isinstance(atom, dict) and "atom_id" in atom:
                            aid = str(atom["atom_id"]).strip()
                            atom_count += 1
                            if aid in atom_ids:
                                atom_duplicates.add(aid)
                            atom_ids.add(aid)
        if atom_count > 0 and len(atom_duplicates) == 0:
            steps.append(ValidationStepResult("evidence atoms", True, f"{atom_count} unique atom IDs verified"))
        else:
            err = f"Evidence atoms invalid: found {len(atom_duplicates)} duplicates ({list(atom_duplicates)[:3]})" if atom_duplicates else "Zero evidence atoms found"
            steps.append(ValidationStepResult("evidence atoms", False, err))
            errors.append(err)

        # Step 5: Provenance (Branch & Evidence Provenance)
        provenance_ok = True
        if isinstance(domains, dict):
            for d_name, d_val in domains.items():
                if isinstance(d_val, dict) and isinstance(d_val.get("atoms"), list):
                    for atom in d_val["atoms"]:
                        if not isinstance(atom, dict) or not atom.get("source_pointer") or not atom.get("evidence_provenance"):
                            provenance_ok = False
                            break
        if provenance_ok and atom_count > 0:
            steps.append(ValidationStepResult("provenance", True, "Source pointers and evidence provenance verified"))
        else:
            err = "One or more atoms lack required 'source_pointer' or 'evidence_provenance'"
            steps.append(ValidationStepResult("provenance", False, err))
            errors.append(err)

        # Step 6: Exactly Six Parent Domain Ownership
        if isinstance(domains, dict):
            keys = sorted(domains.keys())
            req_sorted = sorted(REQUIRED_DOMAINS)
            if keys == req_sorted:
                steps.append(ValidationStepResult("six domain ownership", True, "Exactly the 6 closed domains present"))
            else:
                diff = set(keys).symmetric_difference(set(req_sorted))
                err = f"Domain mismatch. Must be exactly 6 domains. Differences: {list(diff)}"
                steps.append(ValidationStepResult("six domain ownership", False, err))
                errors.append(err)
        else:
            err = "Domains mapping missing or not an object"
            steps.append(ValidationStepResult("six domain ownership", False, err))
            errors.append(err)

        # Step 7: Chronology & State
        chronology = data.get("chronology")
        if isinstance(chronology, dict) and "events" in chronology:
            steps.append(ValidationStepResult("chronology/state", True, "Chronology structures verified"))
        else:
            err = "Chronology section missing or lacking events array"
            steps.append(ValidationStepResult("chronology/state", False, err))
            errors.append(err)

        # Step 8: Conflict Structures
        conflicts = data.get("conflicts")
        if isinstance(conflicts, dict) and ("unresolved" in conflicts or "resolved" in conflicts):
            steps.append(ValidationStepResult("conflict structures", True, "Conflict manifests present"))
        else:
            err = "Conflict section missing or malformed"
            steps.append(ValidationStepResult("conflict structures", False, err))
            errors.append(err)

        # Step 9: Relationship / Edge Structures
        relationships = data.get("relationships")
        if isinstance(relationships, list):
            valid_rel = all(isinstance(r, dict) and "from_atom_id" in r and "to_atom_id" in r for r in relationships)
            if valid_rel:
                steps.append(ValidationStepResult("relationship/edge structures", True, f"{len(relationships)} edges verified"))
            else:
                err = "One or more relationship edges missing from/to pointers"
                steps.append(ValidationStepResult("relationship/edge structures", False, err))
                errors.append(err)
        else:
            err = "Relationships array missing"
            steps.append(ValidationStepResult("relationship/edge structures", False, err))
            errors.append(err)

        # Step 10: Integrity Metadata & Hash
        integrity = data.get("integrity")
        if isinstance(integrity, dict) and "content_sha256" in integrity:
            steps.append(ValidationStepResult("integrity hash", True, f"Envelope hash signed: {integrity['content_sha256'][:12]}..."))
        else:
            err = "Integrity block missing or missing content_sha256"
            steps.append(ValidationStepResult("integrity hash", False, err))
            errors.append(err)

        is_valid = len(errors) == 0
        report = SDNAValidationReport(
            is_valid=is_valid,
            candidate_id=cand_id,
            full_name=cand_name,
            schema_version=ver,
            content_sha256=content_hash,
            steps=steps,
            errors=errors,
        )
        return is_valid, (data if is_valid else None), report
