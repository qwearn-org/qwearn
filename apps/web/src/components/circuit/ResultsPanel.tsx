'use client';

/**
 * ResultsPanel — Displays circuit execution results.
 *
 * Shows three views:
 * 1. Probability bar chart (which states are most likely)
 * 2. Statevector (the actual quantum state amplitudes)
 * 3. 2D Bloch sphere projection (per-qubit visualization)
 *
 * The Bloch sphere is a 2D fallback (Phase 7 upgrades to Three.js 3D).
 */

import React, { useState } from 'react';
import type { CircuitResult, BlochCoordinates } from '@web/lib/api';

interface ResultsPanelProps {
  result: CircuitResult | null;
  blochCoords: BlochCoordinates[];
  isLoading: boolean;
  error: string | null;
}

type Tab = 'probabilities' | 'statevector' | 'bloch';

export default function ResultsPanel({
  result,
  blochCoords,
  isLoading,
  error,
}: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('probabilities');

  if (isLoading) {
    return (
      <div className="results-panel">
        <div className="results-loading">
          <div className="spinner" />
          <span>Simulating circuit...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-panel">
        <div className="results-error">⚠️ {error}</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="results-panel">
        <div className="results-empty">
          <span className="empty-icon">⚛️</span>
          <p>Add gates and click <strong>Run</strong> to see results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-panel">
      <div className="results-tabs">
        {(['probabilities', 'statevector', 'bloch'] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'probabilities' ? '📊 Probabilities' :
             tab === 'statevector' ? '|ψ⟩ State' : '🌐 Bloch'}
          </button>
        ))}
      </div>

      <div className="results-content">
        {activeTab === 'probabilities' && (
          <ProbabilityChart probabilities={result.probabilities} />
        )}
        {activeTab === 'statevector' && (
          <StatevectorDisplay statevector={result.statevector} />
        )}
        {activeTab === 'bloch' && (
          <BlochDisplay coords={blochCoords} />
        )}
      </div>
    </div>
  );
}

/** Bar chart of measurement probabilities. */
function ProbabilityChart({ probabilities }: { probabilities: Record<string, number> }) {
  const sorted = Object.entries(probabilities).sort(([a], [b]) => a.localeCompare(b));
  const maxProb = Math.max(...sorted.map(([, p]) => p), 0.01);

  return (
    <div className="prob-chart">
      {sorted.map(([state, prob]) => (
        <div key={state} className="prob-bar-row">
          <span className="prob-label">|{state}⟩</span>
          <div className="prob-bar-track">
            <div
              className="prob-bar-fill"
              style={{ width: `${(prob / maxProb) * 100}%` }}
            />
          </div>
          <span className="prob-value">{(prob * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

/** Display statevector amplitudes. */
function StatevectorDisplay({ statevector }: { statevector: number[][] }) {
  const numQubits = Math.log2(statevector.length);

  return (
    <div className="statevector-display">
      <div className="sv-header">
        |ψ⟩ = {statevector.length} amplitudes ({numQubits} qubits)
      </div>
      <div className="sv-amplitudes">
        {statevector.map(([re, im], i) => {
          const mag = Math.sqrt(re * re + im * im);
          if (mag < 1e-8) return null;
          const state = i.toString(2).padStart(numQubits, '0');
          return (
            <div key={i} className="sv-amplitude">
              <span className="sv-coeff">
                {formatComplex(re, im)}
              </span>
              <span className="sv-ket">|{state}⟩</span>
              <span className="sv-prob">({(mag * mag * 100).toFixed(1)}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import BlochSphere3D from '@web/components/visualization/BlochSphere3D';

/** 3D Bloch sphere visualizer (Three.js). */
function BlochDisplay({ coords }: { coords: BlochCoordinates[] }) {
  if (coords.length === 0) {
    return <div className="bloch-empty">Run circuit to see 3D Bloch spheres</div>;
  }

  return (
    <div className="bloch-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
      {coords.map((c) => (
        <BlochSphere3D
          key={c.qubit_index}
          x={c.x}
          y={c.y}
          z={c.z}
          label={`Qubit ${c.qubit_index}`}
          interactive={true}
        />
      ))}
    </div>
  );
}

/** Format a complex number for display. */
function formatComplex(re: number, im: number): string {
  const threshold = 1e-8;
  const reStr = Math.abs(re) > threshold ? re.toFixed(4) : '';
  const imStr = Math.abs(im) > threshold ? `${im >= 0 && reStr ? '+' : ''}${im.toFixed(4)}i` : '';
  return (reStr + imStr) || '0';
}
