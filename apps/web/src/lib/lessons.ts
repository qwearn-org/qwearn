/**
 * Lesson loader — imports lesson content from JSON files.
 *
 * Since lesson content is static, we import it at build time
 * using dynamic imports. This enables SSG and zero-latency
 * page loads without a backend API for lessons.
 */

import type { Lesson, LessonMeta } from './lesson-types';

// Static imports for all lesson metadata + content + quizzes.
// Each lesson is a directory under content/lessons/.
// The import paths are relative to the monorepo root, resolved by Next.js.

const LESSON_DIRS = [
  '01-x-gate',
  '02-z-gate',
  '03-h-gate',
  '04-y-gate',
  '05-phase-gate',
  '06-cnot-gate',
  '07-toffoli-gate',
] as const;

// Pre-import all lesson data
import meta01 from '../../../../content/lessons/01-x-gate/meta.json';
import content01 from '../../../../content/lessons/01-x-gate/content.json';
import quiz01 from '../../../../content/lessons/01-x-gate/quiz.json';

import meta02 from '../../../../content/lessons/02-z-gate/meta.json';
import content02 from '../../../../content/lessons/02-z-gate/content.json';
import quiz02 from '../../../../content/lessons/02-z-gate/quiz.json';

import meta03 from '../../../../content/lessons/03-h-gate/meta.json';
import content03 from '../../../../content/lessons/03-h-gate/content.json';
import quiz03 from '../../../../content/lessons/03-h-gate/quiz.json';

import meta04 from '../../../../content/lessons/04-y-gate/meta.json';
import content04 from '../../../../content/lessons/04-y-gate/content.json';
import quiz04 from '../../../../content/lessons/04-y-gate/quiz.json';

import meta05 from '../../../../content/lessons/05-phase-gate/meta.json';
import content05 from '../../../../content/lessons/05-phase-gate/content.json';
import quiz05 from '../../../../content/lessons/05-phase-gate/quiz.json';

import meta06 from '../../../../content/lessons/06-cnot-gate/meta.json';
import content06 from '../../../../content/lessons/06-cnot-gate/content.json';
import quiz06 from '../../../../content/lessons/06-cnot-gate/quiz.json';

import meta07 from '../../../../content/lessons/07-toffoli-gate/meta.json';
import content07 from '../../../../content/lessons/07-toffoli-gate/content.json';
import quiz07 from '../../../../content/lessons/07-toffoli-gate/quiz.json';

const ALL_LESSONS: Lesson[] = [
  { meta: meta01 as LessonMeta, content: content01 as Lesson['content'], quiz: quiz01 as Lesson['quiz'] },
  { meta: meta02 as LessonMeta, content: content02 as Lesson['content'], quiz: quiz02 as Lesson['quiz'] },
  { meta: meta03 as LessonMeta, content: content03 as Lesson['content'], quiz: quiz03 as Lesson['quiz'] },
  { meta: meta04 as LessonMeta, content: content04 as Lesson['content'], quiz: quiz04 as Lesson['quiz'] },
  { meta: meta05 as LessonMeta, content: content05 as Lesson['content'], quiz: quiz05 as Lesson['quiz'] },
  { meta: meta06 as LessonMeta, content: content06 as Lesson['content'], quiz: quiz06 as Lesson['quiz'] },
  { meta: meta07 as LessonMeta, content: content07 as Lesson['content'], quiz: quiz07 as Lesson['quiz'] },
];

/** Get all lesson metadata (for the lesson index page). */
export function getAllLessonMetas(): LessonMeta[] {
  return ALL_LESSONS.map((l) => l.meta).sort((a, b) => a.order - b.order);
}

/** Get a full lesson by its ID. */
export function getLessonById(id: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.meta.id === id);
}

/** Get the next lesson after the given ID. */
export function getNextLesson(currentId: string): LessonMeta | undefined {
  const sorted = getAllLessonMetas();
  const idx = sorted.findIndex((m) => m.id === currentId);
  return idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : undefined;
}

/** Get the previous lesson before the given ID. */
export function getPrevLesson(currentId: string): LessonMeta | undefined {
  const sorted = getAllLessonMetas();
  const idx = sorted.findIndex((m) => m.id === currentId);
  return idx > 0 ? sorted[idx - 1] : undefined;
}

/** Get all lesson IDs (for static path generation). */
export function getAllLessonIds(): string[] {
  return ALL_LESSONS.map((l) => l.meta.id);
}
