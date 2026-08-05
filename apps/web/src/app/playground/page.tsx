'use client';

/**
 * Circuit Playground — The core interactive feature of Qwearn.
 *
 * This is the main page where users:
 * 1. Build quantum circuits by selecting gates and placing them on qubits
 * 2. See generated Qiskit code update in real-time
 * 3. Run the circuit on the Aer simulator
 * 4. View results (probabilities, statevector, Bloch sphere)
 * 5. Save/load circuits for later use
 *
 * State management is local (useState) since the circuit is ephemeral
 * until the user explicitly saves it via the SaveLoadPanel.
 */

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import GatePalette from '@web/components/circuit/GatePalette';
import CircuitGrid, { type PlacedGate } from '@web/components/circuit/CircuitGrid';
import CodePanel from '@web/components/circuit/CodePanel';
import ResultsPanel from '@web/components/circuit/ResultsPanel';
import SaveLoadPanel from '@web/components/circuit/SaveLoadPanel';
import CircuitExamples from '@web/components/circuit/CircuitExamples';
import {
  executeCircuit,
  getBlochCoordinates,
  type CircuitResult,
  type BlochCoordinates,
  type GateSpec,
} from '@web/lib/api';

export default function PlaygroundPage() {
  // Circuit state
  const [numQubits, setNumQubits] = useState(2);
  const [gates, setGates] = useState<PlacedGate[]>([]);
  const [selectedGate, setSelectedGate] = useState<{
    name: string;
    numQubits: number;
    hasParams: boolean;
  } | null>(null);

  // Execution state
  const [result, setResult] = useState<CircuitResult | null>(null);
  const [blochCoords, setBlochCoords] = useState<BlochCoordinates[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Next gate column (auto-incrementing)
  const nextColumn = useMemo(() => {
    if (gates.length === 0) return 0;
    return Math.max(...gates.map((g) => g.column)) + 1;
  }, [gates]);

  // Convert PlacedGates to GateSpec array for the API
  const buildCircuitSpec = useCallback((): GateSpec[] => {
    return gates
      .sort((a, b) => a.column - b.column)
      .map((g) => ({
        gate: g.gate,
        qubits: g.qubits,
        ...(g.params && Object.keys(g.params).length > 0 ? { params: g.params } : {}),
      }));
  }, [gates]);

  // Generate code locally for live preview (before running)
  const previewCode = useMemo(() => {
    if (gates.length === 0) return '# Add gates to your circuit to see code';
    const sorted = [...gates].sort((a, b) => a.column - b.column);
    const lines = [
      'from qiskit import QuantumCircuit',
      'from qiskit_aer import AerSimulator',
      '',
      `# Create a ${numQubits}-qubit circuit`,
      `qc = QuantumCircuit(${numQubits})`,
      '',
      '# Apply gates',
    ];
    const codeMap: Record<string, (g: PlacedGate) => string> = {
      X: (g) => `qc.x(${g.qubits[0]})`,
      Y: (g) => `qc.y(${g.qubits[0]})`,
      Z: (g) => `qc.z(${g.qubits[0]})`,
      H: (g) => `qc.h(${g.qubits[0]})`,
      S: (g) => `qc.s(${g.qubits[0]})`,
      T: (g) => `qc.t(${g.qubits[0]})`,
      Phase: (g) => `qc.p(${g.params?.theta ?? 'theta'}, ${g.qubits[0]})`,
      CX: (g) => `qc.cx(${g.qubits[0]}, ${g.qubits[1]})`,
      CZ: (g) => `qc.cz(${g.qubits[0]}, ${g.qubits[1]})`,
      CCX: (g) => `qc.ccx(${g.qubits[0]}, ${g.qubits[1]}, ${g.qubits[2]})`,
      SWAP: (g) => `qc.swap(${g.qubits[0]}, ${g.qubits[1]})`,
    };
    for (const g of sorted) {
      const fn = codeMap[g.gate];
      if (fn) lines.push(fn(g));
    }
    lines.push('', '# Simulate', 'qc.save_statevector()', "simulator = AerSimulator(method='statevector')", 'result = simulator.run(qc).result()');
    return lines.join('\n');
  }, [gates, numQubits]);

  // Handle gate selection from palette
  const handleSelectGate = useCallback(
    (gateName: string, gateNumQubits: number, hasParams: boolean) => {
      setSelectedGate({ name: gateName, numQubits: gateNumQubits, hasParams });
    },
    []
  );

  // Handle placing a gate on the grid
  const handleAddGateAtSlot = useCallback(
    (qubit: number, column: number) => {
      if (!selectedGate) return;

      const qubits = [qubit];
      // For multi-qubit gates, auto-assign additional qubits
      if (selectedGate.numQubits >= 2) {
        const target = qubit + 1 < numQubits ? qubit + 1 : qubit - 1;
        if (target < 0 || target >= numQubits) return;
        qubits.push(target);
      }
      if (selectedGate.numQubits >= 3) {
        const third = qubit + 2 < numQubits ? qubit + 2 : qubit - 2;
        if (third < 0 || third >= numQubits || qubits.includes(third)) return;
        qubits.push(third);
      }

      const params: Record<string, number> = {};
      if (selectedGate.hasParams) {
        const theta = prompt('Enter phase angle θ (in radians, e.g. 1.5708 for π/2):');
        if (theta === null) return;
        params.theta = parseFloat(theta);
        if (isNaN(params.theta)) return;
      }

      const newGate: PlacedGate = {
        id: `gate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        gate: selectedGate.name,
        qubits,
        column,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      };

      setGates((prev) => [...prev, newGate]);
      setResult(null); // Clear results when circuit changes
    },
    [selectedGate, numQubits]
  );

  // Handle removing a gate
  const handleRemoveGate = useCallback((gateId: string) => {
    setGates((prev) => prev.filter((g) => g.id !== gateId));
    setResult(null);
  }, []);

  // Execute the circuit
  const handleRun = useCallback(async () => {
    if (gates.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const circuitResult = await executeCircuit(
        { num_qubits: numQubits, gates: buildCircuitSpec() },
        1024
      );
      setResult(circuitResult);

      // Get Bloch coordinates
      const coords = await getBlochCoordinates(
        circuitResult.statevector,
        numQubits
      );
      setBlochCoords(coords);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Execution failed');
    } finally {
      setIsLoading(false);
    }
  }, [gates, numQubits, buildCircuitSpec]);

  // Clear the circuit
  const handleClear = useCallback(() => {
    setGates([]);
    setResult(null);
    setBlochCoords([]);
    setError(null);
  }, []);

  // Load a saved circuit
  const handleLoadCircuit = useCallback(
    (spec: { num_qubits: number; gates: GateSpec[] }, _title: string) => {
      setNumQubits(spec.num_qubits);
      const placedGates: PlacedGate[] = spec.gates.map((g, i) => ({
        id: `loaded-${Date.now()}-${i}`,
        gate: g.gate,
        qubits: g.qubits,
        column: i,
        ...(g.params && Object.keys(g.params).length > 0 ? { params: g.params } : {}),
      }));
      setGates(placedGates);
      setResult(null);
      setBlochCoords([]);
      setError(null);
    },
    []
  );

  // Load a preset example
  const handleLoadPreset = useCallback(
    (presetNumQubits: number, presetGates: PlacedGate[]) => {
      setNumQubits(presetNumQubits);
      // Re-generate IDs to avoid conflicts
      const newGates = presetGates.map((g, i) => ({
        ...g,
        id: `preset-${Date.now()}-${i}`,
      }));
      setGates(newGates);
      setResult(null);
      setBlochCoords([]);
      setError(null);
    },
    []
  );

  return (
    <>
      {/* Navigation Bar */}
      <nav className="nav">
        <Link href="/" className="nav-brand">⚛️ Qwearn</Link>
        <div className="nav-links">
          <Link href="/learn" className="nav-link">
            Learn
          </Link>
          <Link href="/playground" className="nav-link nav-link-active">
            Circuit Playground
          </Link>
        </div>
      </nav>

      <div className="playground-layout">
        {/* Left: Gate Palette + Examples + Save/Load */}
        <aside className="playground-sidebar">
          <GatePalette onAddGate={handleSelectGate} />
          {selectedGate && (
            <div className="selected-gate-info">
              <span>Selected: <strong>{selectedGate.name}</strong></span>
              <span className="hint">Click a slot on the circuit to place</span>
            </div>
          )}
          <CircuitExamples onLoadPreset={handleLoadPreset} />
          <SaveLoadPanel
            currentCircuit={{ num_qubits: numQubits, gates: buildCircuitSpec() }}
            onLoadCircuit={handleLoadCircuit}
            hasGates={gates.length > 0}
          />
        </aside>

        {/* Center: Circuit + Controls + Code */}
        <main className="playground-main">
          <div className="playground-controls">
            <div className="qubit-control">
              <label htmlFor="num-qubits">Qubits:</label>
              <select
                id="num-qubits"
                value={numQubits}
                onChange={(e) => {
                  setNumQubits(parseInt(e.target.value));
                  handleClear();
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-run"
              onClick={handleRun}
              disabled={isLoading || gates.length === 0}
            >
              {isLoading ? '⏳ Running...' : '▶ Run Circuit'}
            </button>
            <button className="btn btn-clear" onClick={handleClear}>
              🗑 Clear
            </button>
          </div>

          <CircuitGrid
            numQubits={numQubits}
            gates={gates}
            onRemoveGate={handleRemoveGate}
            onAddGateAtSlot={handleAddGateAtSlot}
          />

          <CodePanel code={result?.generated_code || previewCode} />
        </main>

        {/* Right: Results */}
        <aside className="playground-results">
          <ResultsPanel
            result={result}
            blochCoords={blochCoords}
            isLoading={isLoading}
            error={error}
          />
        </aside>
      </div>
    </>
  );
}
