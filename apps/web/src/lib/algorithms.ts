/**
 * Algorithm loader — imports algorithm content from JSON files.
 *
 * Same pattern as lessons.ts: static imports at build time for SSG.
 */

import type { Algorithm, AlgorithmMeta, ContentBlock, LessonQuiz } from './lesson-types';

// Static imports for all algorithm metadata + content + quizzes.
import meta01 from '../../../../content/algorithms/01-superdense-coding/meta.json';
import content01 from '../../../../content/algorithms/01-superdense-coding/content.json';
import quiz01 from '../../../../content/algorithms/01-superdense-coding/quiz.json';

import meta02 from '../../../../content/algorithms/02-teleportation/meta.json';
import content02 from '../../../../content/algorithms/02-teleportation/content.json';
import quiz02 from '../../../../content/algorithms/02-teleportation/quiz.json';

import meta03 from '../../../../content/algorithms/03-deutsch/meta.json';
import content03 from '../../../../content/algorithms/03-deutsch/content.json';
import quiz03 from '../../../../content/algorithms/03-deutsch/quiz.json';

import meta04 from '../../../../content/algorithms/04-deutsch-jozsa/meta.json';
import content04 from '../../../../content/algorithms/04-deutsch-jozsa/content.json';
import quiz04 from '../../../../content/algorithms/04-deutsch-jozsa/quiz.json';

import meta05 from '../../../../content/algorithms/05-bernstein-vazirani/meta.json';
import content05 from '../../../../content/algorithms/05-bernstein-vazirani/content.json';
import quiz05 from '../../../../content/algorithms/05-bernstein-vazirani/quiz.json';

import meta06 from '../../../../content/algorithms/06-grovers-search/meta.json';
import content06 from '../../../../content/algorithms/06-grovers-search/content.json';
import quiz06 from '../../../../content/algorithms/06-grovers-search/quiz.json';

const ALL_ALGORITHMS: Algorithm[] = [
  { meta: meta01 as AlgorithmMeta, content: content01 as { blocks: ContentBlock[] }, quiz: quiz01 as LessonQuiz },
  { meta: meta02 as AlgorithmMeta, content: content02 as { blocks: ContentBlock[] }, quiz: quiz02 as LessonQuiz },
  { meta: meta03 as AlgorithmMeta, content: content03 as { blocks: ContentBlock[] }, quiz: quiz03 as LessonQuiz },
  { meta: meta04 as AlgorithmMeta, content: content04 as { blocks: ContentBlock[] }, quiz: quiz04 as LessonQuiz },
  { meta: meta05 as AlgorithmMeta, content: content05 as { blocks: ContentBlock[] }, quiz: quiz05 as LessonQuiz },
  { meta: meta06 as AlgorithmMeta, content: content06 as { blocks: ContentBlock[] }, quiz: quiz06 as LessonQuiz },
];

/** Get all algorithm metadata (for the index page). */
export function getAllAlgorithmMetas(): AlgorithmMeta[] {
  return ALL_ALGORITHMS.map((a) => a.meta).sort((a, b) => a.order - b.order);
}

/** Get a full algorithm by its ID. */
export function getAlgorithmById(id: string): Algorithm | undefined {
  return ALL_ALGORITHMS.find((a) => a.meta.id === id);
}

/** Get the next algorithm after the given ID. */
export function getNextAlgorithm(currentId: string): AlgorithmMeta | undefined {
  const sorted = getAllAlgorithmMetas();
  const idx = sorted.findIndex((m) => m.id === currentId);
  return idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : undefined;
}

/** Get the previous algorithm before the given ID. */
export function getPrevAlgorithm(currentId: string): AlgorithmMeta | undefined {
  const sorted = getAllAlgorithmMetas();
  const idx = sorted.findIndex((m) => m.id === currentId);
  return idx > 0 ? sorted[idx - 1] : undefined;
}

/** Get all algorithm IDs. */
export function getAllAlgorithmIds(): string[] {
  return ALL_ALGORITHMS.map((a) => a.meta.id);
}
