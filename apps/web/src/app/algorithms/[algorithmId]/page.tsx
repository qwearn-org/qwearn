'use client';

/**
 * Individual Algorithm Page — Dynamic route for /algorithms/[algorithmId]
 *
 * Loads algorithm content, renders it via LessonRenderer, shows the
 * quiz at the end, and provides prev/next navigation.
 */

import React from 'react';
import Link from 'next/link';
import Logo from '@web/components/common/Logo';
import { useParams } from 'next/navigation';
import { getAlgorithmById, getNextAlgorithm, getPrevAlgorithm, getAllAlgorithmMetas } from '@web/lib/algorithms';
import LessonRenderer from '@web/components/learn/LessonRenderer';
import QuizPanel from '@web/components/learn/QuizPanel';
import type { ContentBlock } from '@web/lib/lesson-types';
import '../algorithms.css';
import '../../learn/learn.css';

export default function AlgorithmPage() {
  const params = useParams();
  const algorithmId = params.algorithmId as string;

  const algorithm = getAlgorithmById(algorithmId);
  const allMetas = getAllAlgorithmMetas();
  const prevAlgo = getPrevAlgorithm(algorithmId);
  const nextAlgo = getNextAlgorithm(algorithmId);

  if (!algorithm) {
    return (
      <>
        <nav className="nav">
          <Link href="/" className="nav-brand"><Logo size={28} /></Link>
          <div className="nav-links">
            <Link href="/learn" className="nav-link">Learn</Link>
            <Link href="/algorithms" className="nav-link nav-link-active">Algorithms</Link>
            <Link href="/playground" className="nav-link">Circuit Playground</Link>
          </div>
        </nav>
        <main className="lesson-not-found">
          <h1>Algorithm not found</h1>
          <p>The algorithm &quot;{algorithmId}&quot; doesn&apos;t exist.</p>
          <Link href="/algorithms" className="btn-primary">← Back to algorithms</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand"><Logo size={28} /></Link>
        <div className="nav-links">
          <Link href="/learn" className="nav-link">Learn</Link>
          <Link href="/algorithms" className="nav-link nav-link-active">Algorithms</Link>
          <Link href="/playground" className="nav-link">Circuit Playground</Link>
        </div>
      </nav>

      <div className="lesson-layout">
        {/* Sidebar */}
        <aside className="algo-sidebar">
          <div className="algo-sidebar-title">Algorithms</div>
          <div className="algo-sidebar-list">
            {allMetas.map((meta) => (
              <Link
                key={meta.id}
                href={`/algorithms/${meta.id}`}
                className={`algo-sidebar-item ${meta.id === algorithmId ? 'active' : ''}`}
              >
                <span className="algo-sidebar-order">{meta.order}</span>
                <div className="algo-sidebar-info">
                  <span className="algo-sidebar-name">{meta.title}</span>
                  <span className="algo-sidebar-diff">{meta.difficulty}</span>
                </div>
              </Link>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="lesson-main">
          <div className="lesson-header">
            <div className="lesson-meta">
              <span className="lesson-order">Algorithm {algorithm.meta.order}</span>
              <span className={`algo-card-difficulty difficulty-${algorithm.meta.difficulty}`}>
                {algorithm.meta.difficulty}
              </span>
              <span className="lesson-time">⏱ {algorithm.meta.estimatedMinutes} min</span>
            </div>
            <h1 className="lesson-title">{algorithm.meta.title}</h1>
            <p className="lesson-subtitle">{algorithm.meta.subtitle}</p>
            <div className="lesson-objectives">
              <h3>What you&apos;ll learn:</h3>
              <ul>
                {algorithm.meta.objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
            <div className="algo-apps-list">
              {algorithm.meta.applications.map((app, i) => (
                <span key={i} className="algo-app-pill">{app}</span>
              ))}
            </div>
          </div>

          <LessonRenderer blocks={algorithm.content.blocks as ContentBlock[]} />

          <QuizPanel questions={algorithm.quiz.questions} lessonId={algorithmId} />

          <div className="lesson-nav">
            {prevAlgo ? (
              <Link href={`/algorithms/${prevAlgo.id}`} className="lesson-nav-btn lesson-nav-prev">
                ← {prevAlgo.title}
              </Link>
            ) : <div />}
            {nextAlgo ? (
              <Link href={`/algorithms/${nextAlgo.id}`} className="lesson-nav-btn lesson-nav-next">
                {nextAlgo.title} →
              </Link>
            ) : (
              <Link href="/playground" className="lesson-nav-btn lesson-nav-next">
                Open Playground →
              </Link>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
