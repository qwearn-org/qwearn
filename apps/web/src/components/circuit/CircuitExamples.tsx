'use client';

/**
 * CircuitExamples — Pre-built circuit presets for quick loading.
 *
 * Provides one-click access to well-known quantum circuits so
 * first-time users can immediately see the platform working.
 * Each preset defines a circuit spec and a description.
 */

import React, { useState } from 'react';
import type { PlacedGate } from '@web/components/circuit/CircuitGrid';

interface CircuitPreset {
  name: string;
  description: string;
  numQubits: number;
  gates: PlacedGate[];
}

const PRESETS: CircuitPreset[] = [
  {
    name: 'Bell State',
    description: '|Φ+⟩ = (|00⟩+|11⟩)/√2 — Maximum entanglement',
    numQubits: 2,
    gates: [
      { id: 'ex-1', gate: 'H', qubits: [0], column: 0 },
      { id: 'ex-2', gate: 'CX', qubits: [0, 1], column: 1 },
    ],
  },
  {
    name: 'GHZ State',
    description: '(|000⟩+|111⟩)/√2 — 3-qubit entanglement',
    numQubits: 3,
    gates: [
      { id: 'ex-1', gate: 'H', qubits: [0], column: 0 },
      { id: 'ex-2', gate: 'CX', qubits: [0, 1], column: 1 },
      { id: 'ex-3', gate: 'CX', qubits: [0, 2], column: 2 },
    ],
  },
  {
    name: 'Superposition',
    description: 'Equal superposition of all basis states',
    numQubits: 3,
    gates: [
      { id: 'ex-1', gate: 'H', qubits: [0], column: 0 },
      { id: 'ex-2', gate: 'H', qubits: [1], column: 0 },
      { id: 'ex-3', gate: 'H', qubits: [2], column: 0 },
    ],
  },
  {
    name: 'Quantum Teleportation',
    description: 'Transfer qubit state using entanglement',
    numQubits: 3,
    gates: [
      // Prepare the state to teleport (X on q0)
      { id: 'ex-1', gate: 'X', qubits: [0], column: 0 },
      // Create Bell pair between q1 and q2
      { id: 'ex-2', gate: 'H', qubits: [1], column: 1 },
      { id: 'ex-3', gate: 'CX', qubits: [1, 2], column: 2 },
      // Bell measurement on q0, q1
      { id: 'ex-4', gate: 'CX', qubits: [0, 1], column: 3 },
      { id: 'ex-5', gate: 'H', qubits: [0], column: 4 },
    ],
  },
  {
    name: 'Deutsch-Jozsa',
    description: 'Determine if f(x) is constant or balanced',
    numQubits: 2,
    gates: [
      // Prepare |01⟩ → H⊗H → Oracle (CX) → H on q0
      { id: 'ex-1', gate: 'X', qubits: [1], column: 0 },
      { id: 'ex-2', gate: 'H', qubits: [0], column: 1 },
      { id: 'ex-3', gate: 'H', qubits: [1], column: 1 },
      { id: 'ex-4', gate: 'CX', qubits: [0, 1], column: 2 },
      { id: 'ex-5', gate: 'H', qubits: [0], column: 3 },
    ],
  },
];

interface CircuitExamplesProps {
  onLoadPreset: (numQubits: number, gates: PlacedGate[]) => void;
}

export default function CircuitExamples({ onLoadPreset }: CircuitExamplesProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="circuit-examples">
      <button
        className="examples-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>📋 Example Circuits</span>
        <span className={`save-load-chevron ${isOpen ? 'open' : ''}`}>▾</span>
      </button>

      {isOpen && (
        <div className="examples-list">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              className="example-item"
              onClick={() => {
                onLoadPreset(preset.numQubits, preset.gates);
                setIsOpen(false);
              }}
            >
              <span className="example-name">{preset.name}</span>
              <span className="example-desc">{preset.description}</span>
              <span className="example-meta">
                {preset.numQubits}q · {preset.gates.length} gates
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
