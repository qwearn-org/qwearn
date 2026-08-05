/**
 * TypeScript types for the lesson content schema.
 *
 * These types mirror the JSON structure in content/lessons/.
 * They're used by the lesson loader and renderer components.
 */

import type { PlacedGate } from '@web/components/circuit/CircuitGrid';

// ---------------------------------------------------------------------------
// Content Blocks
// ---------------------------------------------------------------------------

export interface TextBlock {
  type: 'text';
  body: string;
}

export interface MathBlock {
  type: 'math';
  latex: string;
  display: boolean;
}

export interface HeadingBlock {
  type: 'heading';
  text: string;
  level: 2 | 3;
}

export interface CalloutBlock {
  type: 'callout';
  variant: 'info' | 'warning' | 'tip';
  body: string;
}

export interface CircuitBlock {
  type: 'circuit';
  preset: PlacedGate[];
  numQubits: number;
  caption: string;
  readonly: boolean;
  autoRun: boolean;
}

export interface MatrixBlock {
  type: 'matrix';
  label: string;
  rows: string[][];
}

export interface BlochBlock {
  type: 'bloch';
  description: string;
  state: 'zero' | 'one' | 'plus' | 'minus' | 'custom';
  customCoords?: { x: number; y: number; z: number };
}

export interface DividerBlock {
  type: 'divider';
}

export type ContentBlock =
  | TextBlock
  | MathBlock
  | HeadingBlock
  | CalloutBlock
  | CircuitBlock
  | MatrixBlock
  | BlochBlock
  | DividerBlock;

// ---------------------------------------------------------------------------
// Lesson Metadata
// ---------------------------------------------------------------------------

export interface LessonMeta {
  id: string;
  title: string;
  subtitle: string;
  order: number;
  gate: string;
  prerequisites: string[];
  estimatedMinutes: number;
  objectives: string[];
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonQuiz {
  questions: QuizQuestion[];
}

// ---------------------------------------------------------------------------
// Full Lesson
// ---------------------------------------------------------------------------

export interface Lesson {
  meta: LessonMeta;
  content: { blocks: ContentBlock[] };
  quiz: LessonQuiz;
}
