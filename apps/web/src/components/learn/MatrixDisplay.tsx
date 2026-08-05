'use client';

/**
 * MatrixDisplay — Renders quantum gate matrices with bracket notation.
 * Uses KaTeX to render individual cells that may contain LaTeX.
 */

import React from 'react';
import MathBlock from './MathBlock';

interface MatrixDisplayProps {
  label: string;
  rows: string[][];
}

export default function MatrixDisplay({ label, rows }: MatrixDisplayProps) {
  // Check if this is actually a truth table (has header row with text)
  const isTruthTable = rows.length > 0 && rows[0].some(cell =>
    cell.toLowerCase().includes('input') || cell.toLowerCase().includes('output')
  );

  if (isTruthTable) {
    return (
      <div className="matrix-container">
        <table className="truth-table">
          <thead>
            <tr>
              {rows[0].map((cell, i) => (
                <th key={i}>{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci}><MathBlock latex={cell} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Render as a matrix with brackets
  return (
    <div className="matrix-container">
      <span className="matrix-label">{label} = </span>
      <div className="matrix-bracket">
        <div className="matrix-bracket-left" />
        <table className="matrix-table">
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci}><MathBlock latex={cell} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="matrix-bracket-right" />
      </div>
    </div>
  );
}
