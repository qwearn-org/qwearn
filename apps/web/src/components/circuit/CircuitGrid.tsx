'use client';

/**
 * CircuitGrid — Visual quantum circuit editor.
 *
 * Displays qubits as horizontal wires with gate slots. Users can:
 * - Click a slot to place the currently selected gate
 * - Click an existing gate to remove it
 * - See multi-qubit gates spanning across wires
 *
 * This is a simplified grid-based approach (not React Flow) that's
 * more intuitive for beginners than a node-graph editor. React Flow
 * can be used later for more advanced circuit editing.
 */

import React from 'react';

/** A placed gate on the circuit grid. */
export interface PlacedGate {
  id: string;
  gate: string;
  qubits: number[];
  params?: Record<string, number>;
  column: number;
}

/** Gate color mapping */
const GATE_COLORS: Record<string, string> = {
  H: '#6366f1', X: '#ef4444', Y: '#f97316', Z: '#eab308',
  Phase: '#14b8a6', S: '#06b6d4', T: '#0ea5e9',
  CX: '#8b5cf6', CZ: '#a855f7', CCX: '#d946ef', SWAP: '#64748b',
};

const GATE_SYMBOLS: Record<string, string> = {
  H: 'H', X: 'X', Y: 'Y', Z: 'Z',
  Phase: 'P', S: 'S', T: 'T',
  CX: '⊕', CZ: 'CZ', CCX: '⊕', SWAP: '⨉',
};

interface CircuitGridProps {
  numQubits: number;
  gates: PlacedGate[];
  onRemoveGate: (gateId: string) => void;
  onAddGateAtSlot: (qubit: number, column: number) => void;
  maxColumns?: number;
}

export default function CircuitGrid({
  numQubits,
  gates,
  onRemoveGate,
  onAddGateAtSlot,
  maxColumns = 12,
}: CircuitGridProps) {
  // Build a lookup: (qubit, column) → PlacedGate for rendering
  const gateMap = new Map<string, PlacedGate>();
  for (const g of gates) {
    for (const q of g.qubits) {
      gateMap.set(`${q}-${g.column}`, g);
    }
  }

  return (
    <div className="circuit-grid">
      <div className="circuit-header">
        <span className="circuit-title">Circuit</span>
        <span className="circuit-info">{numQubits} qubits · {gates.length} gates</span>
      </div>
      <div className="circuit-wires">
        {Array.from({ length: numQubits }, (_, qubit) => (
          <div key={qubit} className="qubit-wire">
            <div className="qubit-label">q{qubit}</div>
            <div className="wire-line" />
            <div className="gate-slots">
              {Array.from({ length: maxColumns }, (_, col) => {
                const key = `${qubit}-${col}`;
                const placedGate = gateMap.get(key);

                if (placedGate && placedGate.qubits[0] === qubit) {
                  // This is the primary qubit for this gate — render the gate box
                  return (
                    <button
                      key={key}
                      className="gate-slot gate-placed"
                      style={{ '--gate-color': GATE_COLORS[placedGate.gate] || '#64748b' } as React.CSSProperties}
                      onClick={() => onRemoveGate(placedGate.id)}
                      title={`${placedGate.gate} — click to remove`}
                    >
                      {GATE_SYMBOLS[placedGate.gate] || placedGate.gate}
                    </button>
                  );
                } else if (placedGate) {
                  // This is a secondary qubit (target of CNOT, etc.) — show connector
                  return (
                    <div
                      key={key}
                      className="gate-slot gate-connector"
                      style={{ '--gate-color': GATE_COLORS[placedGate.gate] || '#64748b' } as React.CSSProperties}
                    >
                      {placedGate.gate === 'CX' || placedGate.gate === 'CCX' ? '●' : '○'}
                    </div>
                  );
                }

                return (
                  <button
                    key={key}
                    className="gate-slot gate-empty"
                    onClick={() => onAddGateAtSlot(qubit, col)}
                    title="Click to place selected gate"
                  >
                    +
                  </button>
                );
              })}
            </div>
            <div className="wire-line" />
            <div className="qubit-output">|0⟩</div>
          </div>
        ))}
      </div>
    </div>
  );
}
