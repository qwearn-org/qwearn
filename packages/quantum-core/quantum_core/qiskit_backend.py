"""
QiskitBackend — Qiskit/Aer implementation of the QuantumBackend interface.

This is the first (and currently only) concrete backend. It translates
framework-agnostic CircuitSpec objects into Qiskit QuantumCircuits, runs
them on the Aer simulator, and packages the results as CircuitResult.

ARCHITECTURE:
    The flow is:
        CircuitSpec (JSON from frontend)
        → _build_circuit() → Qiskit QuantumCircuit
        → Aer StatevectorSimulator → raw statevector (numpy complex array)
        → _extract_results() → CircuitResult (JSON to frontend)

    Code generation (_generate_code) happens in parallel — it produces
    a valid Python string that, if run standalone, would reproduce the
    same circuit. This is a key learning feature: the user sees real
    Qiskit code, not pseudocode.

CONVENTIONS (Nielsen & Chuang):
    - Qubit ordering: LSB = qubit 0 (native Qiskit convention, no remapping needed)
    - Statevector: computational basis ordered |0...0⟩ to |1...1⟩
    - Phase gate P(θ): diagonal matrix diag(1, e^{iθ}), N&C §4.2
    - CNOT/CX: control=qubits[0], target=qubits[1]
    - Toffoli/CCX: controls=qubits[0:2], target=qubits[2]

REFERENCES:
    - Nielsen & Chuang, §4.2 (single-qubit gates), §4.6 (controlled gates)
    - Qiskit Aer docs: https://qiskit.github.io/qiskit-aer/
"""

from __future__ import annotations

import math
from typing import Any

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator

from quantum_core.backend import (
    BlochCoordinates,
    CircuitResult,
    CircuitSpec,
    GateName,
    GateSpec,
    QuantumBackend,
    StepResult,
)


