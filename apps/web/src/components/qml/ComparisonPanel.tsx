'use client';

import React, { useEffect, useRef } from 'react';
import type { QMLComparisonBlock } from '@web/lib/lesson-types';

interface ComparisonPanelProps {
  block: QMLComparisonBlock;
}

/** Render a 20x20 decision boundary grid on an HTML5 canvas. */
function HeatmapCanvas({ boundary, title, accuracy }: { boundary: number[][]; title: string; accuracy: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !boundary || boundary.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rows = boundary.length;
    const cols = boundary[0].length;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = boundary[r][c]; // 0.0 .. 1.0 probability
        // Cyan (#00f2fe) for 0, Purple (#7f00ff) for 1
        const rCol = Math.round(127 * val);
        const gCol = Math.round(242 * (1 - val));
        const bCol = Math.round(254 * (1 - val) + 255 * val);
        ctx.fillStyle = `rgb(${rCol}, ${gCol}, ${bCol})`;
        ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
      }
    }
  }, [boundary]);

  return (
    <div className="qml-heatmap-card">
      <div className="qml-heatmap-header">
        <span className="qml-heatmap-title">{title}</span>
        <span className="qml-acc-badge">
          Accuracy: <strong>{(accuracy * 100).toFixed(1)}%</strong>
        </span>
      </div>
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={240} height={240} className="qml-canvas" />
      </div>
      <div className="qml-heatmap-legend">
        <span className="legend-label">Class 0 (|0⟩)</span>
        <div className="legend-gradient" />
        <span className="legend-label">Class 1 (|1⟩)</span>
      </div>
    </div>
  );
}

export default function ComparisonPanel({ block }: ComparisonPanelProps) {
  const { classicalModel, quantumModel, precomputedResults } = block;
  const lossHist = precomputedResults.quantum.lossHistory || [];

  return (
    <div className="qml-comparison-container">
      <div className="qml-comparison-grid">
        <HeatmapCanvas
          title={`Classical Baseline (${classicalModel})`}
          boundary={precomputedResults.classical.boundary}
          accuracy={precomputedResults.classical.accuracy}
        />
        <HeatmapCanvas
          title={`Quantum Model (${quantumModel})`}
          boundary={precomputedResults.quantum.boundary}
          accuracy={precomputedResults.quantum.accuracy}
        />
      </div>

      {lossHist.length > 0 && (
        <div className="qml-loss-card">
          <div className="qml-loss-header">
            <h4>Quantum Optimization Loss Curve</h4>
            <span className="qml-loss-sub">Iterative convergence (COBYLA)</span>
          </div>
          <div className="qml-loss-bars">
            {lossHist.map((val, idx) => {
              const heightPct = Math.max(10, Math.min(100, (1 - val) * 100));
              return (
                <div key={idx} className="qml-loss-bar-col" title={`Epoch ${idx + 1}: Loss ${val}`}>
                  <div className="qml-loss-bar" style={{ height: `${heightPct}%` }} />
                  <span className="qml-loss-label">{idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
