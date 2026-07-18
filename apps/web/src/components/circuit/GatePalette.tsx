'use client';

/**
 * GatePalette — Sidebar with draggable quantum gate buttons.
 *
 * Users drag gates from this palette onto the circuit canvas.
 * Gates are organized by category (Pauli, Common, Phase, Entangling).
 */

import React from 'react';

interface GateItem {
  name: string;
  displayName: string;
  numQubits: number;
  hasParams: boolean;
  description: string;
  category: string;
  color: string;
  symbol: string;
}

const GATES: GateItem[] = [
  { name: 'H', displayName: 'Hadamard', numQubits: 1, hasParams: false, description: 'Creates superposition', category: 'common', color: '#6366f1', symbol: 'H' },
  { name: 'X', displayName: 'Pauli-X', numQubits: 1, hasParams: false, description: 'Bit flip (NOT)', category: 'pauli', color: '#ef4444', symbol: 'X' },
  { name: 'Y', displayName: 'Pauli-Y', numQubits: 1, hasParams: false, description: 'Bit + phase flip', category: 'pauli', color: '#f97316', symbol: 'Y' },
  { name: 'Z', displayName: 'Pauli-Z', numQubits: 1, hasParams: false, description: 'Phase flip', category: 'pauli', color: '#eab308', symbol: 'Z' },
  { name: 'Phase', displayName: 'Phase', numQubits: 1, hasParams: true, description: 'Phase rotation P(θ)', category: 'phase', color: '#14b8a6', symbol: 'P' },
  { name: 'S', displayName: 'S Gate', numQubits: 1, hasParams: false, description: '√Z (π/2 phase)', category: 'phase', color: '#06b6d4', symbol: 'S' },
  { name: 'T', displayName: 'T Gate', numQubits: 1, hasParams: false, description: '√S (π/4 phase)', category: 'phase', color: '#0ea5e9', symbol: 'T' },
  { name: 'CX', displayName: 'CNOT', numQubits: 2, hasParams: false, description: 'Controlled-NOT', category: 'entangling', color: '#8b5cf6', symbol: '⊕' },
  { name: 'CZ', displayName: 'CZ', numQubits: 2, hasParams: false, description: 'Controlled-Z', category: 'entangling', color: '#a855f7', symbol: 'CZ' },
  { name: 'CCX', displayName: 'Toffoli', numQubits: 3, hasParams: false, description: 'Double-controlled NOT', category: 'entangling', color: '#d946ef', symbol: 'T' },
  { name: 'SWAP', displayName: 'SWAP', numQubits: 2, hasParams: false, description: 'Swap two qubits', category: 'common', color: '#64748b', symbol: '⨉' },
];

const CATEGORY_LABELS: Record<string, string> = {
  common: 'Common',
  pauli: 'Pauli Gates',
  phase: 'Phase Gates',
  entangling: 'Entangling',
};

interface GatePaletteProps {
  onAddGate: (gateName: string, numQubits: number, hasParams: boolean) => void;
}

export default function GatePalette({ onAddGate }: GatePaletteProps) {
  const categories = ['common', 'pauli', 'phase', 'entangling'];

  return (
    <div className="gate-palette">
      <h3 className="palette-title">Gate Palette</h3>
      {categories.map((cat) => (
        <div key={cat} className="palette-category">
          <span className="category-label">{CATEGORY_LABELS[cat]}</span>
          <div className="gate-grid">
            {GATES.filter((g) => g.category === cat).map((gate) => (
              <button
                key={gate.name}
                className="gate-button"
                style={{ '--gate-color': gate.color } as React.CSSProperties}
                onClick={() => onAddGate(gate.name, gate.numQubits, gate.hasParams)}
                title={`${gate.displayName}: ${gate.description}`}
              >
                <span className="gate-symbol">{gate.symbol}</span>
                <span className="gate-label">{gate.displayName}</span>
                {gate.numQubits > 1 && (
                  <span className="gate-qubits">{gate.numQubits}q</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
