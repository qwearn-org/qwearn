'use client';

/**
 * SaveLoadPanel — Circuit persistence UI.
 *
 * Allows users to save their current circuit with a title,
 * view a list of previously saved circuits, and load/delete them.
 * Uses anonymous session-based identification (localStorage UUID).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  saveCircuit,
  listSavedCircuits,
  deleteSavedCircuit,
  type CircuitSaveResponse,
  type CircuitSpec,
} from '@web/lib/api';

interface SaveLoadPanelProps {
  /** Current circuit state to save. */
  currentCircuit: CircuitSpec;
  /** Called when user loads a saved circuit. */
  onLoadCircuit: (spec: CircuitSpec, title: string) => void;
  /** Whether the circuit has any gates (disable save if empty). */
  hasGates: boolean;
}

export default function SaveLoadPanel({
  currentCircuit,
  onLoadCircuit,
  hasGates,
}: SaveLoadPanelProps) {
  const [saves, setSaves] = useState<CircuitSaveResponse[]>([]);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Load saved circuits on mount
  const fetchSaves = useCallback(async () => {
    try {
      const list = await listSavedCircuits();
      setSaves(list);
    } catch {
      // Silently fail — saves are a convenience feature
    }
  }, []);

  useEffect(() => {
    fetchSaves();
  }, [fetchSaves]);

  const handleSave = async () => {
    if (!title.trim() || !hasGates) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      await saveCircuit(title.trim(), currentCircuit);
      setTitle('');
      setFeedback('✓ Saved!');
      setTimeout(() => setFeedback(null), 2000);
      await fetchSaves();
    } catch (e) {
      setFeedback(`✗ ${e instanceof Error ? e.message : 'Save failed'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = (save: CircuitSaveResponse) => {
    onLoadCircuit(save.circuit_spec, save.title);
    setIsOpen(false);
  };

  const handleDelete = async (saveId: string) => {
    try {
      await deleteSavedCircuit(saveId);
      setSaves((prev) => prev.filter((s) => s.id !== saveId));
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="save-load-panel">
      <button
        className="save-load-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>💾 Saved Circuits</span>
        <span className="save-load-count">{saves.length}</span>
        <span className={`save-load-chevron ${isOpen ? 'open' : ''}`}>▾</span>
      </button>

      {isOpen && (
        <div className="save-load-content">
          {/* Save form */}
          <div className="save-form">
            <input
              type="text"
              className="save-input"
              placeholder="Circuit name..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              maxLength={100}
            />
            <button
              className="btn btn-save"
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !hasGates}
            >
              {isSaving ? '...' : 'Save'}
            </button>
          </div>
          {feedback && (
            <div className={`save-feedback ${feedback.startsWith('✓') ? 'success' : 'error'}`}>
              {feedback}
            </div>
          )}

          {/* Saved circuits list */}
          <div className="saves-list">
            {saves.length === 0 ? (
              <div className="saves-empty">No saved circuits yet</div>
            ) : (
              saves.map((save) => (
                <div key={save.id} className="save-item">
                  <button
                    className="save-item-load"
                    onClick={() => handleLoad(save)}
                    title={`Load "${save.title}"`}
                  >
                    <span className="save-item-title">{save.title}</span>
                    <span className="save-item-meta">
                      {save.circuit_spec.gates.length} gates · {save.circuit_spec.num_qubits}q
                    </span>
                  </button>
                  <button
                    className="save-item-delete"
                    onClick={() => handleDelete(save.id)}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
