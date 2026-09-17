'use client';

/**
 * Individual Challenge Page — /challenges/[challengeId]
 *
 * Two-panel layout:
 * - Left: Goal description, target state visualization, hints
 * - Right: ChallengeBuilder with embedded CircuitGrid
 */

import React, { useState } from 'react';
import Link from 'next/link';
import Logo from '@web/components/common/Logo';
import { useParams } from 'next/navigation';
import { getChallengeById, getNextChallenge, getPrevChallenge } from '@web/lib/challenges';
import ChallengeBuilder from '@web/components/challenges/ChallengeBuilder';
import '../challenges.css';
import '../../learn/learn.css';

export default function ChallengePage() {
  const params = useParams();
  const challengeId = params.challengeId as string;
  const [showHint, setShowHint] = useState(false);

  const challenge = getChallengeById(challengeId);
  const prevCh = getPrevChallenge(challengeId);
  const nextCh = getNextChallenge(challengeId);

  if (!challenge) {
    return (
      <>
        <nav className="nav">
          <Link href="/" className="nav-brand"><Logo size={28} /></Link>
          <div className="nav-links">
            <Link href="/learn" className="nav-link">Learn</Link>
            <Link href="/algorithms" className="nav-link">Algorithms</Link>
            <Link href="/challenges" className="nav-link nav-link-active">Challenges</Link>
            <Link href="/qml" className="nav-link">QML</Link>
            <Link href="/research" className="nav-link">Research</Link>
            <Link href="/playground" className="nav-link">Playground</Link>
          </div>
        </nav>
        <main className="lesson-not-found">
          <h1>Challenge not found</h1>
          <p>The challenge &quot;{challengeId}&quot; doesn&apos;t exist.</p>
          <Link href="/challenges" className="btn-primary">← Back to challenges</Link>
        </main>
      </>
    );
  }

  const { meta, spec } = challenge;

  // Build target visualization data
  const targetProbs = spec.target_probabilities
    ? Object.entries(spec.target_probabilities).sort(([a], [b]) => a.localeCompare(b))
    : null;

  const evalTypeLabel = {
    statevector: 'State Match',
    probability: 'Probability Match',
    equivalence: 'Equivalence',
  }[spec.evaluator_type];

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand"><Logo size={28} /></Link>
        <div className="nav-links">
          <Link href="/learn" className="nav-link">Learn</Link>
          <Link href="/algorithms" className="nav-link">Algorithms</Link>
          <Link href="/challenges" className="nav-link nav-link-active">Challenges</Link>
          <Link href="/qml" className="nav-link">QML</Link>
          <Link href="/research" className="nav-link">Research</Link>
          <Link href="/playground" className="nav-link">Playground</Link>
        </div>
      </nav>

      <main className="challenge-detail">
        <div className="challenge-detail-header">
          <div className="challenge-detail-meta">
            <span className={`algo-card-difficulty difficulty-${meta.difficulty}`}>
              {meta.difficulty}
            </span>
            <span className="challenge-type-badge">{evalTypeLabel}</span>
            <span className="lesson-time">⏱ {meta.estimatedMinutes} min</span>
          </div>
          <h1 className="challenge-detail-title">{meta.title}</h1>
          <p className="challenge-detail-desc">{meta.description}</p>
        </div>

        <div className="challenge-detail-layout">
          {/* Left: Goal Panel */}
          <div className="challenge-goal-panel">
            {/* Target visualization */}
            {targetProbs && (
              <div className="goal-section">
                <div className="goal-section-title">Target Probabilities</div>
                <div className="goal-target-probs">
                  {targetProbs.map(([state, prob]) => (
                    <div key={state} className="goal-prob-row">
                      <span className="goal-prob-label">|{state}⟩</span>
                      <div className="goal-prob-track">
                        <div
                          className="goal-prob-fill"
                          style={{ width: `${(prob as number) * 100}%` }}
                        />
                      </div>
                      <span className="goal-prob-value">
                        {((prob as number) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {spec.evaluator_type === 'statevector' && (
              <div className="goal-section">
                <div className="goal-section-title">Goal</div>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                  Build a circuit on {spec.num_qubits} qubit{spec.num_qubits > 1 ? 's' : ''} that
                  produces the target quantum state. Fidelity must be ≥ {((1 - spec.tolerance) * 100).toFixed(0)}%.
                </p>
              </div>
            )}

            {spec.evaluator_type === 'equivalence' && spec.target_circuit && (
              <div className="goal-section">
                <div className="goal-section-title">Reference Circuit</div>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                  The reference uses {spec.target_circuit.gates.length} gates:{' '}
                  {spec.target_circuit.gates.map((g) => g.gate).join(' → ')}.
                  Reproduce the same output.
                </p>
              </div>
            )}

            {/* Constraints */}
            {spec.max_gates != null && (
              <div className="goal-section">
                <div className="goal-constraint">
                  ⚡ Max {spec.max_gates} gate{spec.max_gates !== 1 ? 's' : ''} allowed
                </div>
              </div>
            )}

            {/* Learning objectives */}
            <div className="goal-section">
              <div className="goal-section-title">Objectives</div>
              <div className="goal-objectives">
                {meta.objectives.map((obj, i) => (
                  <span key={i} className="goal-objective">{obj}</span>
                ))}
              </div>
            </div>

            {/* Hint */}
            <div className="goal-section">
              <div className="goal-hint">
                <button className="hint-toggle" onClick={() => setShowHint(!showHint)}>
                  {showHint ? '🔒 Hide Hint' : '💡 Show Hint'}
                </button>
                {showHint && <p className="hint-text">{meta.hint}</p>}
              </div>
            </div>
          </div>

          {/* Right: Circuit Builder */}
          <ChallengeBuilder
            challengeId={challengeId}
            numQubits={spec.num_qubits}
            spec={spec}
          />
        </div>

        {/* Nav */}
        <div className="challenge-nav">
          {prevCh ? (
            <Link href={`/challenges/${prevCh.id}`} className="lesson-nav-btn lesson-nav-prev">
              ← {prevCh.title}
            </Link>
          ) : <div />}
          {nextCh ? (
            <Link href={`/challenges/${nextCh.id}`} className="lesson-nav-btn lesson-nav-next">
              {nextCh.title} →
            </Link>
          ) : (
            <Link href="/playground" className="lesson-nav-btn lesson-nav-next">
              Open Playground →
            </Link>
          )}
        </div>
      </main>
    </>
  );
}
