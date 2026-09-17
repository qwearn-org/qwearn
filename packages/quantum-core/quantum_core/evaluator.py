"""
Challenge Evaluator — Automatic circuit evaluation engine.

PURPOSE:
    Evaluates user-submitted circuits against challenge specifications.
    Three evaluation strategies are supported:

    1. StatevectorFidelity — Compares submitted circuit's output statevector
       against a target statevector using quantum state fidelity.
    2. ProbabilityMatch — Checks that measurement probability distributions
       match within a tolerance ε per basis state.
    3. EquivalenceCheck — Verifies that two circuits produce the same output,
       optionally enforcing a gate count limit.

SECURITY:
    The evaluator only accepts structured CircuitSpec JSON. No user code
    is ever executed. See IMPLEMENTATION_PLAN.md §Phase 4.

REFERENCES:
    - Fidelity: F(ρ, σ) = |⟨ψ|φ⟩|² for pure states
    - Nielsen & Chuang §9.2 (distance measures)
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field

from quantum_core.backend import CircuitResult, CircuitSpec

# ---------------------------------------------------------------------------
# Data Models
# ---------------------------------------------------------------------------


class EvaluatorType(str, Enum):
    """Supported evaluation strategies."""

    STATEVECTOR = "statevector"
    PROBABILITY = "probability"
    EQUIVALENCE = "equivalence"


class ChallengeSpec(BaseModel):
    """
    Specification for a challenge evaluation.

    Defines what the user must achieve and how to check it.

    Attributes:
        id: Unique challenge identifier (matches content directory name).
        evaluator_type: Which evaluation strategy to use.
        num_qubits: Required qubit count for the challenge circuit.
        target_statevector: Expected output statevector as [real, imag] pairs.
                          Required for 'statevector' evaluator.
        target_probabilities: Expected measurement probabilities.
                            Required for 'probability' evaluator.
        target_circuit: Reference circuit for equivalence checks.
                       Required for 'equivalence' evaluator.
        tolerance: Acceptable error margin (default 0.01).
        max_gates: Maximum gate count allowed (for optimization challenges).
    """

    id: str
    evaluator_type: EvaluatorType
    num_qubits: int = Field(..., ge=1, le=20)
    target_statevector: list[list[float]] | None = None
    target_probabilities: dict[str, float] | None = None
    target_circuit: CircuitSpec | None = None
    tolerance: float = Field(default=0.01, ge=0.0, le=1.0)
    max_gates: int | None = None


class EvaluationResult(BaseModel):
    """
    Result of evaluating a submitted circuit against a challenge spec.

    Attributes:
        passed: Whether the submission met the challenge criteria.
        score: Fidelity/similarity score from 0.0 to 1.0.
        feedback: Human-readable explanation of the result.
        details: Evaluator-specific data (fidelity, gate count, etc.).
    """

    passed: bool
    score: float = Field(..., ge=0.0, le=1.0)
    feedback: str
    details: dict = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Evaluator Functions
# ---------------------------------------------------------------------------


def _statevector_fidelity(
    submitted_sv: list[list[float]],
    target_sv: list[list[float]],
) -> float:
    """
    Compute the quantum state fidelity between two pure-state statevectors.

    For pure states: F = |⟨ψ|φ⟩|²

    Both statevectors are lists of [real, imag] pairs.
    Returns a float in [0.0, 1.0].
    """
    if len(submitted_sv) != len(target_sv):
        return 0.0

    # Compute inner product ⟨target|submitted⟩
    inner_real = 0.0
    inner_imag = 0.0
    for (sr, si), (tr, ti) in zip(submitted_sv, target_sv):
        # ⟨target|submitted⟩ = Σ conj(target_i) * submitted_i
        # conj(tr + ti*i) * (sr + si*i) = (tr - ti*i)(sr + si*i)
        #   = tr*sr + tr*si*i - ti*sr*i - ti*si*i²
        #   = (tr*sr + ti*si) + (tr*si - ti*sr)*i
        inner_real += tr * sr + ti * si
        inner_imag += tr * si - ti * sr

    # Fidelity = |inner product|²
    fidelity = inner_real**2 + inner_imag**2
    return min(fidelity, 1.0)  # clamp floating-point errors


def _probability_similarity(
    submitted_probs: dict[str, float],
    target_probs: dict[str, float],
    tolerance: float,
) -> tuple[float, bool, list[str]]:
    """
    Compare two probability distributions.

    Returns (similarity_score, all_within_tolerance, list_of_mismatches).
    Similarity is 1 - (mean absolute error).
    """
    all_keys = set(submitted_probs.keys()) | set(target_probs.keys())
    if not all_keys:
        return 1.0, True, []

    total_error = 0.0
    mismatches: list[str] = []

    for key in sorted(all_keys):
        sub_p = submitted_probs.get(key, 0.0)
        tgt_p = target_probs.get(key, 0.0)
        error = abs(sub_p - tgt_p)
        total_error += error
        if error > tolerance:
            mismatches.append(f"|{key}⟩: expected {tgt_p:.3f}, got {sub_p:.3f} (Δ={error:.3f})")

    # Similarity: 1 - normalized total variation distance
    similarity = max(0.0, 1.0 - total_error / 2.0)
    all_ok = len(mismatches) == 0

    return similarity, all_ok, mismatches


def evaluate_statevector(
    submitted_result: CircuitResult,
    spec: ChallengeSpec,
    gate_count: int,
) -> EvaluationResult:
    """Evaluate using statevector fidelity."""
    if spec.target_statevector is None:
        return EvaluationResult(
            passed=False,
            score=0.0,
            feedback="Challenge spec error: no target statevector defined.",
            details={},
        )

    fidelity = _statevector_fidelity(submitted_result.statevector, spec.target_statevector)

    passed = fidelity >= (1.0 - spec.tolerance)

    # Check gate count constraint
    gate_msg = ""
    if spec.max_gates is not None and gate_count > spec.max_gates:
        passed = False
        gate_msg = f" Used {gate_count} gates (max {spec.max_gates})."

    if passed:
        feedback = f"✅ Correct! Fidelity: {fidelity:.4f} (≥ {1.0 - spec.tolerance:.2f}).{gate_msg}"
    else:
        feedback = (
            f"❌ Not quite. Fidelity: {fidelity:.4f} (need ≥ {1.0 - spec.tolerance:.2f}).{gate_msg}"
        )

    return EvaluationResult(
        passed=passed,
        score=fidelity,
        feedback=feedback,
        details={"fidelity": fidelity, "gate_count": gate_count},
    )


def evaluate_probability(
    submitted_result: CircuitResult,
    spec: ChallengeSpec,
    gate_count: int,
) -> EvaluationResult:
    """Evaluate using probability distribution match."""
    if spec.target_probabilities is None:
        return EvaluationResult(
            passed=False,
            score=0.0,
            feedback="Challenge spec error: no target probabilities defined.",
            details={},
        )

    similarity, all_ok, mismatches = _probability_similarity(
        submitted_result.probabilities, spec.target_probabilities, spec.tolerance
    )

    passed = all_ok

    # Check gate count constraint
    gate_msg = ""
    if spec.max_gates is not None and gate_count > spec.max_gates:
        passed = False
        gate_msg = f" Used {gate_count} gates (max {spec.max_gates})."

    if passed:
        feedback = f"✅ Correct! All probabilities within tolerance ε={spec.tolerance}.{gate_msg}"
    else:
        mismatch_str = "; ".join(mismatches[:3])  # show up to 3
        feedback = f"❌ Not quite. Mismatches: {mismatch_str}{gate_msg}"

    return EvaluationResult(
        passed=passed,
        score=similarity,
        feedback=feedback,
        details={
            "similarity": similarity,
            "mismatches": mismatches,
            "gate_count": gate_count,
        },
    )


def evaluate_equivalence(
    submitted_result: CircuitResult,
    target_result: CircuitResult,
    spec: ChallengeSpec,
    gate_count: int,
) -> EvaluationResult:
    """Evaluate using circuit equivalence (same output statevector, fewer gates)."""
    fidelity = _statevector_fidelity(submitted_result.statevector, target_result.statevector)

    equivalent = fidelity >= (1.0 - spec.tolerance)

    passed = equivalent
    gate_msg = ""
    if spec.max_gates is not None:
        if gate_count > spec.max_gates:
            passed = False
            gate_msg = f" Used {gate_count} gates (max {spec.max_gates})."
        else:
            gate_msg = f" Used {gate_count}/{spec.max_gates} gates — nice!"

    if passed:
        feedback = f"✅ Equivalent circuit! Fidelity: {fidelity:.4f}.{gate_msg}"
    elif not equivalent:
        feedback = f"❌ Circuits not equivalent. Fidelity: {fidelity:.4f}.{gate_msg}"
    else:
        feedback = f"❌ Circuit is equivalent but uses too many gates.{gate_msg}"

    return EvaluationResult(
        passed=passed,
        score=fidelity,
        feedback=feedback,
        details={
            "fidelity": fidelity,
            "equivalent": equivalent,
            "gate_count": gate_count,
            "max_gates": spec.max_gates,
        },
    )
