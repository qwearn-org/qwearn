'use client';

/**
 * ChallengeBuilder — Circuit builder scoped to a challenge.
 *
 * Wraps the existing CircuitGrid with challenge-specific constraints
 * (fixed qubit count) and a gate palette. Users build a circuit to
 * solve the challenge goal.
 */

import React, { useState, useCallback } from 'react';
import CircuitGrid, { type PlacedGate } from '@web/components/circuit/CircuitGrid';
import { evaluateChallenge, type CircuitSpec, type GateSpec, type ChallengeEvalResult } from '@web/lib/api';
import type { ChallengeSpec as ChallengeSpecType } from '@web/lib/lesson-types';
import ResultOverlay from './ResultOverlay';

const AVAILABLE_GATES = [
  { name: 'H', label: 'H', qubits: 1, color: '#6366f1' },
  { name: 'X', label: 'X', qubits: 1, color: '#ef4444' },
  { name: 'Y', label: 'Y', qubits: 1, color: '#f97316' },
  { name: 'Z', label: 'Z', qubits: 1, color: '#eab308' },
  { name: 'S', label: 'S', qubits: 1, color: '#06b6d4' },
  { name: 'T', label: 'T', qubits: 1, color: '#0ea5e9' },
  { name: 'CX', label: 'CNOT', qubits: 2, color: '#8b5cf6' },
  { name: 'CZ', label: 'CZ', qubits: 2, color: '#a855f7' },
  { name: 'CCX', label: 'Toffoli', qubits: 3, color: '#d946ef' },
];

interface ChallengeBuilderProps {
  challengeId: string;
  numQubits: number;
  spec: ChallengeSpecType;
  onResult?: (result: ChallengeEvalResult) => void;
}

export default function ChallengeBuilder({
  challengeId,
  numQubits,
  spec,
  onResult,
}: ChallengeBuilderProps) {
  const [gates, setGates] = useState<PlacedGate[]>([]);
  const [selectedGate, setSelectedGate] = useState<string>('H');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<ChallengeEvalResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAddGate = useCallback(
    (qubit: number, column: number) => {
      const gateInfo = AVAILABLE_GATES.find((g) => g.name === selectedGate);
      if (!gateInfo) return;

      const qubits = [qubit];
      if (gateInfo.qubits === 2 && qubit + 1 < numQubits) {
        qubits.push(qubit + 1);
      } else if (gateInfo.qubits === 3 && qubit + 2 < numQubits) {
        qubits.push(qubit + 1, qubit + 2);
      } else if (gateInfo.qubits > 1 && qubit + gateInfo.qubits - 1 >= numQubits) {
        return; // can't place multi-qubit gate at edge
      }

      const newGate: PlacedGate = {
        id: `${selectedGate}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        gate: selectedGate,
        qubits,
        column,
      };
      setGates((prev) => [...prev, newGate]);
    },
    [selectedGate, numQubits]
  );

  const handleRemoveGate = useCallback((gateId: string) => {
    setGates((prev) => prev.filter((g) => g.id !== gateId));
  }, []);

  const handleClear = () => {
    setGates([]);
    setResult(null);
    setShowResult(false);
  };

  const handleSubmit = async () => {
    setIsEvaluating(true);
    setResult(null);
    try {
      const gateSpecs: GateSpec[] = gates.map((g) => ({
        gate: g.gate,
        qubits: g.qubits,
      }));
      const circuitSpec: CircuitSpec = {
        num_qubits: numQubits,
        gates: gateSpecs,
      };
      const evalResult = await evaluateChallenge(challengeId, circuitSpec);
      setResult(evalResult);
      setShowResult(true);
      onResult?.(evalResult);
    } catch (e) {
      setResult({
        passed: false,
        score: 0,
        feedback: e instanceof Error ? e.message : 'Evaluation failed',
        details: {},
      });
      setShowResult(true);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="challenge-builder">
      {/* Gate Palette */}
      <div className="challenge-palette">
        <span className="palette-label">Gates</span>
        <div className="palette-gates">
          {AVAILABLE_GATES.filter((g) => g.qubits <= numQubits).map((gate) => (
            <button
              key={gate.name}
              className={`palette-gate ${selectedGate === gate.name ? 'selected' : ''}`}
              style={{
                '--gate-color': gate.color,
                borderColor: selectedGate === gate.name ? gate.color : undefined,
              } as React.CSSProperties}
              onClick={() => setSelectedGate(gate.name)}
              title={gate.label}
            >
              {gate.label}
            </button>
          ))}
        </div>
      </div>

      {/* Circuit Grid */}
      <div className="challenge-circuit">
        <CircuitGrid
          numQubits={numQubits}
          gates={gates}
          onRemoveGate={handleRemoveGate}
          onAddGateAtSlot={handleAddGate}
          maxColumns={10}
        />
      </div>

      {/* Actions */}
      <div className="challenge-actions">
        <span className="gate-count">
          {gates.length} gate{gates.length !== 1 ? 's' : ''}
          {spec.max_gates != null && ` / ${spec.max_gates} max`}
        </span>
        <button className="challenge-clear-btn" onClick={handleClear} disabled={gates.length === 0}>
          Clear
        </button>
        <button
          className="challenge-submit-btn"
          onClick={handleSubmit}
          disabled={gates.length === 0 || isEvaluating}
        >
          {isEvaluating ? 'Evaluating…' : 'Submit Circuit'}
        </button>
      </div>

      {/* Result Overlay */}
      {showResult && result && (
        <ResultOverlay
          result={result}
          onClose={() => setShowResult(false)}
          onRetry={handleClear}
        />
      )}
    </div>
  );
}
