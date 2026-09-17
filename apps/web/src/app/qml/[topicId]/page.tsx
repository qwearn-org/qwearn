'use client';

/**
 * Individual QML Topic Page — Dynamic route for /qml/[topicId]
 */

import React from 'react';
import Link from 'next/link';
import Logo from '@web/components/common/Logo';
import Footer from '@web/components/common/Footer';
import { useParams } from 'next/navigation';
import { getNextQMLTopic, getPrevQMLTopic, getQMLTopicById } from '@web/lib/qml';
import LessonRenderer from '@web/components/learn/LessonRenderer';
import QuizPanel from '@web/components/learn/QuizPanel';
import LiveTrainer from '@web/components/qml/LiveTrainer';
import '../qml.css';
import '../../learn/learn.css';

export default function QMLTopicPage() {
  const params = useParams();
  const topicId = params.topicId as string;

  const topic = getQMLTopicById(topicId);
  const prevTopic = getPrevQMLTopic(topicId);
  const nextTopic = getNextQMLTopic(topicId);

  if (!topic) {
    return (
      <>
        <nav className="nav">
          <Link href="/" className="nav-brand"><Logo size={28} /></Link>
          <div className="nav-links">
            <Link href="/learn" className="nav-link">Learn</Link>
            <Link href="/algorithms" className="nav-link">Algorithms</Link>
            <Link href="/challenges" className="nav-link">Challenges</Link>
            <Link href="/qml" className="nav-link nav-link-active">QML</Link>
            <Link href="/research" className="nav-link">Research</Link>
            <Link href="/playground" className="nav-link">Playground</Link>
          </div>
        </nav>
        <main className="lesson-not-found">
          <h1>QML Topic not found</h1>
          <p>The topic &quot;{topicId}&quot; doesn&apos;t exist.</p>
          <Link href="/qml" className="btn-primary">← Back to QML Index</Link>
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
          <Link href="/algorithms" className="nav-link">Algorithms</Link>
          <Link href="/challenges" className="nav-link">Challenges</Link>
          <Link href="/qml" className="nav-link nav-link-active">QML</Link>
          <Link href="/research" className="nav-link">Research</Link>
          <Link href="/playground" className="nav-link">Playground</Link>
        </div>
      </nav>

      <main className="lesson-layout">
        <header className="lesson-header">
          <div className="lesson-header-meta">
            <Link href="/qml" className="back-link">← QML Module</Link>
            <span className="lesson-badge">{topic.meta.difficulty}</span>
            <span className="lesson-time">⏱ {topic.meta.estimatedMinutes} min</span>
          </div>

          <h1 className="lesson-title">{topic.meta.title}</h1>
          <p className="lesson-subtitle">{topic.meta.subtitle}</p>

          <div className="lesson-objectives">
            <h3>What you&apos;ll learn:</h3>
            <ul>
              {topic.meta.objectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </div>
        </header>

        <section className="lesson-body">
          <LessonRenderer blocks={topic.content.blocks} />
        </section>

        {/* Live Trainer Section */}
        <section className="live-trainer-section">
          <LiveTrainer />
        </section>

        {/* Quiz Section */}
        {topic.quiz && topic.quiz.questions && topic.quiz.questions.length > 0 && (
          <section className="quiz-section">
            <h2 className="lesson-h2">Knowledge Check</h2>
            <QuizPanel questions={topic.quiz.questions} lessonId={topic.meta.id} />
          </section>
        )}

        {/* Prev / Next Navigation */}
        <nav className="lesson-nav-footer">
          {prevTopic ? (
            <Link href={`/qml/${prevTopic.id}`} className="lesson-nav-btn prev">
              <span className="nav-btn-label">← Previous</span>
              <span className="nav-btn-title">{prevTopic.title}</span>
            </Link>
          ) : (
            <div />
          )}

          {nextTopic ? (
            <Link href={`/qml/${nextTopic.id}`} className="lesson-nav-btn next">
              <span className="nav-btn-label">Next →</span>
              <span className="nav-btn-title">{nextTopic.title}</span>
            </Link>
          ) : (
            <Link href="/qml" className="lesson-nav-btn complete">
              <span className="nav-btn-label">Complete!</span>
              <span className="nav-btn-title">Return to QML Index →</span>
            </Link>
          )}
        </nav>
      </main>

      <Footer />
    </>
  );
}
