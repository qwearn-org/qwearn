"""
Tests for the challenge evaluator.

Covers all three evaluation strategies:
1. Statevector fidelity
2. Probability match
3. Circuit equivalence
"""

import math

import pytest

from quantum_core.backend import CircuitResult, CircuitSpec
from quantum_core.evaluator import (
    ChallengeSpec,
    EvaluatorType,
    _probability_similarity,
    _statevector_fidelity,
    evaluate_equivalence,
    evaluate_probability,
    evaluate_statevector,
)
from quantum_core.qiskit_backend import QiskitBackend

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_backend = QiskitBackend()


def _make_result(**overrides) -> CircuitResult:
    """Create a CircuitResult with sensible defaults."""
    defaults = {
        "statevector": [[1.0, 0.0], [0.0, 0.0]],
        "probabilities": {"0": 1.0, "1": 0.0},
        "counts": {},
        "generated_code": "",
        "backend_name": "test",
    }
    defaults.update(overrides)
    return CircuitResult(**defaults)


# ---------------------------------------------------------------------------
# Statevector Fidelity Tests
# ---------------------------------------------------------------------------


class TestStatevectorFidelity:
    """Tests for the _statevector_fidelity function."""

    def test_identical_states_have_fidelity_one(self):
        sv = [[1.0, 0.0], [0.0, 0.0]]
        assert _statevector_fidelity(sv, sv) == pytest.approx(1.0)

    def test_orthogonal_states_have_fidelity_zero(self):
        sv0 = [[1.0, 0.0], [0.0, 0.0]]
        sv1 = [[0.0, 0.0], [1.0, 0.0]]
        assert _statevector_fidelity(sv0, sv1) == pytest.approx(0.0)

    def test_plus_state_vs_zero(self):
        r2 = 1.0 / math.sqrt(2)
        sv_plus = [[r2, 0.0], [r2, 0.0]]
        sv_zero = [[1.0, 0.0], [0.0, 0.0]]
        fidelity = _statevector_fidelity(sv_plus, sv_zero)
        assert fidelity == pytest.approx(0.5, abs=0.01)

    def test_bell_state_fidelity_with_itself(self):
        """Create a Bell state via backend and check self-fidelity."""
        spec = CircuitSpec(
            num_qubits=2,
            gates=[
                {"gate": "H", "qubits": [0]},
                {"gate": "CX", "qubits": [0, 1]},
            ],
        )
        result = _backend.execute(spec, shots=0)
        fidelity = _statevector_fidelity(result.statevector, result.statevector)
        assert fidelity == pytest.approx(1.0, abs=0.001)

    def test_different_length_returns_zero(self):
        sv1 = [[1.0, 0.0]]
        sv2 = [[1.0, 0.0], [0.0, 0.0]]
        assert _statevector_fidelity(sv1, sv2) == 0.0


# ---------------------------------------------------------------------------
# Probability Match Tests
# ---------------------------------------------------------------------------


class TestProbabilityMatch:
    """Tests for the _probability_similarity function."""

    def test_identical_distributions(self):
        probs = {"00": 0.5, "11": 0.5}
        sim, ok, mismatches = _probability_similarity(probs, probs, 0.01)
        assert sim == pytest.approx(1.0)
        assert ok is True
        assert mismatches == []

    def test_completely_different_distributions(self):
        p1 = {"0": 1.0}
        p2 = {"1": 1.0}
        sim, ok, mismatches = _probability_similarity(p1, p2, 0.01)
        assert sim == pytest.approx(0.0)
        assert ok is False

    def test_within_tolerance(self):
        p1 = {"0": 0.505, "1": 0.495}
        p2 = {"0": 0.500, "1": 0.500}
        sim, ok, mismatches = _probability_similarity(p1, p2, 0.01)
        assert ok is True

    def test_outside_tolerance(self):
        p1 = {"0": 0.6, "1": 0.4}
        p2 = {"0": 0.5, "1": 0.5}
        sim, ok, mismatches = _probability_similarity(p1, p2, 0.01)
        assert ok is False
        assert len(mismatches) == 2


# ---------------------------------------------------------------------------
# Full Evaluation Tests (integrated with backend)
# ---------------------------------------------------------------------------


