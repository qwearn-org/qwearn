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

/** 2D Bloch sphere projection (SVG). */
function BlochDisplay({ coords }: { coords: BlochCoordinates[] }) {
  if (coords.length === 0) {
    return <div className="bloch-empty">Run circuit to see Bloch spheres</div>;
  }

  return (
    <div className="bloch-grid">
      {coords.map((c) => (
        <div key={c.qubit_index} className="bloch-sphere-container">
          <span className="bloch-label">Qubit {c.qubit_index}</span>
          <svg viewBox="-1.3 -1.3 2.6 2.6" className="bloch-svg">
            {/* Sphere outline */}
            <circle cx="0" cy="0" r="1" fill="none" stroke="#334155" strokeWidth="0.02" />
            {/* Equator ellipse */}
            <ellipse cx="0" cy="0" rx="1" ry="0.3" fill="none" stroke="#475569" strokeWidth="0.01" strokeDasharray="0.04 0.04" />
            {/* Axes */}
            <line x1="-1.1" y1="0" x2="1.1" y2="0" stroke="#475569" strokeWidth="0.01" />
            <line x1="0" y1="-1.1" x2="0" y2="1.1" stroke="#475569" strokeWidth="0.01" />
            {/* Axis labels */}
            <text x="1.15" y="0.05" fontSize="0.12" fill="#94a3b8">x</text>
            <text x="0.05" y="-1.1" fontSize="0.12" fill="#94a3b8">z</text>
            {/* |0⟩ and |1⟩ labels */}
            <text x="0.06" y="-1.02" fontSize="0.1" fill="#6366f1">|0⟩</text>
            <text x="0.06" y="1.08" fontSize="0.1" fill="#ef4444">|1⟩</text>
            {/* State vector arrow (project x,z to 2D) */}
            <line
              x1="0" y1="0"
              x2={c.x} y2={-c.z}
              stroke="#22d3ee" strokeWidth="0.04"
              markerEnd="url(#arrowhead)"
            />
            {/* State point */}
            <circle cx={c.x} cy={-c.z} r="0.06" fill="#22d3ee" />
            {/* Arrow marker definition */}
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#22d3ee" />
              </marker>
            </defs>
          </svg>
          <div className="bloch-coords">
            ({c.x.toFixed(2)}, {c.y.toFixed(2)}, {c.z.toFixed(2)})
          </div>
        </div>
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
