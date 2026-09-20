# Architectural Guide: Adding a New Quantum SDK Backend

**Module:** Quantum Execution Engine & Plugin System (Phase 9)  
**Owner:** Aman Raza  
**Last Updated:** September 2026  

---

## Overview

Qwearn's quantum execution layer is designed around a framework-agnostic plugin registry (`BackendRegistry`). All quantum SDK integrations (such as **Qiskit** and **Google Cirq**) implement the abstract `QuantumBackend` interface.

This guide explains how to add a new SDK backend (e.g. **PennyLane**, **Amazon Braket**, or a custom simulator) to the platform in 5 simple steps without modifying core API routing logic.

---

## Plugin Architecture

```mermaid
graph TD
    API["FastAPI /api/circuits Router"] --> Registry["BackendRegistry (Global Singleton)"]
    Registry -->|get_backend('qiskit')| Qiskit["QiskitBackend"]
    Registry -->|get_backend('cirq')| Cirq["CirqBackend"]
    Registry -->|get_backend('pennylane')| NewBackend["NewCustomBackend"]

    subgraph Interface ["quantum_core.backend.QuantumBackend"]
        Qiskit
        Cirq
        NewBackend
    end
```

---

## Step-by-Step Implementation Guide

### Step 1: Add SDK Dependency

Add your target SDK package to `packages/quantum-core/pyproject.toml` dependencies:

```toml
[project]
dependencies = [
    "qiskit>=1.0.0",
    "qiskit-aer>=0.14.0",
    "cirq>=1.3.0",
    "pennylane>=0.35.0", # Example new SDK
]
```

Install it in your virtual environment:

```bash
cd apps/api
source .venv/bin/activate
pip install -e ../../packages/quantum-core
```

---

### Step 2: Implement the `QuantumBackend` Class

Create a new module `packages/quantum-core/quantum_core/my_new_backend.py`.

Inherit from `QuantumBackend` and implement all abstract methods:

```python
from __future__ import annotations
from typing import Any
import numpy as np

from quantum_core.backend import (
    QuantumBackend,
    CircuitSpec,
    CircuitResult,
    StepResult,
    BlochCoordinates,
    GateName,
    GateSpec,
)


class MyNewBackend(QuantumBackend):
    """
    QuantumBackend implementation for MyNewSDK.
    """

    @property
    def name(self) -> str:
        return "my-new-sdk-simulator"

    def execute(self, circuit: CircuitSpec, shots: int = 1024) -> CircuitResult:
        # 1. Validate spec
        errors = self.validate_circuit(circuit)
        if errors:
            raise ValueError(f"Invalid circuit: {'; '.join(errors)}")

        # 2. Build native SDK circuit
        native_circuit = self._build_native_circuit(circuit)

        # 3. Simulate statevector (Ensure canonical LSB bit ordering!)
        statevector = self._simulate_statevector(native_circuit, circuit.num_qubits)

        # 4. Calculate probabilities & shot counts
        probabilities = self._calculate_probabilities(statevector, circuit.num_qubits)
        counts = self._sample_counts(probabilities, shots)

        # 5. Generate runnable Python code string for user
        generated_code = self._generate_code(circuit)

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
        # Perform partial trace per qubit and extract x, y, z, theta, phi
        ...

    def validate_circuit(self, circuit: CircuitSpec) -> list[str]:
        # Perform gate arity and bounds checks
        ...

    def supported_gates(self) -> list[dict[str, Any]]:
        # Return gate metadata list
        ...

    def execute_steps(self, circuit: CircuitSpec) -> list[StepResult]:
        # Return step-by-step intermediate execution states
        ...
```

> **CRITICAL CONVENTION (LSB Basis Ordering):**  
> Qwearn standardizes all statevector output on **Least Significant Bit (LSB)** computational basis ordering ($q_0$ is LSB). If your SDK uses MSB ordering (like Cirq), you MUST reorder amplitudes to LSB before returning in `CircuitResult`.

---

### Step 3: Register Backend in `quantum_core.__init__`

Register your new backend class with `register_backend` in `packages/quantum-core/quantum_core/__init__.py`:

```python
from quantum_core.my_new_backend import MyNewBackend
from quantum_core.registry import register_backend

# Automatically register official backend into global registry
register_backend("mynewsdk", MyNewBackend, is_default=False)
```

---

### Step 4: Write Unit Tests

Create `packages/quantum-core/tests/test_my_new_backend.py`:

```python
import pytest
from quantum_core.backend import CircuitSpec, GateName, GateSpec
from quantum_core.my_new_backend import MyNewBackend
from quantum_core.qiskit_backend import QiskitBackend


def test_equivalence_with_qiskit():
    b_qiskit = QiskitBackend()
    b_new = MyNewBackend()

    spec = CircuitSpec(
        num_qubits=2,
        gates=[
            GateSpec(gate=GateName.H, qubits=[0]),
            GateSpec(gate=GateName.CX, qubits=[0, 1]),
        ],
    )

    res_qiskit = b_qiskit.execute(spec)
    res_new = b_new.execute(spec)

    assert res_qiskit.probabilities == pytest.approx(res_new.probabilities)
```

Run test verification:

```bash
pytest packages/quantum-core/tests/test_my_new_backend.py
```

---

### Step 5: Update Frontend Options

In `apps/web/src/app/playground/page.tsx`, add your backend key to the SDK select dropdown:

```tsx
<select
  id="sdk-backend"
  value={selectedBackend}
  onChange={(e) => setSelectedBackend(e.target.value)}
>
  <option value="qiskit">IBM Qiskit (Aer)</option>
  <option value="cirq">Google Cirq</option>
  <option value="mynewsdk">My New SDK</option>
</select>
```

---

## Verification & Summary

By separating the API contract (`CircuitSpec` & `CircuitResult`) from concrete SDK backends, adding new quantum frameworks takes zero changes to API routes or core educational logic.