class QiskitBackend(QuantumBackend):
    """
    Qiskit + Aer implementation of the QuantumBackend interface.

    Uses the AerSimulator with the 'statevector' method to get exact
    statevectors (no sampling noise), and optionally with 'qasm_simulator'
    for shot-based measurement counts.
    """

    @property
    def name(self) -> str:
        return "qiskit-aer"

    # ------------------------------------------------------------------
    # Public API (implements QuantumBackend)
    # ------------------------------------------------------------------

    def execute(
        self,
        circuit: CircuitSpec,
        shots: int = 1024,
    ) -> CircuitResult:
        """
        Execute a circuit specification and return full results.

        Steps:
        1. Validate the circuit spec
        2. Build a Qiskit QuantumCircuit from the spec
        3. Run on Aer statevector simulator to get exact amplitudes
        4. Optionally run with measurements to get shot-based counts
        5. Generate the equivalent Qiskit source code
        6. Package everything into a CircuitResult
        """
        # 1. Validate
        errors = self.validate_circuit(circuit)
        if errors:
            raise ValueError(f"Invalid circuit: {'; '.join(errors)}")

        # 2. Build the Qiskit circuit (no measurements — for statevector)
        qc = self._build_circuit(circuit)

        # 3. Run statevector calculation
        sv_obj = Statevector.from_instruction(qc)
        sv_array = np.array(sv_obj.data)
        statevector = [[float(c.real), float(c.imag)] for c in sv_array]

        # Compute probabilities from statevector
        probs = {}
        for i, amp in enumerate(sv_array):
            prob = float(abs(amp) ** 2)
            if prob > 1e-10:  # Only include non-zero probabilities
                basis_state = format(i, f"0{circuit.num_qubits}b")
                probs[basis_state] = round(prob, 10)

        # 4. Shot-based measurement counts (optional)
        counts: dict[str, int] = {}
        if shots > 0:
            qc_meas = qc.copy()
            num_classical = circuit.num_classical_bits or circuit.num_qubits
            qc_meas.measure(list(range(circuit.num_qubits)), list(range(num_classical)))

            qasm_sim = AerSimulator(method="automatic")
            result_meas = qasm_sim.run(qc_meas, shots=shots).result()
            raw_counts = result_meas.get_counts(qc_meas)
            counts = {str(k): int(v) for k, v in raw_counts.items()}

        # 5. Generate code
        generated_code = self._generate_code(circuit)

        # 6. Package result
        return CircuitResult(
            statevector=statevector,
            probabilities=probs,
            counts=counts,
            generated_code=generated_code,
            backend_name=self.name,
        )

    def execute_steps(
        self,
        circuit: CircuitSpec,
    ) -> list[StepResult]:
        """
        Execute a circuit gate-by-gate, returning intermediate states.
        Step 0 is the initial state (all |0⟩).
        Subsequent steps show state after each gate application.
        """
        errors = self.validate_circuit(circuit)
        if errors:
            raise ValueError(f"Invalid circuit: {'; '.join(errors)}")

        results: list[StepResult] = []

        def _get_step_data(qc: QuantumCircuit) -> tuple[list[list[float]], dict[str, float]]:
            sv_obj = Statevector.from_instruction(qc)
            sv_raw = np.array(sv_obj.data)
            sv = [[float(c.real), float(c.imag)] for c in sv_raw]
            probs = {}
            for i, amp in enumerate(sv_raw):
                prob = float(abs(amp) ** 2)
                if prob > 1e-10:
                    basis_state = format(i, f"0{circuit.num_qubits}b")
                    probs[basis_state] = round(prob, 10)
            return sv, probs

        # Step 0: initial state
        num_classical = circuit.num_classical_bits or circuit.num_qubits
        qc = QuantumCircuit(circuit.num_qubits, num_classical)
        sv0, probs0 = _get_step_data(qc)
        results.append(
            StepResult(
                step_index=0,
                gate_name=None,
                gate_qubits=[],
                statevector=sv0,
                probabilities=probs0,
            )
        )

        gate_map = {
            GateName.X: lambda q, gs: q.x(gs.qubits[0]),
            GateName.Y: lambda q, gs: q.y(gs.qubits[0]),
            GateName.Z: lambda q, gs: q.z(gs.qubits[0]),
            GateName.H: lambda q, gs: q.h(gs.qubits[0]),
            GateName.S: lambda q, gs: q.s(gs.qubits[0]),
            GateName.T: lambda q, gs: q.t(gs.qubits[0]),
            GateName.PHASE: lambda q, gs: q.p(gs.params["theta"], gs.qubits[0]),
            GateName.CX: lambda q, gs: q.cx(gs.qubits[0], gs.qubits[1]),
            GateName.CZ: lambda q, gs: q.cz(gs.qubits[0], gs.qubits[1]),
            GateName.CCX: lambda q, gs: q.ccx(gs.qubits[0], gs.qubits[1], gs.qubits[2]),
            GateName.SWAP: lambda q, gs: q.swap(gs.qubits[0], gs.qubits[1]),
        }

        for idx, gate_spec in enumerate(circuit.gates, start=1):
            handler = gate_map.get(gate_spec.gate)
            if handler is None:
                raise ValueError(f"Unsupported gate: {gate_spec.gate}")
            handler(qc, gate_spec)
            sv, probs = _get_step_data(qc)
            results.append(
                StepResult(
                    step_index=idx,
                    gate_name=gate_spec.gate.value,
                    gate_qubits=gate_spec.qubits,
                    statevector=sv,
                    probabilities=probs,
                )
            )

        return results

    def get_bloch_coordinates(
        self,
        statevector: list[list[float]],
        num_qubits: int,
    ) -> list[BlochCoordinates]:
        """
        Compute Bloch sphere coordinates for each qubit.

        For each qubit, we compute the reduced density matrix by tracing
        out all other qubits, then convert to Bloch coordinates using:
            x = Tr(ρ·σ_x),  y = Tr(ρ·σ_y),  z = Tr(ρ·σ_z)

        where σ_x, σ_y, σ_z are the Pauli matrices.

        For a pure single-qubit state |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ}sin(θ/2)|1⟩:
            x = sin(θ)cos(φ)
            y = sin(θ)sin(φ)
            z = cos(θ)

        For entangled states, the reduced density matrix gives a mixed state
        and the Bloch vector length will be < 1 (inside the sphere).

        Reference: Nielsen & Chuang §1.2, §2.4.3 (partial trace)
        """
        # Convert [[real, imag], ...] back to complex numpy array
        sv = np.array([complex(r, i) for r, i in statevector])

        results = []
        for qubit_idx in range(num_qubits):
            # Compute reduced density matrix for this qubit
            rho = self._partial_trace_single_qubit(sv, num_qubits, qubit_idx)

            # Pauli matrices
            # σ_x = [[0, 1], [1, 0]]
            # σ_y = [[0, -i], [i, 0]]
            # σ_z = [[1, 0], [0, -1]]
            x = float(np.real(rho[0, 1] + rho[1, 0]))
            y = float(np.real(1j * (rho[0, 1] - rho[1, 0])))
            z = float(np.real(rho[0, 0] - rho[1, 1]))

            # Clamp to [-1, 1] to handle floating point errors
            x = max(-1.0, min(1.0, x))
            y = max(-1.0, min(1.0, y))
            z = max(-1.0, min(1.0, z))

            # Convert to spherical coordinates
            r = math.sqrt(x**2 + y**2 + z**2)
            if r < 1e-10:
                theta = 0.0
                phi = 0.0
            else:
                theta = math.acos(max(-1.0, min(1.0, z / r)))
                phi = math.atan2(y, x) % (2 * math.pi)

            results.append(
                BlochCoordinates(
                    qubit_index=qubit_idx,
                    x=x,
                    y=y,
                    z=z,
                    theta=theta,
                    phi=phi,
                )
            )

        return results

    def validate_circuit(self, circuit: CircuitSpec) -> list[str]:
        """
        Validate a circuit specification without executing it.

        Checks:
        1. All qubit indices are within [0, num_qubits)
        2. Each gate has the correct number of qubit operands
        3. No duplicate qubits in a single gate application
        4. Required parameters are present (e.g., angle for Phase gate)
        """
        errors = []
        gate_qubit_counts = {
            GateName.X: 1, GateName.Y: 1, GateName.Z: 1,
            GateName.H: 1, GateName.S: 1, GateName.T: 1,
            GateName.PHASE: 1,
            GateName.CX: 2, GateName.CZ: 2, GateName.SWAP: 2,
            GateName.CCX: 3,
        }

        for idx, gate_spec in enumerate(circuit.gates):
            prefix = f"Gate {idx} ({gate_spec.gate.value})"

            # Check qubit bounds
            for q in gate_spec.qubits:
                if q < 0 or q >= circuit.num_qubits:
                    errors.append(
                        f"{prefix}: qubit index {q} out of range "
                        f"[0, {circuit.num_qubits})"
                    )

            # Check qubit count
            expected = gate_qubit_counts.get(gate_spec.gate)
            if expected is not None and len(gate_spec.qubits) != expected:
                errors.append(
                    f"{prefix}: expected {expected} qubit(s), "
                    f"got {len(gate_spec.qubits)}"
                )

            # Check for duplicate qubits
            if len(gate_spec.qubits) != len(set(gate_spec.qubits)):
                errors.append(
                    f"{prefix}: duplicate qubit indices {gate_spec.qubits}"
                )

            # Check required parameters
            if gate_spec.gate == GateName.PHASE and "theta" not in gate_spec.params:
                errors.append(
                    f"{prefix}: Phase gate requires 'theta' parameter"
                )

        return errors

    def supported_gates(self) -> list[dict[str, Any]]:
        """
        Return metadata about all gates this backend supports.

        Used by the frontend to populate the gate palette and tooltips.
        """
        return [
            {
                "name": GateName.X.value,
                "display_name": "Pauli-X",
                "num_qubits": 1,
                "has_params": False,
                "description": "Bit flip gate. Swaps |0⟩ and |1⟩. Also called the NOT gate.",
                "matrix": "[[0, 1], [1, 0]]",
                "category": "pauli",
            },
            {
                "name": GateName.Y.value,
                "display_name": "Pauli-Y",
                "num_qubits": 1,
                "has_params": False,
                "description": "Combined bit and phase flip. Y = iXZ.",
                "matrix": "[[0, -i], [i, 0]]",
                "category": "pauli",
            },
            {
                "name": GateName.Z.value,
                "display_name": "Pauli-Z",
                "num_qubits": 1,
                "has_params": False,
                "description": "Phase flip gate. Leaves |0⟩ unchanged, maps |1⟩ to -|1⟩.",
                "matrix": "[[1, 0], [0, -1]]",
                "category": "pauli",
            },
            {
                "name": GateName.H.value,
                "display_name": "Hadamard",
                "num_qubits": 1,
                "has_params": False,
                "description": (
                    "Creates equal superposition. "
                    "H|0⟩ = (|0⟩+|1⟩)/√2, H|1⟩ = (|0⟩-|1⟩)/√2."
                ),
                "matrix": "1/√2 · [[1, 1], [1, -1]]",
                "category": "common",
            },
            {
                "name": GateName.S.value,
                "display_name": "S Gate",
                "num_qubits": 1,
                "has_params": False,
                "description": "Phase gate with θ=π/2. Also called √Z. S² = Z.",
                "matrix": "[[1, 0], [0, i]]",
                "category": "phase",
            },
            {
                "name": GateName.T.value,
                "display_name": "T Gate",
                "num_qubits": 1,
                "has_params": False,
                "description": "Phase gate with θ=π/4. Also called √S. T² = S.",
                "matrix": "[[1, 0], [0, e^(iπ/4)]]",
                "category": "phase",
            },
            {
                "name": GateName.PHASE.value,
                "display_name": "Phase (P)",
                "num_qubits": 1,
                "has_params": True,
                "description": (
                    "General phase rotation P(θ). Leaves |0⟩ unchanged, "
                    "maps |1⟩ to e^(iθ)|1⟩. S = P(π/2), T = P(π/4), Z = P(π)."
                ),
                "matrix": "[[1, 0], [0, e^(iθ)]]",
                "params": [{"name": "theta", "type": "float", "description": "Phase angle in radians"}],
                "category": "phase",
            },
            {
                "name": GateName.CX.value,
                "display_name": "CNOT",
                "num_qubits": 2,
                "has_params": False,
                "description": (
                    "Controlled-NOT. Flips the target qubit if the control "
                    "qubit is |1⟩. Fundamental for creating entanglement."
                ),
                "qubit_roles": ["control", "target"],
                "category": "entangling",
            },
            {
                "name": GateName.CZ.value,
                "display_name": "Controlled-Z",
                "num_qubits": 2,
                "has_params": False,
                "description": (
                    "Controlled-Z. Applies Z to target if control is |1⟩. "
                    "Symmetric: CZ is the same regardless of which qubit is 'control'."
                ),
                "qubit_roles": ["control", "target"],
                "category": "entangling",
            },
            {
                "name": GateName.CCX.value,
                "display_name": "Toffoli",
                "num_qubits": 3,
                "has_params": False,
                "description": (
                    "Double-controlled NOT (Toffoli gate). Flips the target "
                    "qubit only if both control qubits are |1⟩. Universal "
                    "for classical reversible computation."
                ),
                "qubit_roles": ["control1", "control2", "target"],
                "category": "entangling",
            },
            {
                "name": GateName.SWAP.value,
                "display_name": "SWAP",
                "num_qubits": 2,
                "has_params": False,
                "description": "Swaps the states of two qubits.",
                "qubit_roles": ["qubit_a", "qubit_b"],
                "category": "common",
            },
        ]

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_circuit(self, spec: CircuitSpec) -> QuantumCircuit:
        """
        Translate a CircuitSpec into a Qiskit QuantumCircuit.

        This is the core translation layer. Each GateSpec maps to
        exactly one Qiskit gate method call.
        """
        num_classical = spec.num_classical_bits or spec.num_qubits
        qc = QuantumCircuit(spec.num_qubits, num_classical)

        gate_map = {
            GateName.X: lambda qc, gs: qc.x(gs.qubits[0]),
            GateName.Y: lambda qc, gs: qc.y(gs.qubits[0]),
            GateName.Z: lambda qc, gs: qc.z(gs.qubits[0]),
            GateName.H: lambda qc, gs: qc.h(gs.qubits[0]),
            GateName.S: lambda qc, gs: qc.s(gs.qubits[0]),
            GateName.T: lambda qc, gs: qc.t(gs.qubits[0]),
            GateName.PHASE: lambda qc, gs: qc.p(gs.params["theta"], gs.qubits[0]),
            GateName.CX: lambda qc, gs: qc.cx(gs.qubits[0], gs.qubits[1]),
            GateName.CZ: lambda qc, gs: qc.cz(gs.qubits[0], gs.qubits[1]),
            GateName.CCX: lambda qc, gs: qc.ccx(gs.qubits[0], gs.qubits[1], gs.qubits[2]),
            GateName.SWAP: lambda qc, gs: qc.swap(gs.qubits[0], gs.qubits[1]),
        }

        for gate_spec in spec.gates:
            handler = gate_map.get(gate_spec.gate)
            if handler is None:
                raise ValueError(f"Unsupported gate: {gate_spec.gate}")
            handler(qc, gate_spec)

        return qc

    def _generate_code(self, spec: CircuitSpec) -> str:
        """
        Generate valid Qiskit Python source code that reproduces the circuit.

        The generated code is intended to be copy-pasteable into a Jupyter
        notebook or Python script. It includes:
        - Imports
        - Circuit construction
        - Simulation with Aer
        - Results extraction

        This is a key learning feature: users see real code, not pseudocode.
        """
        lines = [
            "from qiskit import QuantumCircuit",
            "from qiskit_aer import AerSimulator",
            "",
            f"# Create a {spec.num_qubits}-qubit circuit",
            f"qc = QuantumCircuit({spec.num_qubits})",
            "",
        ]

        gate_code_map = {
            GateName.X: lambda gs: f"qc.x({gs.qubits[0]})",
            GateName.Y: lambda gs: f"qc.y({gs.qubits[0]})",
            GateName.Z: lambda gs: f"qc.z({gs.qubits[0]})",
            GateName.H: lambda gs: f"qc.h({gs.qubits[0]})",
            GateName.S: lambda gs: f"qc.s({gs.qubits[0]})",
            GateName.T: lambda gs: f"qc.t({gs.qubits[0]})",
            GateName.PHASE: lambda gs: f"qc.p({gs.params['theta']}, {gs.qubits[0]})",
            GateName.CX: lambda gs: f"qc.cx({gs.qubits[0]}, {gs.qubits[1]})  # CNOT: control={gs.qubits[0]}, target={gs.qubits[1]}",
            GateName.CZ: lambda gs: f"qc.cz({gs.qubits[0]}, {gs.qubits[1]})",
            GateName.CCX: lambda gs: f"qc.ccx({gs.qubits[0]}, {gs.qubits[1]}, {gs.qubits[2]})  # Toffoli",
            GateName.SWAP: lambda gs: f"qc.swap({gs.qubits[0]}, {gs.qubits[1]})",
        }

        if spec.gates:
            lines.append("# Apply gates")
            for gate_spec in spec.gates:
                code_gen = gate_code_map.get(gate_spec.gate)
                if code_gen:
                    lines.append(code_gen(gate_spec))
            lines.append("")

        lines.extend([
            "# Simulate",
            "qc.save_statevector()",
            "simulator = AerSimulator(method='statevector')",
            "result = simulator.run(qc).result()",
            "statevector = result.get_statevector(qc)",
            "",
            "# Print results",
            "print('Statevector:', statevector)",
            "print('Probabilities:', statevector.probabilities_dict())",
        ])

        return "\n".join(lines)

    @staticmethod
    def _partial_trace_single_qubit(
        statevector: np.ndarray,
        num_qubits: int,
        qubit_idx: int,
    ) -> np.ndarray:
        """
        Compute the reduced density matrix for a single qubit by tracing
        out all other qubits.

        The approach:
        1. Reshape the statevector into a tensor with one axis per qubit
        2. Compute the full density matrix ρ = |ψ⟩⟨ψ|
        3. Trace out all axes except the target qubit

        Note on qubit ordering: Qiskit uses LSB = qubit 0, so qubit 0
        corresponds to the LAST axis in the tensor (axis num_qubits-1).
        We must account for this when reshaping.

        Reference: Nielsen & Chuang §2.4.3 (partial trace)
        """
        # Reshape statevector into tensor: one axis per qubit
        # Qiskit convention: qubit 0 = last axis (LSB)
        psi = statevector.reshape([2] * num_qubits)

        # The tensor axis for qubit_idx in Qiskit's LSB convention:
        # qubit 0 → axis (num_qubits - 1), qubit 1 → axis (num_qubits - 2), etc.
        tensor_axis = num_qubits - 1 - qubit_idx

        # Compute reduced density matrix by contracting all other axes
        # ρ_qubit[i, j] = Σ_{other indices} ψ[..., i, ...] · ψ*[..., j, ...]
        rho = np.zeros((2, 2), dtype=complex)

        for i in range(2):
            for j in range(2):
                # Select slice where target qubit = i (for ψ) and j (for ψ*)
                # Use np.take to select along the target axis
                slice_i = np.take(psi, i, axis=tensor_axis)
                slice_j = np.take(psi, j, axis=tensor_axis)

                # Contract (dot product over all remaining indices)
                rho[i, j] = np.sum(slice_i * np.conj(slice_j))

        return rho
