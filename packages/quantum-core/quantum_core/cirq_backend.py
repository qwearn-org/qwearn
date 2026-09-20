"""
CirqBackend — QuantumBackend implementation for Google's Cirq framework.

PURPOSE:
    Implements circuit execution, statevector simulation, Bloch coordinate extraction,
    and Python code generation using Google's Cirq SDK.

DESIGN DECISIONS:
    1. Operates on LineQubits (cirq.LineQubit.range(num_qubits)).
    2. Translates Cirq's MSB statevector ordering into the platform's canonical
       LSB basis vector ordering (|0...0⟩ to |1...1⟩) for 100% consistency with Qiskit.
    3. Generates readable, executable Cirq Python source code as string.
"""

from __future__ import annotations

import math
from typing import Any

import cirq
import numpy as np

from quantum_core.backend import (
    BlochCoordinates,
    CircuitResult,
    CircuitSpec,
    GateName,
    GateSpec,
    QuantumBackend,
    StepResult,
)


class CirqBackend(QuantumBackend):
    """
    Quantum execution backend using Google Cirq and Cirq Simulator.
    """

    @property
    def name(self) -> str:
        return "cirq-simulator"

    def execute(self, circuit: CircuitSpec, shots: int = 1024) -> CircuitResult:
        """Execute a circuit spec on the Cirq simulator."""
        errors = self.validate_circuit(circuit)
        if errors:
            raise ValueError(f"Invalid circuit specification: {'; '.join(errors)}")

        cirq_circuit, qubits = self._build_cirq_circuit(circuit)
        sim = cirq.Simulator()

        # Simulate statevector
        sim_result = sim.simulate(cirq_circuit)
        raw_sv = sim_result.state_vector()
        statevector = self._reorder_statevector_to_lsb(raw_sv, circuit.num_qubits)

        # Probabilities
        probabilities: dict[str, float] = {}
        dim = 1 << circuit.num_qubits
        for idx in range(dim):
            ampl = statevector[idx]
            prob = ampl[0] ** 2 + ampl[1] ** 2
            if prob > 1e-9:
                bitstring = format(idx, f"0{circuit.num_qubits}b")
                probabilities[bitstring] = round(float(prob), 6)

        # Measurement sampling
        counts: dict[str, int] = {}
        if shots > 0 and probabilities:
            states = list(probabilities.keys())
            probs = [probabilities[s] for s in states]
            # normalize probs
            total_p = sum(probs)
            norm_probs = [p / total_p for p in probs]
            samples = np.random.choice(states, size=shots, p=norm_probs)
            for s in samples:
                counts[s] = counts.get(s, 0) + 1

        # Code generation
        generated_code = self._generate_cirq_code(circuit)

        return CircuitResult(
            statevector=statevector,
            probabilities=probabilities,
            counts=counts,
            generated_code=generated_code,
            backend_name=self.name,
        )

    def get_bloch_coordinates(
        self, statevector: list[list[float]], num_qubits: int
    ) -> list[BlochCoordinates]:
        """Extract Bloch coordinates per qubit from LSB statevector."""
        dim = 1 << num_qubits
        sv = np.zeros(dim, dtype=complex)
        for i, (re, im) in enumerate(statevector):
            sv[i] = complex(re, im)

        norm = np.linalg.norm(sv)
        if norm > 0:
            sv = sv / norm

        coords = []
        for q in range(num_qubits):
            # Compute reduced density matrix for qubit q
            rho00 = 0.0 + 0.0j
            rho01 = 0.0 + 0.0j
            rho10 = 0.0 + 0.0j
            rho11 = 0.0 + 0.0j

            for i in range(dim):
                bit_q = (i >> q) & 1
                for j in range(dim):
                    bit_q_j = (j >> q) & 1
                    other_bits_i = i & ~(1 << q)
                    other_bits_j = j & ~(1 << q)
                    if other_bits_i == other_bits_j:
                        term = sv[i] * np.conj(sv[j])
                        if bit_q == 0 and bit_q_j == 0:
                            rho00 += term
                        elif bit_q == 0 and bit_q_j == 1:
                            rho01 += term
                        elif bit_q == 1 and bit_q_j == 0:
                            rho10 += term
                        elif bit_q == 1 and bit_q_j == 1:
                            rho11 += term

            x = float(max(-1.0, min(1.0, 2.0 * rho01.real)))
            y = float(max(-1.0, min(1.0, 2.0 * rho01.imag)))
            z = float(max(-1.0, min(1.0, (rho00 - rho11).real)))

            r = math.sqrt(x**2 + y**2 + z**2)
            if r < 1e-10:
                theta = 0.0
                phi = 0.0
            else:
                theta = math.acos(max(-1.0, min(1.0, z / r)))
                phi = math.atan2(y, x) % (2 * math.pi)

            coords.append(
                BlochCoordinates(
                    qubit_index=q,
                    x=x,
                    y=y,
                    z=z,
                    theta=theta,
                    phi=phi,
                )
            )

        return coords

    def validate_circuit(self, circuit: CircuitSpec) -> list[str]:
        """Validate circuit parameters and bounds."""
        errors = []
        if circuit.num_qubits < 1 or circuit.num_qubits > 20:
            errors.append(f"num_qubits must be between 1 and 20 (got {circuit.num_qubits})")

        gate_qubit_reqs: dict[str, int] = {
            GateName.X: 1,
            GateName.Y: 1,
            GateName.Z: 1,
            GateName.H: 1,
            GateName.S: 1,
            GateName.T: 1,
            GateName.PHASE: 1,
            GateName.CX: 2,
            GateName.CZ: 2,
            GateName.CCX: 3,
            GateName.SWAP: 2,
        }

        for i, g in enumerate(circuit.gates):
            req_qubits = gate_qubit_reqs.get(g.gate)
            if req_qubits is not None and len(g.qubits) != req_qubits:
                errors.append(
                    f"Gate {i} ({g.gate.value}) requires {req_qubits} qubits (got {len(g.qubits)})"
                )

            for q in g.qubits:
                if q < 0 or q >= circuit.num_qubits:
                    errors.append(
                        f"Gate {i} ({g.gate.value}) qubit index {q} out of range [0, {circuit.num_qubits})"
                    )

            if len(g.qubits) != len(set(g.qubits)):
                errors.append(f"Gate {i} ({g.gate.value}) has duplicate qubit indices: {g.qubits}")

            if g.gate == GateName.PHASE and "theta" not in g.params:
                errors.append(f"Gate {i} (Phase) missing required parameter 'theta'")

        return errors

    def supported_gates(self) -> list[dict[str, Any]]:
        """Return metadata for all gates supported by CirqBackend."""
        return [
            {
                "name": GateName.X.value,
                "display_name": "Pauli-X",
                "num_qubits": 1,
                "has_params": False,
                "description": "Bit flip: |0⟩↔|1⟩",
            },
            {
                "name": GateName.Y.value,
                "display_name": "Pauli-Y",
                "num_qubits": 1,
                "has_params": False,
                "description": "Bit and phase flip",
            },
            {
                "name": GateName.Z.value,
                "display_name": "Pauli-Z",
                "num_qubits": 1,
                "has_params": False,
                "description": "Phase flip: |1⟩ → -|1⟩",
            },
            {
                "name": GateName.H.value,
                "display_name": "Hadamard",
                "num_qubits": 1,
                "has_params": False,
                "description": "Equal superposition",
            },
            {
                "name": GateName.S.value,
                "display_name": "S Gate",
                "num_qubits": 1,
                "has_params": False,
                "description": "Phase π/2",
            },
            {
                "name": GateName.T.value,
                "display_name": "T Gate",
                "num_qubits": 1,
                "has_params": False,
                "description": "Phase π/4",
            },
            {
                "name": GateName.PHASE.value,
                "display_name": "Phase P(θ)",
                "num_qubits": 1,
                "has_params": True,
                "description": "Arbitrary phase angle θ",
            },
            {
                "name": GateName.CX.value,
                "display_name": "CNOT (CX)",
                "num_qubits": 2,
                "has_params": False,
                "description": "Controlled-X (entanglement)",
            },
            {
                "name": GateName.CZ.value,
                "display_name": "Controlled-Z",
                "num_qubits": 2,
                "has_params": False,
                "description": "Controlled phase flip",
            },
            {
                "name": GateName.CCX.value,
                "display_name": "Toffoli (CCX)",
                "num_qubits": 3,
                "has_params": False,
                "description": "Double-controlled X",
            },
            {
                "name": GateName.SWAP.value,
                "display_name": "SWAP",
                "num_qubits": 2,
                "has_params": False,
                "description": "Swap states of two qubits",
            },
        ]

    def execute_steps(self, circuit: CircuitSpec) -> list[StepResult]:
        """Execute step-by-step for algorithm animation."""
        steps = []
        n = circuit.num_qubits
        qubits = cirq.LineQubit.range(n)

        # Step 0: initial state
        initial_sv = [[1.0, 0.0]] + [[0.0, 0.0]] * ((1 << n) - 1)
        steps.append(
            StepResult(
                step_index=0,
                gate_name=None,
                gate_qubits=[],
                statevector=initial_sv,
                probabilities={"0" * n: 1.0},
            )
        )

        sub_circuit = cirq.Circuit()
        sim = cirq.Simulator()

        for idx, g in enumerate(circuit.gates):
            op = self._translate_gate(g, qubits)
            sub_circuit.append(op)

            sim_res = sim.simulate(sub_circuit)
            raw_sv = sim_res.state_vector()
            sv = self._reorder_statevector_to_lsb(raw_sv, n)

            probs: dict[str, float] = {}
            for i_b in range(1 << n):
                ampl = sv[i_b]
                p = ampl[0] ** 2 + ampl[1] ** 2
                if p > 1e-9:
                    probs[format(i_b, f"0{n}b")] = round(float(p), 6)

            steps.append(
                StepResult(
                    step_index=idx + 1,
                    gate_name=g.gate.value,
                    gate_qubits=g.qubits,
                    statevector=sv,
                    probabilities=probs,
                )
            )

        return steps

    # --- Internal Helpers ---

    def _build_cirq_circuit(self, circuit: CircuitSpec) -> tuple[cirq.Circuit, list[cirq.LineQubit]]:
        qubits = cirq.LineQubit.range(circuit.num_qubits)
        cirq_circuit = cirq.Circuit()
        for g in circuit.gates:
            op = self._translate_gate(g, qubits)
            cirq_circuit.append(op)
        return cirq_circuit, qubits

    def _translate_gate(self, g: GateSpec, qubits: list[cirq.LineQubit]) -> cirq.Operation:
        q = [qubits[idx] for idx in g.qubits]
        name = g.gate

        if name == GateName.X:
            return cirq.X(q[0])
        elif name == GateName.Y:
            return cirq.Y(q[0])
        elif name == GateName.Z:
            return cirq.Z(q[0])
        elif name == GateName.H:
            return cirq.H(q[0])
        elif name == GateName.S:
            return cirq.S(q[0])
        elif name == GateName.T:
            return cirq.T(q[0])
        elif name == GateName.PHASE:
            theta = g.params.get("theta", 0.0)
            return cirq.rz(theta)(q[0])
        elif name == GateName.CX:
            return cirq.CNOT(q[0], q[1])
        elif name == GateName.CZ:
            return cirq.CZ(q[0], q[1])
        elif name == GateName.CCX:
            return cirq.TOFFOLI(q[0], q[1], q[2])
        elif name == GateName.SWAP:
            return cirq.SWAP(q[0], q[1])
        else:
            raise ValueError(f"Unsupported gate: {name}")

    def _reorder_statevector_to_lsb(self, raw_sv: np.ndarray, num_qubits: int) -> list[list[float]]:
        """Reorder Cirq MSB statevector amplitudes to LSB format."""
        n = num_qubits
        dim = 1 << n
        lsb_sv: list[list[float]] = [[0.0, 0.0]] * dim

        for i in range(dim):
            # Convert Cirq index i to LSB index j
            j = 0
            for k in range(n):
                bit = (i >> (n - 1 - k)) & 1
                j |= bit << k
            val = raw_sv[i]
            lsb_sv[j] = [float(val.real), float(val.imag)]

        return lsb_sv

    def _generate_cirq_code(self, circuit: CircuitSpec) -> str:
        """Generate executable Cirq Python source code string."""
        lines = [
            "import cirq",
            "import numpy as np",
            "",
            f"# Create {circuit.num_qubits} qubits",
            f"qubits = cirq.LineQubit.range({circuit.num_qubits})",
            "circuit = cirq.Circuit()",
            "",
            "# Apply gates",
        ]

        for g in circuit.gates:
            qs = [f"qubits[{q}]" for q in g.qubits]
            if g.gate == GateName.X:
                lines.append(f"circuit.append(cirq.X({qs[0]}))")
            elif g.gate == GateName.Y:
                lines.append(f"circuit.append(cirq.Y({qs[0]}))")
            elif g.gate == GateName.Z:
                lines.append(f"circuit.append(cirq.Z({qs[0]}))")
            elif g.gate == GateName.H:
                lines.append(f"circuit.append(cirq.H({qs[0]}))")
            elif g.gate == GateName.S:
                lines.append(f"circuit.append(cirq.S({qs[0]}))")
            elif g.gate == GateName.T:
                lines.append(f"circuit.append(cirq.T({qs[0]}))")
            elif g.gate == GateName.PHASE:
                lines.append(f"circuit.append(cirq.rz({g.params.get('theta', 0.0)})({qs[0]}))")
            elif g.gate == GateName.CX:
                lines.append(f"circuit.append(cirq.CNOT({qs[0]}, {qs[1]}))")
            elif g.gate == GateName.CZ:
                lines.append(f"circuit.append(cirq.CZ({qs[0]}, {qs[1]}))")
            elif g.gate == GateName.CCX:
                lines.append(f"circuit.append(cirq.TOFFOLI({qs[0]}, {qs[1]}, {qs[2]}))")
            elif g.gate == GateName.SWAP:
                lines.append(f"circuit.append(cirq.SWAP({qs[0]}, {qs[1]}))")

        lines.extend([
            "",
            "# Simulate circuit",
            "simulator = cirq.Simulator()",
            "result = simulator.simulate(circuit)",
            "print('Statevector:', result.state_vector())",
        ])

        return "\n".join(lines)
