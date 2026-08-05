'use client';

/**
 * BlochDemo — Static Bloch sphere visualization for known states.
 * Reuses the SVG approach from ResultsPanel with preset coordinates.
 */

import React from 'react';

interface BlochDemoProps {
  description: string;
  state: 'zero' | 'one' | 'plus' | 'minus' | 'custom';
  customCoords?: { x: number; y: number; z: number };
}

const STATE_COORDS: Record<string, { x: number; y: number; z: number; label: string }> = {
  zero:  { x: 0, y: 0, z: 1,  label: '|0⟩' },
  one:   { x: 0, y: 0, z: -1, label: '|1⟩' },
  plus:  { x: 1, y: 0, z: 0,  label: '|+⟩' },
  minus: { x: -1, y: 0, z: 0, label: '|−⟩' },
};

export default function BlochDemo({ description, state, customCoords }: BlochDemoProps) {
  const coords = state === 'custom' && customCoords
    ? { ...customCoords, label: 'ψ' }
    : STATE_COORDS[state] || STATE_COORDS.zero;

  return (
    <div className="bloch-demo">
      <svg viewBox="-1.4 -1.4 2.8 2.8" className="bloch-demo-svg">
        {/* Sphere */}
        <circle cx="0" cy="0" r="1" fill="none" stroke="#334155" strokeWidth="0.02" />
        <ellipse cx="0" cy="0" rx="1" ry="0.3" fill="none" stroke="#475569" strokeWidth="0.01" strokeDasharray="0.04 0.04" />
        {/* Axes */}
        <line x1="-1.15" y1="0" x2="1.15" y2="0" stroke="#475569" strokeWidth="0.01" />
        <line x1="0" y1="-1.15" x2="0" y2="1.15" stroke="#475569" strokeWidth="0.01" />
        {/* Labels */}
        <text x="1.2" y="0.05" fontSize="0.11" fill="#94a3b8">x</text>
        <text x="0.05" y="-1.12" fontSize="0.11" fill="#94a3b8">z</text>
        <text x="0.06" y="-1.03" fontSize="0.09" fill="#6366f1">|0⟩</text>
        <text x="0.06" y="1.1" fontSize="0.09" fill="#ef4444">|1⟩</text>
        {/* State arrow */}
        <line x1="0" y1="0" x2={coords.x} y2={-coords.z}
          stroke="#22d3ee" strokeWidth="0.04" />
        <circle cx={coords.x} cy={-coords.z} r="0.07" fill="#22d3ee" />
        <text x={coords.x + 0.1} y={-coords.z + 0.05}
          fontSize="0.12" fill="#22d3ee" fontWeight="bold">
          {coords.label}
        </text>
      </svg>
      <p className="bloch-demo-desc">{description}</p>
    </div>
  );
}
