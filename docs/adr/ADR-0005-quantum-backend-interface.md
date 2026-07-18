# ADR-0005: QuantumBackend Interface Design

**Status:** Accepted  
**Date:** 2026-07-17  
**Decision Makers:** Aman Raza  

## Context

Qwearn's core feature is the Circuit Playground — a drag-and-drop circuit builder that executes circuits on a quantum simulator and returns results. The platform must:

1. Support Qiskit today, with the ability to add Cirq, PennyLane, etc. later (Phase 9)
2. Never expose SDK-specific types to the API layer
3. Keep the circuit description format framework-agnostic

## Decision

Define a `QuantumBackend` abstract base class in `packages/quantum-core` with:
- **Input:** `CircuitSpec` — a Pydantic model describing the circuit as a list of `GateSpec` objects (gate name + qubit indices + parameters)
- **Output:** `CircuitResult` — a Pydantic model containing statevector, probabilities, measurement counts, and generated source code
- **Methods:** `execute()`, `get_bloch_coordinates()`, `validate_circuit()`, `supported_gates()`

## Rationale

### Why a "circuit spec" instead of passing SDK objects?

The frontend sends JSON. If we required SDK-specific circuit objects, the API layer would need to import Qiskit to deserialize requests. By using a framework-agnostic `CircuitSpec` (just gate names and qubit indices), the API layer is SDK-blind — it passes the spec to whichever backend is registered, and gets back a generic `CircuitResult`.

### Why include `generated_code` in the result?

A key learning feature: the user sees the Qiskit code that would reproduce their circuit. Each backend is responsible for generating its own SDK's code, so a future Cirq backend would return Cirq code instead.

### Conventions

- **Qubit ordering:** Least-significant-bit = qubit 0 (Qiskit convention). A future Cirq backend must translate, since Cirq uses most-significant-bit = qubit 0. This is documented in `backend.py`.
- **Gate names:** Standard textbook (Nielsen & Chuang §4.2). CX instead of CNOT, CCX instead of Toffoli, to avoid ambiguity.
- **Statevector format:** List of `[real, imag]` pairs, JSON-serializable. Not complex numbers (which aren't JSON-native).

## Consequences

- Every new SDK integration is a single new file implementing `QuantumBackend`.
- The API layer never needs to change when a new backend is added.
- The tradeoff: some advanced SDK-specific features (e.g., Qiskit's transpilation options) are not exposed through the generic interface. These can be added as optional extension methods on specific backends if needed.

## File Location

`packages/quantum-core/quantum_core/backend.py`
