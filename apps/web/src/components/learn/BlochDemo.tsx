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

import BlochSphere3D from '@web/components/visualization/BlochSphere3D';

export default function BlochDemo({ description, state, customCoords }: BlochDemoProps) {
  const coords = state === 'custom' && customCoords
    ? { ...customCoords, label: '|ψ⟩' }
    : STATE_COORDS[state] || STATE_COORDS.zero;

  return (
    <div className="bloch-demo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <BlochSphere3D
        x={coords.x}
        y={coords.y}
        z={coords.z}
        label={coords.label}
        interactive={true}
      />
      <p className="bloch-demo-desc" style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
        {description}
      </p>
    </div>
  );
}
