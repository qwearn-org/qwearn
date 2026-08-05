'use client';

/**
 * LessonSidebar — Navigation sidebar for the learn module.
 * Shows all lessons with completion indicators and current highlight.
 */

import React from 'react';
import Link from 'next/link';
import type { LessonMeta } from '@web/lib/lesson-types';

interface LessonSidebarProps {
  lessons: LessonMeta[];
  currentId?: string;
}

/** Gate color mapping (matches CircuitGrid) */
const GATE_COLORS: Record<string, string> = {
  X: '#ef4444', Y: '#f97316', Z: '#eab308', H: '#6366f1',
  Phase: '#14b8a6', CX: '#8b5cf6', CCX: '#d946ef',
};

export default function LessonSidebar({ lessons, currentId }: LessonSidebarProps) {
  return (
    <nav className="lesson-sidebar">
      <h3 className="sidebar-title">📚 Gate Lessons</h3>
      <div className="sidebar-lessons">
        {lessons.map((lesson) => {
          const isCurrent = lesson.id === currentId;
          const color = GATE_COLORS[lesson.gate] || '#64748b';
          return (
            <Link
              key={lesson.id}
              href={`/learn/${lesson.id}`}
              className={`sidebar-lesson ${isCurrent ? 'active' : ''}`}
            >
              <span
                className="sidebar-gate-badge"
                style={{ backgroundColor: color }}
              >
                {lesson.gate}
              </span>
              <div className="sidebar-lesson-info">
                <span className="sidebar-lesson-title">{lesson.title}</span>
                <span className="sidebar-lesson-time">{lesson.estimatedMinutes} min</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
