"""
quantum_core package — Core quantum backend abstractions and plugin registry.
"""

from quantum_core.backend import (
    BlochCoordinates,
    CircuitResult,
    CircuitSpec,
    GateName,
    GateSpec,
    QuantumBackend,
    StepResult,
)
from quantum_core.cirq_backend import CirqBackend
from quantum_core.qiskit_backend import QiskitBackend
from quantum_core.registry import (
    BackendRegistry,
    get_backend,
    list_backends,
    register_backend,
    registry,
)

# Automatically register default official backends into global registry
register_backend("qiskit", QiskitBackend, is_default=True)
register_backend("cirq", CirqBackend, is_default=False)

__all__ = [
    "QuantumBackend",
    "CircuitSpec",
    "GateSpec",
    "GateName",
    "CircuitResult",
    "StepResult",
    "BlochCoordinates",
    "QiskitBackend",
    "CirqBackend",
    "BackendRegistry",
    "registry",
    "get_backend",
    "list_backends",
    "register_backend",
]
