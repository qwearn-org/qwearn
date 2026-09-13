'use client';

import React, { useState } from 'react';
import { trainQMLModel } from '@web/lib/api';
import type { QMLTrainingResult } from '@web/lib/lesson-types';
import ComparisonPanel from './ComparisonPanel';

export default function LiveTrainer() {
  const [dataset, setDataset] = useState<string>('circles');
  const [ansatz, setAnsatz] = useState<string>('basic');
  const [maxEpochs, setMaxEpochs] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QMLTrainingResult | null>(null);

  const handleTrain = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await trainQMLModel({
        dataset,
        ansatz,
        max_epochs: maxEpochs,
        num_qubits: 2,
        num_samples: 80,
      });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Training failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qml-live-trainer">
      <div className="qml-trainer-header">
        <h3>⚡ Interactive Live VQC Trainer</h3>
        <p>Run real-time parameter optimization on Qiskit Aer simulator</p>
      </div>

      <div className="qml-controls-row">
        <div className="control-group">
          <label>Synthetic Dataset:</label>
          <select value={dataset} onChange={(e) => setDataset(e.target.value)} disabled={loading}>
            <option value="circles">Concentric Circles (Non-linear)</option>
            <option value="moons">Interlocking Moons</option>
            <option value="linear">Linearly Separable</option>
          </select>
        </div>

        <div className="control-group">
          <label>Circuit Ansatz:</label>
          <select value={ansatz} onChange={(e) => setAnsatz(e.target.value)} disabled={loading}>
            <option value="basic">Basic (Ry + CNOT + Rz)</option>
            <option value="layered">Layered (Deep Entangled)</option>
          </select>
        </div>

        <div className="control-group">
          <label>Max Epochs:</label>
          <select value={maxEpochs} onChange={(e) => setMaxEpochs(Number(e.target.value))} disabled={loading}>
            <option value={15}>15 Epochs (Fast)</option>
            <option value={30}>30 Epochs (Standard)</option>
            <option value={50}>50 Epochs (Deep)</option>
          </select>
        </div>

        <button className="train-btn" onClick={handleTrain} disabled={loading}>
          {loading ? '⚡ Training Qiskit Model...' : '🚀 Train VQC Model'}
        </button>
      </div>

      {error && <div className="qml-error-alert">{error}</div>}

      {result && (
        <div className="qml-results-wrapper">
          <div className="qml-metrics-strip">
            <div className="metric-box">
              <span className="metric-label">Quantum Accuracy</span>
              <span className="metric-value">{(result.accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Classical Baseline</span>
              <span className="metric-value">{(result.classical_accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Execution Time</span>
              <span className="metric-value">{result.training_time_ms} ms</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Params Trained</span>
              <span className="metric-value">{result.final_params.length}</span>
            </div>
          </div>

          <ComparisonPanel
            block={{
              type: 'qml_comparison',
              classicalModel: 'Logistic Baseline',
              quantumModel: `Live VQC (${ansatz})`,
              dataset,
              precomputedResults: {
                classical: {
                  accuracy: result.classical_accuracy,
                  boundary: result.classical_decision_boundary,
                },
                quantum: {
                  accuracy: result.accuracy,
                  lossHistory: result.loss_history,
                  boundary: result.decision_boundary,
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
