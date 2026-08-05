'use client';

/**
 * QuizPanel — Interactive assessment for lessons.
 *
 * Renders multiple-choice questions with instant feedback
 * and explanations. Tracks score locally.
 */

import React, { useState } from 'react';
import type { QuizQuestion } from '@web/lib/lesson-types';

interface QuizPanelProps {
  questions: QuizQuestion[];
  lessonId: string;
}

export default function QuizPanel({ questions, lessonId }: QuizPanelProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (revealed[questionId]) return; // Already answered
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleCheck = (questionId: string) => {
    setRevealed(prev => ({ ...prev, [questionId]: true }));
  };

  const totalAnswered = Object.keys(revealed).length;
  const totalCorrect = questions.filter(
    q => revealed[q.id] && answers[q.id] === q.correctIndex
  ).length;
  const allDone = totalAnswered === questions.length;

  return (
    <div className="quiz-panel">
      <h2 className="quiz-title">📝 Quiz</h2>

      {questions.map((q, qi) => {
        const selected = answers[q.id];
        const isRevealed = revealed[q.id];
        const isCorrect = isRevealed && selected === q.correctIndex;

        return (
          <div key={q.id} className={`quiz-question ${isRevealed ? (isCorrect ? 'correct' : 'incorrect') : ''}`}>
            <p className="quiz-question-text">
              <span className="quiz-number">{qi + 1}.</span> {q.question}
            </p>
            <div className="quiz-options">
              {q.options.map((opt, oi) => {
                let optClass = 'quiz-option';
                if (selected === oi) optClass += ' selected';
                if (isRevealed) {
                  if (oi === q.correctIndex) optClass += ' correct';
                  else if (oi === selected) optClass += ' incorrect';
                }
                return (
                  <button
                    key={oi}
                    className={optClass}
                    onClick={() => handleSelect(q.id, oi)}
                    disabled={isRevealed}
                  >
                    <span className="quiz-option-letter">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {!isRevealed && selected !== undefined && (
              <button className="quiz-check-btn" onClick={() => handleCheck(q.id)}>
                Check Answer
              </button>
            )}
            {isRevealed && (
              <div className={`quiz-explanation ${isCorrect ? 'correct' : 'incorrect'}`}>
                <span className="quiz-verdict">{isCorrect ? '✓ Correct!' : '✗ Not quite.'}</span>
                {' '}{q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {allDone && (
        <div className="quiz-score">
          <span className="quiz-score-text">
            Score: {totalCorrect}/{questions.length}
            {totalCorrect === questions.length ? ' 🎉 Perfect!' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
