'use client';

/**
 * CircuitDemo — Embedded circuit playground for lessons.
 *
 * Wraps CircuitGrid + ResultsPanel to provide interactive or
 * read-only circuit demonstrations within lesson content.
 * Supports auto-run (executes on mount) for scripted demos.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import CircuitGrid, { type PlacedGate } from '@web/components/circuit/CircuitGrid';
import {
  executeCircuit,
  getBlochCoordinates,
  type CircuitResult,
  type BlochCoordinates,
  type GateSpec,
} from '@web/lib/api';

interface CircuitDemoProps {
  numQubits: number;
  preset: PlacedGate[];
  caption: string;
  readonly: boolean;
  autoRun: boolean;
}

export default function CircuitDemo({
  numQubits,
  preset,
  caption,
  readonly,
  autoRun,
}: CircuitDemoProps) {
  const [gates, setGates] = useState<PlacedGate[]>(preset);
  const [result, setResult] = useState<CircuitResult | null>(null);
  const [blochCoords, setBlochCoords] = useState<BlochCoordinates[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildSpec = useCallback((): GateSpec[] => {
    return [...gates]
      .sort((a, b) => a.column - b.column)
      .map((g) => ({
        gate: g.gate,
        qubits: g.qubits,
        ...(g.params && Object.keys(g.params).length > 0 ? { params: g.params } : {}),
      }));
  }, [gates]);

  const handleRun = useCallback(async () => {
    if (gates.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const r = await executeCircuit({ num_qubits: numQubits, gates: buildSpec() }, 0);
      setResult(r);
      const coords = await getBlochCoordinates(r.statevector, numQubits);
      setBlochCoords(coords);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setIsLoading(false);
    }
  }, [gates, numQubits, buildSpec]);

  // Auto-run on mount if configured
  useEffect(() => {
    if (autoRun && gates.length > 0) {
      handleRun();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxColumns = useMemo(() => {
    if (gates.length === 0) return 6;
    return Math.max(6, Math.max(...gates.map(g => g.column)) + 2);
  }, [gates]);

  return (
    <div className="circuit-demo">
      <div className="circuit-demo-grid">
        <CircuitGrid
          numQubits={numQubits}
          gates={gates}
          onRemoveGate={readonly ? () => {} : (id) => {
            setGates(prev => prev.filter(g => g.id !== id));
            setResult(null);
          }}
          onAddGateAtSlot={readonly ? () => {} : () => {}}
          maxColumns={maxColumns}
        />
      </div>

      {!readonly && (
        <button className="circuit-demo-run" onClick={handleRun} disabled={isLoading || gates.length === 0}>
          {isLoading ? '⏳ Running...' : '▶ Run'}
        </button>
      )}

      {error && <div className="circuit-demo-error">⚠️ {error}</div>}

      {result && (
        <div className="circuit-demo-results">
          <div className="circuit-demo-probs">
            {Object.entries(result.probabilities)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([state, prob]) => (
                <div key={state} className="demo-prob-row">
                  <span className="demo-prob-label">|{state}⟩</span>
                  <div className="demo-prob-track">
                    <div className="demo-prob-fill" style={{ width: `${prob * 100}%` }} />
                  </div>
                  <span className="demo-prob-value">{(prob * 100).toFixed(1)}%</span>
                </div>
              ))}
          </div>
          {blochCoords.length > 0 && blochCoords.length <= 3 && (
            <div className="circuit-demo-bloch">
              {blochCoords.map(c => (
                <div key={c.qubit_index} className="demo-bloch-item">
                  <span className="demo-bloch-label">q{c.qubit_index}</span>
                  <svg viewBox="-1.3 -1.3 2.6 2.6" className="demo-bloch-svg">
                    <circle cx="0" cy="0" r="1" fill="none" stroke="#334155" strokeWidth="0.02" />
                    <line x1="-1.1" y1="0" x2="1.1" y2="0" stroke="#475569" strokeWidth="0.01" />
                    <line x1="0" y1="-1.1" x2="0" y2="1.1" stroke="#475569" strokeWidth="0.01" />
                    <line x1="0" y1="0" x2={c.x} y2={-c.z} stroke="#22d3ee" strokeWidth="0.04" />
                    <circle cx={c.x} cy={-c.z} r="0.06" fill="#22d3ee" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="circuit-demo-caption">{caption}</p>
    </div>
  );
}
