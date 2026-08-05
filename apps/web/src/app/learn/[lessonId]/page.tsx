'use client';

/**
 * Individual Lesson Page — Dynamic route for /learn/[lessonId]
 *
 * Loads lesson content, renders it via LessonRenderer, shows the
 * quiz at the end, and provides prev/next navigation.
 */

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getLessonById, getNextLesson, getPrevLesson, getAllLessonMetas } from '@web/lib/lessons';
import LessonRenderer from '@web/components/learn/LessonRenderer';
import QuizPanel from '@web/components/learn/QuizPanel';
import LessonSidebar from '@web/components/learn/LessonSidebar';
import type { ContentBlock } from '@web/lib/lesson-types';
import '../learn.css';

export default function LessonPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;

  const lesson = getLessonById(lessonId);
  const allMetas = getAllLessonMetas();
  const prevLesson = getPrevLesson(lessonId);
  const nextLesson = getNextLesson(lessonId);

  if (!lesson) {
    return (
      <>
        <nav className="nav">
          <Link href="/" className="nav-brand">⚛️ Qwearn</Link>
          <div className="nav-links">
            <Link href="/learn" className="nav-link nav-link-active">Learn</Link>
            <Link href="/playground" className="nav-link">Circuit Playground</Link>
          </div>
        </nav>
        <main className="lesson-not-found">
          <h1>Lesson not found</h1>
          <p>The lesson &quot;{lessonId}&quot; doesn&apos;t exist.</p>
          <Link href="/learn" className="btn-primary">← Back to lessons</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand">⚛️ Qwearn</Link>
        <div className="nav-links">
          <Link href="/learn" className="nav-link nav-link-active">Learn</Link>
          <Link href="/playground" className="nav-link">Circuit Playground</Link>
        </div>
      </nav>

      <div className="lesson-layout">
        <LessonSidebar lessons={allMetas} currentId={lessonId} />

        <main className="lesson-main">
          <div className="lesson-header">
            <div className="lesson-meta">
              <span className="lesson-order">Lesson {lesson.meta.order}</span>
              <span className="lesson-time">⏱ {lesson.meta.estimatedMinutes} min</span>
            </div>
            <h1 className="lesson-title">{lesson.meta.title}</h1>
            <p className="lesson-subtitle">{lesson.meta.subtitle}</p>
            <div className="lesson-objectives">
              <h3>What you&apos;ll learn:</h3>
              <ul>
                {lesson.meta.objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          </div>

          <LessonRenderer blocks={lesson.content.blocks as ContentBlock[]} />

          <QuizPanel questions={lesson.quiz.questions} lessonId={lessonId} />

          <div className="lesson-nav">
            {prevLesson ? (
              <Link href={`/learn/${prevLesson.id}`} className="lesson-nav-btn lesson-nav-prev">
                ← {prevLesson.title}
              </Link>
            ) : <div />}
            {nextLesson ? (
              <Link href={`/learn/${nextLesson.id}`} className="lesson-nav-btn lesson-nav-next">
                {nextLesson.title} →
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
