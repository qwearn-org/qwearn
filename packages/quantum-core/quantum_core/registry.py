"""
Backend Registry — Plugin architecture and discovery mechanism for QuantumBackends.

PURPOSE:
    Provides a framework-agnostic registry for quantum execution backends.
    Allows dynamic registration, discovery, and instantiation of SDK backends
    (e.g., Qiskit, Cirq, PennyLane) without modifying API routing logic.

DESIGN PATTERN:
    Registry / Factory pattern with thread-safe singleton initialization.
"""

from __future__ import annotations

import logging
from typing import Any

from quantum_core.backend import QuantumBackend

logger = logging.getLogger("quantum_core.registry")


class BackendRegistry:
    """
    Registry for managing available QuantumBackend instances.

    Backends register themselves by key name (e.g. "qiskit", "cirq").
    The registry handles instantiation, metadata lookup, and default fallback.
    """

    def __init__(self) -> None:
        self._backends: dict[str, type[QuantumBackend]] = {}
        self._instances: dict[str, QuantumBackend] = {}
        self._default: str = "qiskit"

    def register(
        self, name: str, backend_cls: type[QuantumBackend], is_default: bool = False
    ) -> None:
        """Register a backend class with a unique name."""
        key = name.lower().strip()
        self._backends[key] = backend_cls
        if is_default or not self._default:
            self._default = key
        logger.info("Registered QuantumBackend '%s' (%s)", key, backend_cls.__name__)

    def get(self, name: str | None = None) -> QuantumBackend:
        """
        Get or instantiate a backend by name.

        If name is None or empty, returns the default backend (Qiskit).
        """
        key = (name or self._default).lower().strip()
        if key not in self._backends:
            valid_keys = ", ".join(self._backends.keys())
            raise ValueError(
                f"Unknown backend '{name}'. Available backends: {valid_keys}"
            )

        if key not in self._instances:
            cls = self._backends[key]
            self._instances[key] = cls()

        return self._instances[key]

    def list_backends(self) -> list[dict[str, Any]]:
        """
        Return metadata for all registered backends.

        Used by the frontend to populate SDK selector controls and status tools.
        """
        result = []
        for key, cls in self._backends.items():
            instance = self.get(key)
            result.append(
                {
                    "name": key,
                    "display_name": instance.name,
                    "is_default": key == self._default,
                    "supported_gates": len(instance.supported_gates()),
                }
            )
        return result


# Global singleton registry
registry = BackendRegistry()


def register_backend(
    name: str, backend_cls: type[QuantumBackend], is_default: bool = False
) -> None:
    """Register a backend class in the global registry."""
    registry.register(name, backend_cls, is_default)


def get_backend(name: str | None = None) -> QuantumBackend:
    """Get a backend instance by name from the global registry."""
    return registry.get(name)


def list_backends() -> list[dict[str, Any]]:
    """List all registered backends in the global registry."""
    return registry.list_backends()
