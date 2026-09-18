'use client';

/**
 * Futuristic Minimalist Quantum Progress & Coherence HUD
 *
 * Sci-fi HUD aesthetic featuring glowing coherence radar, live status telemetry,
 * gate/challenge matrix nodes, and achievement telemetry.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@web/components/common/Logo';
import Footer from '@web/components/common/Footer';
import { getLocalProgress, computeQuantumRank, type ProgressState } from '@web/lib/progress';
import { getAllLessonMetas } from '@web/lib/lessons';
import { getAllChallengeMetas } from '@web/lib/challenges';
import { getAllQMLMetas } from '@web/lib/qml';
import './progress.css';

export default function ProgressDashboardPage() {
  const [progress, setProgress] = useState<ProgressState | null>(null);

  useEffect(() => {
    setProgress(getLocalProgress());
  }, []);

  if (!progress) {
    return (
      <div className="futuristic-dashboard" style={{ textAlign: 'center', padding: '6rem 0', color: '#38bdf8', fontFamily: 'var(--font-mono, monospace)' }}>
        [INITIALIZING QUANTUM TELEMETRY...]
      </div>
    );
  }

  const rankInfo = computeQuantumRank(progress);
  const lessons = getAllLessonMetas();
  const challenges = getAllChallengeMetas();
  const qmlTopics = getAllQMLMetas();

  // Stats
  const completedLessonsCount = progress.completedLessons.length;
  const completedChallengesCount = progress.completedChallenges.length;
  const completedQMLCount = progress.completedQMLTopics.length;

  // Radar ring calculation (r=75 -> 2*pi*75 = 471)
  const strokeDashoffset = 471 - (471 * rankInfo.coherencePercent) / 100;

  // Achievements
  const achievements = [
    {
      id: 'first_lesson',
      title: 'SUPERPOSITION_INIT',
      desc: 'Completed initial quantum gate lesson',
      icon: '⚡',
      unlocked: completedLessonsCount >= 1,
    },
    {
      id: 'quiz_master',
      title: 'FIDELITY_ANALYST',
      desc: 'Achieved 100% score on a quiz module',
      icon: '🎯',
      unlocked: progress.completedLessons.some((l) => l.totalQuestions > 0 && l.quizScore === l.totalQuestions),
    },
    {
      id: 'circuit_master',
      title: 'CIRCUIT_PIONEER',
      desc: 'Executed 5+ custom circuits on Aer simulator',
      icon: '🔮',
      unlocked: progress.circuitsExecuted >= 5,
    },
    {
      id: 'challenge_hero',
      title: 'ORACLE_SOLVER',
      desc: 'Evaluated & solved a quantum challenge spec',
      icon: '🏆',
      unlocked: completedChallengesCount >= 1,
    },
    {
      id: 'qml_pioneer',
      title: 'VQC_OPTIMIZER',
      desc: 'Trained a Variational Quantum Classifier',
      icon: '🧠',
      unlocked: completedQMLCount >= 1,
    },
    {
      id: 'quantum_architect',
      title: 'QUANTUM_ARCHITECT',
      desc: 'Reached 80%+ system-wide coherence',
      icon: '👑',
      unlocked: rankInfo.coherencePercent >= 80,
    },
  ];

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand"><Logo size={28} /></Link>
        <div className="nav-links">
          <Link href="/learn" className="nav-link">Learn</Link>
          <Link href="/algorithms" className="nav-link">Algorithms</Link>
          <Link href="/challenges" className="nav-link">Challenges</Link>
          <Link href="/qml" className="nav-link">QML</Link>
          <Link href="/research" className="nav-link">Research</Link>
          <Link href="/progress" className="nav-link nav-link-active">Progress</Link>
          <Link href="/playground" className="nav-link">Playground</Link>
        </div>
      </nav>

      <main className="futuristic-dashboard">
        {/* Top Telemetry Status Bar */}
        <div className="hud-status-bar">
          <div className="hud-status-item">
            <span className="status-dot"></span>
            <span>STATUS: QUANTUM_COHERENT</span>
          </div>
          <div className="hud-status-item">
            <span>SESSION: {progress.sessionId.slice(0, 14)}...</span>
          </div>
          <div className="hud-status-item">
            <span>LATENCY: 0.12ms</span>
          </div>
        </div>

        {/* Futuristic Hero HUD */}
        <section className="futuristic-hero">
          <div className="hero-main-content">
            <span className="hero-tag">[ RANK LEVEL {rankInfo.level} // COHERENCE TELEMETRY ]</span>
            <h1 className="hero-title-text">{rankInfo.rankName}</h1>
            <p className="hero-sub-text">
              Real-time quantum coherence metrics derived from circuit execution fidelity, algorithm completions, and quiz performance.
            </p>
          </div>

          {/* Radar Core Dial */}
          <div className="radar-core-container">
            <svg className="radar-svg" viewBox="0 0 170 170">
              <defs>
                <linearGradient id="radar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <circle className="radar-track" cx="85" cy="85" r="75" />
              <circle
                className="radar-progress"
                cx="85"
                cy="85"
                r="75"
                style={{ strokeDashoffset }}
              />
            </svg>
            <div className="radar-center-info">
              <div className="radar-number">{rankInfo.coherencePercent}%</div>
              <div className="radar-label">COHERENCE</div>
            </div>
          </div>
        </section>

        {/* Minimalist Stats Strip */}
        <section className="stats-strip">
          <div className="hud-stat-box">
            <span className="hud-stat-header">LESSONS_MASTERED</span>
            <span className="hud-stat-num">{completedLessonsCount} / {lessons.length}</span>
          </div>

          <div className="hud-stat-box">
            <span className="hud-stat-header">CHALLENGES_SOLVED</span>
            <span className="hud-stat-num">{completedChallengesCount} / {challenges.length}</span>
          </div>

          <div className="hud-stat-box">
            <span className="hud-stat-header">QML_MODELS</span>
            <span className="hud-stat-num">{completedQMLCount} / {qmlTopics.length}</span>
          </div>

          <div className="hud-stat-box">
            <span className="hud-stat-header">SIMULATIONS</span>
            <span className="hud-stat-num">{progress.circuitsExecuted}</span>
          </div>
        </section>

        {/* Gate Lessons Matrix */}
        <div className="futuristic-section-title">
          <h2>📘 Gate Lessons Telemetry</h2>
          <span className="section-code-tag">// Q-GATE_MATRIX</span>
        </div>
        <div className="futuristic-grid">
          {lessons.map((lesson, idx) => {
            const record = progress.completedLessons.find((l) => l.lessonId === lesson.id);
            const isDone = !!record;

            return (
              <Link
                key={lesson.id}
                href={`/learn/${lesson.id}`}
                className={`futuristic-card ${isDone ? 'completed' : ''}`}
              >
                <div className="futuristic-card-top">
                  <span className="card-code">GATE_0{idx + 1}</span>
                  <span className={`status-pill-minimal ${isDone ? 'done' : 'pending'}`}>
                    {isDone ? '● ONLINE' : '○ PENDING'}
                  </span>
                </div>

                <h3 className="futuristic-card-title">{lesson.title}</h3>

                <div className="futuristic-card-footer">
                  <span>⏱ {lesson.estimatedMinutes}m</span>
                  {isDone && record.totalQuestions > 0 ? (
                    <span style={{ color: '#4ade80' }}>QUIZ: {record.quizScore}/{record.totalQuestions}</span>
                  ) : (
                    <span>READY</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Challenge Spectrum */}
        <div className="futuristic-section-title">
          <h2>🏆 Challenge Spectrum</h2>
          <span className="section-code-tag">// EVALUATOR_SUITE</span>
        </div>
        <div className="futuristic-grid">
          {challenges.map((c, idx) => {
            const record = progress.completedChallenges.find((ch) => ch.challengeId === c.id);
            const isDone = !!record;

            return (
              <Link
                key={c.id}
                href={`/challenges/${c.id}`}
                className={`futuristic-card ${isDone ? 'completed' : ''}`}
              >
                <div className="futuristic-card-top">
                  <span className="card-code">CHALLENGE_0{idx + 1}</span>
                  <span className={`status-pill-minimal ${isDone ? 'done' : 'pending'}`}>
                    {isDone ? '● SOLVED' : '○ UNSOLVED'}
                  </span>
                </div>

                <h3 className="futuristic-card-title">{c.title}</h3>

                <div className="futuristic-card-footer">
                  <span>{c.difficulty.toUpperCase()}</span>
                  <span>{isDone ? '100% MATCH' : 'START'}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Achievements Section */}
        <div className="futuristic-section-title">
          <h2>🎖️ Quantum Achievement Badges</h2>
          <span className="section-code-tag">// BADGE_TELEMETRY</span>
        </div>
        <div className="badge-grid">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`futuristic-badge-card ${ach.unlocked ? 'unlocked' : ''}`}
            >
              <div className="badge-icon-box">{ach.icon}</div>
              <div className="badge-info">
                <span className="badge-name">{ach.title}</span>
                <span className="badge-desc">{ach.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
