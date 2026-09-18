'use client';

/**
 * Quantum Coherence & Progress Dashboard Page
 *
 * Unique, interactive dashboard displaying learner rank, coherence score,
 * completed module matrix, quiz accuracy, and unlocked achievement badges.
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
      <div className="progress-dashboard" style={{ textAlign: 'center', padding: '5rem 0', color: '#94a3b8' }}>
        Loading Quantum Coherence Data...
      </div>
    );
  }

  const rankInfo = computeQuantumRank(progress);
  const lessons = getAllLessonMetas();
  const challenges = getAllChallengeMetas();
  const qmlTopics = getAllQMLMetas();

  // Compute stats
  const completedLessonsCount = progress.completedLessons.length;
  const completedChallengesCount = progress.completedChallenges.length;
  const completedQMLCount = progress.completedQMLTopics.length;

  const totalQuizScore = progress.completedLessons.reduce((acc, l) => acc + l.quizScore, 0);
  const totalQuizQuestions = progress.completedLessons.reduce((acc, l) => acc + l.totalQuestions, 0);
  const quizAccuracyPercent = totalQuizQuestions > 0 ? Math.round((totalQuizScore / totalQuizQuestions) * 100) : 100;

  // SVG stroke-dashoffset for circular ring (radius 60 -> circumference ~377)
  const strokeDashoffset = 377 - (377 * rankInfo.coherencePercent) / 100;

  // Achievements
  const achievements = [
    {
      id: 'first_lesson',
      title: 'First Superposition',
      desc: 'Completed your first quantum gate lesson',
      icon: '✨',
      unlocked: completedLessonsCount >= 1,
    },
    {
      id: 'quiz_master',
      title: 'Coherence Analyst',
      desc: 'Scored 100% on a lesson quiz',
      icon: '🎯',
      unlocked: progress.completedLessons.some((l) => l.totalQuestions > 0 && l.quizScore === l.totalQuestions),
    },
    {
      id: 'circuit_master',
      title: 'Circuit Architect',
      desc: 'Executed 5+ custom quantum circuits',
      icon: '⚡',
      unlocked: progress.circuitsExecuted >= 5,
    },
    {
      id: 'challenge_hero',
      title: 'Quantum Solver',
      desc: 'Successfully solved a quantum challenge',
      icon: '🏆',
      unlocked: completedChallengesCount >= 1,
    },
    {
      id: 'qml_pioneer',
      title: 'QML Optimizer',
      desc: 'Completed a Variational Quantum Classifier module',
      icon: '🧠',
      unlocked: completedQMLCount >= 1,
    },
    {
      id: 'quantum_architect',
      title: 'Grand Quantum Master',
      desc: 'Achieved 80%+ total platform coherence',
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

      <main className="progress-dashboard">
        {/* Hero Section */}
        <section className="dashboard-hero">
          <div className="hero-rank-info">
            <span className="hero-rank-badge">
              {rankInfo.badge} Level {rankInfo.level}
            </span>
            <h1 className="hero-rank-title">{rankInfo.rankName}</h1>
            <p className="hero-rank-desc">
              Your quantum coherence measures your overall mastery across gate theory, algorithm implementation, challenge solving, and QML models.
            </p>
          </div>

          {/* Coherence Dial */}
          <div className="coherence-dial-container">
            <svg className="coherence-ring-svg" viewBox="0 0 140 140">
              <defs>
                <linearGradient id="coherence-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <circle className="coherence-ring-bg" cx="70" cy="70" r="60" />
              <circle
                className="coherence-ring-fill"
                cx="70"
                cy="70"
                r="60"
                style={{ strokeDashoffset }}
              />
            </svg>
            <div className="coherence-dial-text">
              <div className="coherence-percent">{rankInfo.coherencePercent}%</div>
              <div className="coherence-label">Coherence</div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper">📘</div>
            <div className="stat-content">
              <span className="stat-value">{completedLessonsCount} / {lessons.length}</span>
              <span className="stat-label">Lessons Mastered</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper">🏆</div>
            <div className="stat-content">
              <span className="stat-value">{completedChallengesCount} / {challenges.length}</span>
              <span className="stat-label">Challenges Solved</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper">🧠</div>
            <div className="stat-content">
              <span className="stat-value">{completedQMLCount} / {qmlTopics.length}</span>
              <span className="stat-label">QML Modules Done</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper">⚡</div>
            <div className="stat-content">
              <span className="stat-value">{progress.circuitsExecuted}</span>
              <span className="stat-label">Circuits Simulated</span>
            </div>
          </div>
        </section>

        {/* Learn Module Coherence Matrix */}
        <h2 className="section-title">📘 Learn Gate Lessons Matrix</h2>
        <div className="matrix-grid">
          {lessons.map((lesson) => {
            const record = progress.completedLessons.find((l) => l.lessonId === lesson.id);
            const isDone = !!record;

            return (
              <Link
                key={lesson.id}
                href={`/learn/${lesson.id}`}
                className={`matrix-card ${isDone ? 'completed' : ''}`}
              >
                <div className="matrix-card-header">
                  <span className="matrix-card-type">{lesson.gate} Gate</span>
                  <span className={`status-badge ${isDone ? 'done' : 'pending'}`}>
                    {isDone ? '✓ Mastered' : 'Pending'}
                  </span>
                </div>
                <h3 className="matrix-card-title">{lesson.title}</h3>
                <div className="matrix-card-meta">
                  <span>⏱ {lesson.estimatedMinutes} min</span>
                  {isDone && record.totalQuestions > 0 && (
                    <span>Quiz: {record.quizScore}/{record.totalQuestions}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Challenges Matrix */}
        <h2 className="section-title">🏆 Challenge Spectrum</h2>
        <div className="matrix-grid">
          {challenges.map((c) => {
            const record = progress.completedChallenges.find((ch) => ch.challengeId === c.id);
            const isDone = !!record;

            return (
              <Link
                key={c.id}
                href={`/challenges/${c.id}`}
                className={`matrix-card ${isDone ? 'completed' : ''}`}
              >
                <div className="matrix-card-header">
                  <span className="matrix-card-type">{c.difficulty}</span>
                  <span className={`status-badge ${isDone ? 'done' : 'pending'}`}>
                    {isDone ? '✓ Solved' : 'Unsolved'}
                  </span>
                </div>
                <h3 className="matrix-card-title">{c.title}</h3>
                <div className="matrix-card-meta">
                  <span>{c.subtitle}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Achievements Section */}
        <h2 className="section-title">🎖️ Quantum Achievements</h2>
        <div className="achievements-grid">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`achievement-card ${ach.unlocked ? 'unlocked' : ''}`}
            >
              <div className="achievement-icon">{ach.icon}</div>
              <div>
                <h4 className="achievement-title">{ach.title}</h4>
                <p className="achievement-desc">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