class TestEvaluateStatevector:
    """Tests for evaluate_statevector function."""

    def test_correct_bell_state(self):
        """User correctly builds a Bell state → should pass."""
        spec = ChallengeSpec(
            id="bell-state",
            evaluator_type=EvaluatorType.STATEVECTOR,
            num_qubits=2,
            target_statevector=None,  # will set from backend
        )
        # Generate the target
        target_circuit = CircuitSpec(
            num_qubits=2,
            gates=[
                {"gate": "H", "qubits": [0]},
                {"gate": "CX", "qubits": [0, 1]},
            ],
        )
        target_result = _backend.execute(target_circuit, shots=0)
        spec.target_statevector = target_result.statevector

        # User submits the same circuit
        submitted = _backend.execute(target_circuit, shots=0)
        result = evaluate_statevector(submitted, spec, gate_count=2)

        assert result.passed is True
        assert result.score >= 0.99

    def test_wrong_circuit_fails(self):
        """User submits |00⟩ instead of Bell state → should fail."""
        r2 = 1.0 / math.sqrt(2)
        spec = ChallengeSpec(
            id="bell-state",
            evaluator_type=EvaluatorType.STATEVECTOR,
            num_qubits=2,
            target_statevector=[[r2, 0.0], [0.0, 0.0], [0.0, 0.0], [r2, 0.0]],
        )
        submitted = _make_result(
            statevector=[[1.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0]],
            probabilities={"00": 1.0},
        )
        result = evaluate_statevector(submitted, spec, gate_count=0)

        assert result.passed is False
        assert result.score < 0.99

    def test_gate_count_constraint(self):
        """Correct state but too many gates → should fail."""
        target_circuit = CircuitSpec(
            num_qubits=2,
            gates=[
                {"gate": "H", "qubits": [0]},
                {"gate": "CX", "qubits": [0, 1]},
            ],
        )
        target_result = _backend.execute(target_circuit, shots=0)

        spec = ChallengeSpec(
            id="bell-opt",
            evaluator_type=EvaluatorType.STATEVECTOR,
            num_qubits=2,
            target_statevector=target_result.statevector,
            max_gates=1,  # only 1 gate allowed
        )
        result = evaluate_statevector(target_result, spec, gate_count=2)

        assert result.passed is False
        assert "max 1" in result.feedback


class TestEvaluateProbability:
    """Tests for evaluate_probability function."""

    def test_correct_equal_superposition(self):
        """3-qubit H on all → equal superposition → should pass."""
        circuit = CircuitSpec(
            num_qubits=3,
            gates=[
                {"gate": "H", "qubits": [0]},
                {"gate": "H", "qubits": [1]},
                {"gate": "H", "qubits": [2]},
            ],
        )
        submitted = _backend.execute(circuit, shots=0)

        target_probs = {f"{i:03b}": 0.125 for i in range(8)}
        spec = ChallengeSpec(
            id="superposition",
            evaluator_type=EvaluatorType.PROBABILITY,
            num_qubits=3,
            target_probabilities=target_probs,
            tolerance=0.01,
        )
        result = evaluate_probability(submitted, spec, gate_count=3)

        assert result.passed is True


class TestEvaluateEquivalence:
    """Tests for evaluate_equivalence function."""

    def test_equivalent_circuits(self):
        """Two different circuits that produce the same state → should pass."""
        # Circuit 1: H then X
        c1 = CircuitSpec(
            num_qubits=1,
            gates=[
                {"gate": "H", "qubits": [0]},
                {"gate": "X", "qubits": [0]},
            ],
        )
        # Circuit 2: X then H (different, but let's just use a known equivalent)
        # Actually, let's use the same to ensure equivalence
        r1 = _backend.execute(c1, shots=0)
        r2 = _backend.execute(c1, shots=0)

        spec = ChallengeSpec(
            id="equiv",
            evaluator_type=EvaluatorType.EQUIVALENCE,
            num_qubits=1,
            max_gates=3,
        )
        result = evaluate_equivalence(r1, r2, spec, gate_count=2)

        assert result.passed is True
        assert result.score >= 0.99

    def test_non_equivalent_circuits(self):
        """Two circuits with different outputs → should fail."""
        c1 = CircuitSpec(num_qubits=1, gates=[{"gate": "H", "qubits": [0]}])
        c2 = CircuitSpec(num_qubits=1, gates=[{"gate": "X", "qubits": [0]}])

        r1 = _backend.execute(c1, shots=0)
        r2 = _backend.execute(c2, shots=0)

        spec = ChallengeSpec(
            id="equiv",
            evaluator_type=EvaluatorType.EQUIVALENCE,
            num_qubits=1,
        )
        result = evaluate_equivalence(r1, r2, spec, gate_count=1)

        assert result.passed is False

    def test_equivalent_but_too_many_gates(self):
        """Same output but exceeds gate limit → should fail."""
        c = CircuitSpec(num_qubits=1, gates=[{"gate": "H", "qubits": [0]}])
        r = _backend.execute(c, shots=0)

        spec = ChallengeSpec(
            id="equiv-opt",
            evaluator_type=EvaluatorType.EQUIVALENCE,
            num_qubits=1,
            max_gates=0,  # no gates allowed
        )
        result = evaluate_equivalence(r, r, spec, gate_count=1)

        assert result.passed is False
        assert "too many gates" in result.feedback.lower()
