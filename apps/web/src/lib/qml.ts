/**
 * QML loader — imports Quantum Machine Learning topic content from JSON files.
 */

import type { ContentBlock, LessonQuiz, QMLMeta, QMLTopic } from './lesson-types';

import meta01 from '../../../../content/qml/01-data-encoding/meta.json';
import content01 from '../../../../content/qml/01-data-encoding/content.json';
import quiz01 from '../../../../content/qml/01-data-encoding/quiz.json';

import meta02 from '../../../../content/qml/02-vqc/meta.json';
import content02 from '../../../../content/qml/02-vqc/content.json';
import quiz02 from '../../../../content/qml/02-vqc/quiz.json';

import meta03 from '../../../../content/qml/03-quantum-kernel/meta.json';
import content03 from '../../../../content/qml/03-quantum-kernel/content.json';
import quiz03 from '../../../../content/qml/03-quantum-kernel/quiz.json';

import meta04 from '../../../../content/qml/04-hybrid-nn/meta.json';
import content04 from '../../../../content/qml/04-hybrid-nn/content.json';
import quiz04 from '../../../../content/qml/04-hybrid-nn/quiz.json';

const ALL_QML_TOPICS: QMLTopic[] = [
  { meta: meta01 as QMLMeta, content: content01 as { blocks: ContentBlock[] }, quiz: quiz01 as LessonQuiz },
  { meta: meta02 as QMLMeta, content: content02 as { blocks: ContentBlock[] }, quiz: quiz02 as LessonQuiz },
  { meta: meta03 as QMLMeta, content: content03 as { blocks: ContentBlock[] }, quiz: quiz03 as LessonQuiz },
  { meta: meta04 as QMLMeta, content: content04 as { blocks: ContentBlock[] }, quiz: quiz04 as LessonQuiz },
];

/** Get all QML metadata (for index page). */
export function getAllQMLMetas(): QMLMeta[] {
  return ALL_QML_TOPICS.map((t) => t.meta).sort((a, b) => a.order - b.order);
}

/** Get a full QML topic by ID. */
export function getQMLTopicById(id: string): QMLTopic | undefined {
  return ALL_QML_TOPICS.find((t) => t.meta.id === id);
}

/** Get next QML topic. */
export function getNextQMLTopic(currentId: string): QMLMeta | undefined {
  const sorted = getAllQMLMetas();
  const idx = sorted.findIndex((m) => m.id === currentId);
  return idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : undefined;
}

/** Get previous QML topic. */
export function getPrevQMLTopic(currentId: string): QMLMeta | undefined {
  const sorted = getAllQMLMetas();
  const idx = sorted.findIndex((m) => m.id === currentId);
  return idx > 0 ? sorted[idx - 1] : undefined;
}

/** Get all QML topic IDs. */
export function getAllQMLIds(): string[] {
  return ALL_QML_TOPICS.map((t) => t.meta.id);
}
