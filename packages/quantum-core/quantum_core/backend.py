"""
QuantumBackend — Abstract interface for quantum circuit execution.

PURPOSE:
    This module defines the contract that ALL quantum execution backends
    must implement. Today only Qiskit is supported, but the architecture
    is deliberately plugin-shaped so that Cirq, PennyLane, or any other
    SDK can be added later without touching the API layer.

    See IMPLEMENTATION_PLAN.md §2.4 and docs/adr/ADR-0005-quantum-backend-interface.md.

DESIGN DECISIONS:
    1. The interface operates on a "circuit spec" — a framework-agnostic
       description of a quantum circuit as a list of gates with qubit indices.
       This keeps the API layer SDK-independent.

    2. Results are returned as Pydantic models (CircuitResult), not raw
       Qiskit/Cirq objects, so the API layer never imports a specific SDK.

    3. The interface is synchronous by default. If a backend needs async
       execution (e.g., real hardware queues), it should override with
       an async variant. The API layer will handle both cases.

CONVENTIONS:
    - Gate names follow standard textbook notation (Nielsen & Chuang):
        - Single-qubit: X, Y, Z, H, S, T, Rx, Ry, Rz, Phase (= P gate)
        - Multi-qubit: CX (= CNOT), CZ, CCX (= Toffoli), SWAP
    - Qubit indices are 0-based.
    - Statevectors use the computational basis ordering |0...0⟩ to |1...1⟩,
      with qubit 0 as the LEAST significant bit (Qiskit convention).
      This is documented explicitly because Cirq uses the opposite convention,
      and any future Cirq backend must handle the translation.

REFERENCES:
    - Nielsen & Chuang, "Quantum Computation and Quantum Information", §4.2 (gates)
    - Qiskit docs: https://docs.quantum.ibm.com/api/qiskit/circuit
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Data Models (framework-agnostic)
# ---------------------------------------------------------------------------


class GateName(str, Enum):
    """
    Supported quantum gate names.

    Each gate maps to a standard unitary operation. The enum values
    are the canonical names used in circuit specs sent from the frontend.

    Single-qubit gates:
        X  — Pauli-X (bit flip): |0⟩↔|1⟩
        Y  — Pauli-Y: combines bit flip and phase flip
        Z  — Pauli-Z (phase flip): |1⟩ → -|1⟩
        H  — Hadamard: creates equal superposition
        S  — S gate (√Z): phase of π/2 on |1⟩
        T  — T gate (√S): phase of π/4 on |1⟩
        Phase — General phase gate P(θ): phase of θ on |1⟩

    Multi-qubit gates:
        CX  — Controlled-X (CNOT): flips target if control is |1⟩
        CZ  — Controlled-Z: applies Z to target if control is |1⟩
        CCX — Toffoli (double-controlled X): flips target if both controls are |1⟩
        SWAP — Swaps two qubits
    """

    # Single-qubit gates
    X = "X"
    Y = "Y"
    Z = "Z"
    H = "H"
    S = "S"
    T = "T"
    PHASE = "Phase"

    # Multi-qubit gates
    CX = "CX"
    CZ = "CZ"
    CCX = "CCX"
    SWAP = "SWAP"


class GateSpec(BaseModel):
    """
    A single gate application in a circuit.

    This is the atomic unit of a circuit specification. The frontend
    sends a list of these to describe the circuit the user has built.

    Attributes:
        gate: Which gate to apply (from the GateName enum).
        qubits: Which qubit(s) to apply it to. Order matters for
                multi-qubit gates — e.g., for CX, qubits=[0, 1]
                means qubit 0 is control, qubit 1 is target.
        params: Gate parameters (e.g., rotation angle for Phase gate).
                Empty dict for parameter-free gates like X, H, CNOT.
    """

    gate: GateName
    qubits: list[int] = Field(..., min_length=1, max_length=3)
    params: dict[str, float] = Field(default_factory=dict)


class CircuitSpec(BaseModel):
    """
    A complete circuit specification — the input to any QuantumBackend.

    This is what the API receives from the frontend's circuit builder.
    It is deliberately framework-agnostic: no Qiskit QuantumCircuit objects,
    no Cirq moment structures — just a flat list of gates and a qubit count.

    Attributes:
        num_qubits: Total number of qubits in the circuit.
        gates: Ordered list of gate applications.
        num_classical_bits: Number of classical bits for measurement.
                           Defaults to num_qubits if not specified.
    """

    num_qubits: int = Field(..., ge=1, le=20)
    gates: list[GateSpec]
    num_classical_bits: int | None = None


class CircuitResult(BaseModel):
    """
    The output of executing a circuit — returned by any QuantumBackend.

    This is what the API sends back to the frontend. It contains everything
    needed to render the results panel: probabilities for the bar chart,
    statevector for the mathematical display, and generated source code.

    Attributes:
        statevector: Complex amplitudes as [real, imag] pairs, indexed by
                     computational basis state. Length = 2^num_qubits.
                     Example for 1 qubit after H gate: [[0.707, 0.0], [0.707, 0.0]]
        probabilities: Measurement probability for each basis state.
                      Keys are binary strings like "00", "01", "10", "11".
        counts: Simulated measurement counts (if shots > 0).
                Keys are binary strings, values are counts.
        generated_code: Source code in the backend's SDK that reproduces
                       this circuit. For Qiskit, this is valid Python.
        backend_name: Which backend produced this result (e.g., "qiskit-aer").
    """

    statevector: list[list[float]] = Field(
        ...,
        description="Complex amplitudes as [real, imag] pairs",
    )
    probabilities: dict[str, float]
    counts: dict[str, int] = Field(default_factory=dict)
    generated_code: str
    backend_name: str


class StepResult(BaseModel):
    """
    Result of a single step in step-through execution.

    Used by the Quantum Algorithms module to show how the quantum
    state evolves gate by gate. Each StepResult captures the state
    of the system after applying one gate.

    Attributes:
        step_index: 0-based index of this step (0 = initial state before any gates).
        gate_name: Name of the gate just applied (None for step 0 = initial state).
        gate_qubits: Qubits the gate was applied to.
        statevector: Complex amplitudes after this step.
        probabilities: Measurement probabilities after this step.
    """

    step_index: int
    gate_name: str | None = None
    gate_qubits: list[int] = Field(default_factory=list)
    statevector: list[list[float]]
    probabilities: dict[str, float]


class BlochCoordinates(BaseModel):
    """
    Bloch sphere coordinates for a single qubit.

    The Bloch sphere is a geometric representation of a single-qubit
    pure state. Any single-qubit state |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
    maps to the point (x, y, z) on the unit sphere where:
        x = sin(θ)cos(φ)
        y = sin(θ)sin(φ)
        z = cos(θ)

    Reference: Nielsen & Chuang §1.2, "The Bloch sphere"

    Attributes:
        qubit_index: Which qubit this represents.
        x, y, z: Cartesian coordinates on the Bloch sphere, each in [-1, 1].
        theta: Polar angle in radians [0, π].
        phi: Azimuthal angle in radians [0, 2π).
    """

    qubit_index: int
    x: float = Field(..., ge=-1.0, le=1.0)
    y: float = Field(..., ge=-1.0, le=1.0)
    z: float = Field(..., ge=-1.0, le=1.0)
    theta: float = Field(..., ge=0.0)
    phi: float = Field(..., ge=0.0)


# ---------------------------------------------------------------------------
# Abstract Backend Interface
# ---------------------------------------------------------------------------


class QuantumBackend(ABC):
    """
    Abstract interface for quantum circuit execution.

    Any quantum SDK integration (Qiskit, Cirq, PennyLane, etc.) must
    subclass this and implement all abstract methods. The API layer
    calls ONLY these methods — it never imports SDK-specific modules.

    This is the central architectural seam that makes the platform
    SDK-agnostic. See docs/adr/ADR-0005-quantum-backend-interface.md
    for the full rationale.

    Lifecycle:
        1. API receives a CircuitSpec from the frontend
        2. API passes it to backend.execute(spec)
        3. Backend translates spec → native circuit, runs it, returns CircuitResult
        4. API returns CircuitResult to the frontend

    Implementations:
        - QiskitBackend (packages/quantum-core/quantum_core/qiskit_backend.py)
        - Future: CirqBackend, PennyLaneBackend (Phase 9)
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """
        Human-readable name for this backend (e.g., "qiskit-aer").
        Used in CircuitResult.backend_name and logging.
        """
        ...

    @abstractmethod
    def execute(
        self,
        circuit: CircuitSpec,
        shots: int = 1024,
    ) -> CircuitResult:
        """
        Execute a circuit and return the results.

        This is the primary method. It must:
        1. Translate the CircuitSpec into the native SDK's circuit object
        2. Run it on the backend's simulator
        3. Extract statevector, probabilities, and measurement counts
        4. Generate the equivalent source code as a string
        5. Package everything into a CircuitResult

        Args:
            circuit: Framework-agnostic circuit specification.
            shots: Number of measurement shots for sampling.
                   Use 0 to skip measurement sampling (statevector only).

        Returns:
            CircuitResult with all execution outputs.

        Raises:
            ValueError: If the circuit spec is invalid (e.g., gate applied
                       to a qubit index >= num_qubits).
            RuntimeError: If the simulation fails.
        """
        ...

    @abstractmethod
    def get_bloch_coordinates(
        self,
        statevector: list[list[float]],
        num_qubits: int,
    ) -> list[BlochCoordinates]:
        """
        Compute Bloch sphere coordinates for each qubit from a statevector.

        This performs a partial trace for each qubit to extract the
        reduced density matrix, then converts to Bloch coordinates.

        Note: Bloch coordinates are only fully meaningful for single-qubit
        states. For entangled multi-qubit states, the reduced density matrix
        gives a mixed state, and the Bloch vector will be inside the sphere
        (length < 1). This is physically correct and should be communicated
        to the learner in the UI.

        Args:
            statevector: Complex amplitudes as [real, imag] pairs.
            num_qubits: Number of qubits in the system.

        Returns:
            List of BlochCoordinates, one per qubit.
        """
        ...

    @abstractmethod
    def validate_circuit(self, circuit: CircuitSpec) -> list[str]:
        """
        Validate a circuit spec without executing it.

        Returns a list of human-readable error messages. An empty list
        means the circuit is valid. This is called before execute() to
        give the user immediate feedback in the circuit builder.

        Common validations:
        - Qubit indices are within [0, num_qubits)
        - Multi-qubit gates have the correct number of qubits
        - Required parameters are present (e.g., angle for Phase gate)
        - No duplicate qubit indices in a single gate application

        Args:
            circuit: The circuit spec to validate.

        Returns:
            List of error messages (empty if valid).
        """
        ...

    @abstractmethod
    def supported_gates(self) -> list[dict[str, Any]]:
        """
        Return metadata about all gates this backend supports.

        Used by the frontend to populate the gate palette and show
        gate documentation tooltips.

        Each dict should contain at minimum:
        - name: GateName value
        - display_name: Human-friendly name (e.g., "Hadamard")
        - num_qubits: How many qubits this gate acts on
        - has_params: Whether the gate takes parameters
        - description: Short description for UI tooltip

        Returns:
            List of gate metadata dictionaries.
        """
        ...

    @abstractmethod
    def execute_steps(
        self,
        circuit: CircuitSpec,
    ) -> list["StepResult"]:
        """
        Execute a circuit gate-by-gate, returning intermediate states.

        This is used by the Quantum Algorithms module to animate
        step-through execution. Step 0 is the initial state (all |0⟩),
        and each subsequent step shows the state after one more gate.

        Args:
            circuit: Framework-agnostic circuit specification.

        Returns:
            List of StepResult objects, length = len(gates) + 1
            (initial state + one per gate).
        """
        ...
