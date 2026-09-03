'use client';

/**
 * ResultOverlay — Shows challenge evaluation result with animation.
 *
 * Displays pass/fail status, fidelity score, feedback text,
 * and action buttons (Try Again / Next Challenge).
 */

import React, { useEffect, useState } from 'react';
import type { ChallengeEvalResult } from '@web/lib/api';

interface ResultOverlayProps {
  result: ChallengeEvalResult;
  onClose: () => void;
  onRetry: () => void;
  nextChallengeId?: string;
}

export default function ResultOverlay({
  result,
  onClose,
  onRetry,
  nextChallengeId,
}: ResultOverlayProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score from 0 to actual value
  useEffect(() => {
    const target = Math.round(result.score * 100);
    let current = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setAnimatedScore(current);
      if (current >= target) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [result.score]);

  return (
    <div className="result-overlay" onClick={onClose}>
      <div className="result-card" onClick={(e) => e.stopPropagation()}>
        {/* Status icon */}
        <div className={`result-icon ${result.passed ? 'passed' : 'failed'}`}>
          {result.passed ? '✓' : '✗'}
        </div>

        {/* Title */}
        <h2 className={`result-title ${result.passed ? 'passed' : 'failed'}`}>
          {result.passed ? 'Challenge Passed!' : 'Not Quite…'}
        </h2>

        {/* Score ring */}
        <div className="result-score-ring">
          <svg viewBox="0 0 120 120" className="score-svg">
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="#1e293b"
              strokeWidth="8"
            />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke={result.passed ? '#22c55e' : '#ef4444'}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - result.score)}`}
              strokeLinecap="round"
              className="score-progress"
            />
          </svg>
          <span className="score-value">{animatedScore}%</span>
        </div>

        {/* Feedback */}
        <p className="result-feedback">{result.feedback}</p>

        {/* Details */}
        {result.details && Object.keys(result.details).length > 0 && (
          <div className="result-details">
            {result.details.fidelity != null && (
              <span className="detail-item">
                Fidelity: {(result.details.fidelity as number).toFixed(4)}
              </span>
            )}
            {result.details.gate_count != null && (
              <span className="detail-item">
                Gates: {result.details.gate_count as number}
                {result.details.max_gates != null && ` / ${result.details.max_gates}`}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="result-actions">
          <button className="result-btn result-btn-retry" onClick={onRetry}>
            {result.passed ? 'Try Again' : 'Retry'}
          </button>
          {result.passed && nextChallengeId && (
            <a
              href={`/challenges/${nextChallengeId}`}
              className="result-btn result-btn-next"
            >
              Next Challenge →
            </a>
          )}
          {!result.passed && (
            <button className="result-btn result-btn-close" onClick={onClose}>
              Keep Editing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
