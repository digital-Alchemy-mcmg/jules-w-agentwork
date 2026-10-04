from __future__ import annotations

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.sdna.boot_gate import SDNABootGate, RuntimeBootState
from src.sdna.validator import SDNAValidator


SAMPLE_VALID_YAML = """
schema_version: "2.0.0"
candidate:
  candidate_id: "cand-0412"
  full_name: "Elena Rostova"
  primary_contact:
    email: "elena@example.com"
source_registry:
  - source_id: "src-01"
    source_type: "RESUME_PDF"
    hash: "abc12345def"
domains:
  IDENTITY:
    domain_id: "IDENTITY"
    atoms:
      - atom_id: "atom-id-01"
        source_pointer: "src-01#p1"
        evidence_provenance: "RESUME"
        content: "Principal Distributed Systems Engineer"
  WORK_HISTORY:
    domain_id: "WORK_HISTORY"
    atoms:
      - atom_id: "atom-wh-01"
        source_pointer: "src-01#p2"
        evidence_provenance: "EMPLOYMENT"
        content: "Led migration of 200 microservices to Kubernetes"
  EDUCATION_TECH:
    domain_id: "EDUCATION_TECH"
    atoms:
      - atom_id: "atom-ed-01"
        source_pointer: "src-01#p3"
        evidence_provenance: "DEGREE"
        content: "BS in Computer Science"
  CREATIVE_PROJECTS:
    domain_id: "CREATIVE_PROJECTS"
    atoms:
      - atom_id: "atom-cp-01"
        source_pointer: "src-01#p4"
        evidence_provenance: "GITHUB"
        content: "Open source Raft implementation in Go"
  COGNITIVE_PROFILE:
    domain_id: "COGNITIVE_PROFILE"
    atoms:
      - atom_id: "atom-cg-01"
        source_pointer: "src-01#p5"
        evidence_provenance: "ASSESSMENT"
        content: "High architectural synthesis and fault diagnosis"
  TESTIMONY_REFERENCES:
    domain_id: "TESTIMONY_REFERENCES"
    atoms:
      - atom_id: "atom-tr-01"
        source_pointer: "src-01#p6"
        evidence_provenance: "PEER_REVIEW"
        content: "Elena possesses exceptional distributed consensus depth"
chronology:
  events:
    - role: "Staff Engineer"
      start: "2020-01"
      end: "2024-05"
conflicts:
  unresolved: []
  resolved: []
relationships:
  - from_atom_id: "atom-wh-01"
    to_atom_id: "atom-cp-01"
    relation_type: "DEMONSTRATES"
integrity:
  content_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  signed_epoch: 1727900000
"""

SAMPLE_DUPLICATE_ATOM_YAML = SAMPLE_VALID_YAML.replace("atom-wh-01", "atom-id-01")
SAMPLE_BAD_DOMAIN_YAML = SAMPLE_VALID_YAML.replace("TESTIMONY_REFERENCES", "CUSTOM_DOMAIN")


class TestSDNABootGate(unittest.TestCase):

    def test_t01_initial_state_awaiting_sdna(self):
        gate = SDNABootGate(session_id="test-sess-01")
        self.assertEqual(gate.state, RuntimeBootState.AWAITING_SDNA)
        self.assertIsNone(gate.vault)

    def test_t02_dual_yaml_ingress(self):
        gate = SDNABootGate(session_id="test-sess-02")
        gate.provide_yaml_text(SAMPLE_VALID_YAML)
        self.assertEqual(gate.state, RuntimeBootState.INPUT_PRESENT)
        success, report = gate.validate_and_mount()
        self.assertTrue(success)
        self.assertEqual(gate.state, RuntimeBootState.SDNA_MOUNTED)
        self.assertIsNotNone(gate.vault)
        self.assertEqual(gate.vault.candidate_id, "cand-0412")

    def test_t03_rejection_matrix(self):
        # Duplicate atom IDs
        gate1 = SDNABootGate(session_id="test-reject-01")
        gate1.provide_yaml_text(SAMPLE_DUPLICATE_ATOM_YAML)
        success1, report1 = gate1.validate_and_mount()
        self.assertFalse(success1)
        self.assertEqual(gate1.state, RuntimeBootState.REJECTED)
        self.assertTrue(any("duplicate" in e.lower() for e in report1.errors))

        # Domain mismatch (not exactly the 6 closed domains)
        gate2 = SDNABootGate(session_id="test-reject-02")
        gate2.provide_yaml_text(SAMPLE_BAD_DOMAIN_YAML)
        success2, report2 = gate2.validate_and_mount()
        self.assertFalse(success2)
        self.assertEqual(gate2.state, RuntimeBootState.REJECTED)
        self.assertTrue(any("domain mismatch" in e.lower() for e in report2.errors))

    def test_t04_immutable_mount_quarantine_and_teardown(self):
        gate = SDNABootGate(session_id="test-sess-04")
        gate.provide_yaml_text(SAMPLE_VALID_YAML)
        gate.validate_and_mount()
        gate.initialize_runtime()
        self.assertEqual(gate.state, RuntimeBootState.RUNTIME_INITIALIZED)

        vault = gate.vault
        self.assertIsNotNone(vault)

        # Quarantine check: Stage B1 cannot read candidate atoms
        with self.assertRaises(PermissionError):
            vault.get_domain_atoms("WORK_HISTORY", "B1")

        # B3 is authorized to read candidate atoms
        atoms = vault.get_domain_atoms("WORK_HISTORY", "B3")
        self.assertEqual(len(atoms), 1)
        self.assertEqual(atoms[0]["atom_id"], "atom-wh-01")

        # Teardown clears memory
        gate.reset()
        self.assertEqual(gate.state, RuntimeBootState.AWAITING_SDNA)
        self.assertIsNone(gate.vault)
        with self.assertRaises(RuntimeError):
            vault.get_domain_atoms("WORK_HISTORY", "B3")


if __name__ == "__main__":
    unittest.main()
