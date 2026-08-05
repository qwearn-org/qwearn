/**
 * Learn Module — Lesson Index Page
 *
 * Shows all available lessons as cards with gate badges,
 * titles, descriptions, and estimated completion times.
 */

import Link from 'next/link';
import { getAllLessonMetas } from '@web/lib/lessons';
import './learn.css';

const GATE_COLORS: Record<string, string> = {
  X: '#ef4444', Y: '#f97316', Z: '#eab308', H: '#6366f1',
  Phase: '#14b8a6', CX: '#8b5cf6', CCX: '#d946ef',
};

export const metadata = {
  title: 'Learn — Qwearn',
  description: 'Interactive quantum computing lessons. Learn quantum gates from X to Toffoli with live circuit simulations.',
};

export default function LearnPage() {
  const lessons = getAllLessonMetas();

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand">⚛️ Qwearn</Link>
        <div className="nav-links">
          <Link href="/learn" className="nav-link nav-link-active">Learn</Link>
          <Link href="/playground" className="nav-link">Circuit Playground</Link>
        </div>
      </nav>

      <main className="learn-index">
        <div className="learn-hero">
          <h1 className="learn-hero-title">Learn Quantum Gates</h1>
          <p className="learn-hero-desc">
            Master quantum computing one gate at a time. Each lesson includes
            interactive circuit demos, real math, and quizzes to test your understanding.
          </p>
        </div>

        <div className="learn-grid">
          {lessons.map((lesson, i) => {
            const color = GATE_COLORS[lesson.gate] || '#64748b';
            return (
              <Link
                key={lesson.id}
                href={`/learn/${lesson.id}`}
                className="lesson-card"
              >
                <div className="lesson-card-header">
                  <span className="lesson-card-number">Lesson {i + 1}</span>
                  <span className="lesson-card-time">⏱ {lesson.estimatedMinutes} min</span>
                </div>
                <div className="lesson-card-gate" style={{ backgroundColor: color }}>
                  {lesson.gate}
                </div>
                <h2 className="lesson-card-title">{lesson.title}</h2>
                <p className="lesson-card-subtitle">{lesson.subtitle}</p>
                <div className="lesson-card-objectives">
                  {lesson.objectives.slice(0, 2).map((obj, j) => (
                    <span key={j} className="lesson-card-objective">• {obj}</span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
