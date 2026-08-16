'use client';

/**
 * StepThroughPlayer — Interactive step-by-step circuit execution viewer.
 *
 * Shows a circuit with playback controls that let users step through
 * gate-by-gate, seeing how the quantum state evolves at each step.
 * Used by the Quantum Algorithms module.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  executeSteps,
  type StepResult,
  type GateSpec,
} from '@web/lib/api';
import type { StepCircuitGate } from '@web/lib/lesson-types';

interface StepThroughPlayerProps {
  numQubits: number;
  gates: StepCircuitGate[];
  stepDescriptions: string[];
  caption: string;
}

export default function StepThroughPlayer({
  numQubits,
  gates,
  stepDescriptions,
  caption,
}: StepThroughPlayerProps) {
  const [steps, setSteps] = useState<StepResult[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1000); // ms per step
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load steps from backend on mount
  const loadSteps = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const gateSpecs: GateSpec[] = gates.map((g) => ({
        gate: g.gate,
        qubits: g.qubits,
        ...(g.params && Object.keys(g.params).length > 0 ? { params: g.params } : {}),
      }));
      const result = await executeSteps({ num_qubits: numQubits, gates: gateSpecs });
      setSteps(result);
      setCurrentStep(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to execute steps');
    } finally {
      setIsLoading(false);
    }
  }, [numQubits, gates]);

  useEffect(() => {
    loadSteps();
  }, [loadSteps]);

  // Auto-play logic
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, steps.length, speed]);

  const step = steps[currentStep];
  const totalSteps = steps.length;

  if (isLoading) {
    return (
      <div className="step-player">
        <div className="step-player-loading">
          <div className="step-player-spinner" />
          <span>Simulating circuit…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="step-player">
        <div className="step-player-error">⚠️ {error}</div>
        <button className="step-player-retry" onClick={loadSteps}>Retry</button>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="step-player">
      {/* Circuit visualization with gate highlighting */}
      <div className="step-circuit-viz">
        <div className="step-circuit-wires">
          {Array.from({ length: numQubits }, (_, q) => (
            <div key={q} className="step-wire">
              <span className="step-wire-label">q{q}</span>
              <div className="step-wire-line">
                {gates.map((g, gi) => {
                  const isActive = currentStep >= gi + 1;
                  const isCurrent = currentStep === gi + 1;
                  const isOnQubit = g.qubits.includes(q);
                  const isControl = g.gate === 'CX' && q === g.qubits[0];
                  const isTarget = g.gate === 'CX' && q === g.qubits[1];

                  return (
                    <div
                      key={g.id}
                      className={`step-gate-slot ${isOnQubit ? 'on-qubit' : ''} ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      {isOnQubit && (
                        <span className={`step-gate-box ${isControl ? 'control' : ''} ${isTarget ? 'target' : ''}`}>
                          {isControl ? '●' : isTarget ? '⊕' : g.gate}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step description */}
      <div className="step-description">
        <span className="step-badge">
          Step {currentStep}/{totalSteps - 1}
        </span>
        <p>{stepDescriptions[currentStep] || (step.gate_name ? `Applied ${step.gate_name} gate` : 'Initial state')}</p>
      </div>

      {/* Probability display */}
      <div className="step-probabilities">
        {Object.entries(step.probabilities)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([state, prob]) => (
            <div key={state} className="step-prob-row">
              <span className="step-prob-label">|{state}⟩</span>
              <div className="step-prob-track">
                <div
                  className="step-prob-fill"
                  style={{ width: `${prob * 100}%` }}
                />
              </div>
              <span className="step-prob-value">{(prob * 100).toFixed(1)}%</span>
            </div>
          ))}
      </div>

      {/* Playback controls */}
      <div className="step-controls">
        <button
          className="step-ctrl-btn"
          onClick={() => setCurrentStep(0)}
          disabled={currentStep === 0}
          title="Reset"
        >
          ⏮
        </button>
        <button
          className="step-ctrl-btn"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          title="Previous"
        >
          ◀
        </button>
        <button
          className="step-ctrl-btn step-play-btn"
          onClick={() => {
            if (currentStep >= totalSteps - 1) {
              setCurrentStep(0);
            }
            setIsPlaying(!isPlaying);
          }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className="step-ctrl-btn"
          onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
          disabled={currentStep >= totalSteps - 1}
          title="Next"
        >
          ▶
        </button>
        <button
          className="step-ctrl-btn"
          onClick={() => setCurrentStep(totalSteps - 1)}
          disabled={currentStep >= totalSteps - 1}
          title="End"
        >
          ⏭
        </button>
        <div className="step-speed">
          <label>Speed</label>
          <input
            type="range"
            min={200}
            max={2000}
            step={100}
            value={2200 - speed}
            onChange={(e) => setSpeed(2200 - Number(e.target.value))}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="step-progress">
        {steps.map((_, i) => (
          <button
            key={i}
            className={`step-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'passed' : ''}`}
            onClick={() => { setCurrentStep(i); setIsPlaying(false); }}
            title={`Step ${i}`}
          />
        ))}
      </div>

      <p className="step-caption">{caption}</p>
    </div>
  );
}
