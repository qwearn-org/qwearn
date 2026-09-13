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

// ---------------------------------------------------------------------------
// Algorithm-specific Blocks
// ---------------------------------------------------------------------------

export interface StepCircuitGate {
  id: string;
  gate: string;
  qubits: number[];
  column: number;
  params?: Record<string, number>;
}

export interface StepCircuitBlock {
  type: 'step_circuit';
  numQubits: number;
  caption: string;
  gates: StepCircuitGate[];
  stepDescriptions: string[];
}

export interface ComplexityBlock {
  type: 'complexity';
  classical: string;
  quantum: string;
  speedup: string;
}

export interface QMLComparisonBlock {
  type: 'qml_comparison';
  classicalModel: string;
  quantumModel: string;
  dataset: string;
  precomputedResults: {
    classical: {
      accuracy: number;
      boundary: number[][];
    };
    quantum: {
      accuracy: number;
      lossHistory: number[];
      boundary: number[][];
    };
  };
}

export type ContentBlock =
  | TextBlock
  | MathBlock
  | HeadingBlock
  | CalloutBlock
  | CircuitBlock
  | MatrixBlock
  | BlochBlock
  | DividerBlock
  | StepCircuitBlock
  | ComplexityBlock
  | QMLComparisonBlock;

// ---------------------------------------------------------------------------
// QML Types
// ---------------------------------------------------------------------------

export interface QMLMeta {
  id: string;
  title: string;
  subtitle: string;
  order: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  estimatedMinutes: number;
  objectives: string[];
  complexity: {
    classical: string;
    quantum: string;
  };
  applications: string[];
}

export interface QMLTopic {
  meta: QMLMeta;
  content: { blocks: ContentBlock[] };
  quiz: LessonQuiz;
}

export interface QMLTrainingConfig {
  dataset: string;
  num_samples?: number;
  ansatz?: string;
  num_qubits?: number;
  max_epochs?: number;
}

export interface QMLTrainingResult {
  loss_history: number[];
  accuracy: number;
  final_params: number[];
  decision_boundary: number[][];
  classical_accuracy: number;
  classical_decision_boundary: number[][];
  training_time_ms: number;
}


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
// Algorithm Metadata (extends LessonMeta pattern)
// ---------------------------------------------------------------------------

export interface AlgorithmMeta {
  id: string;
  title: string;
  subtitle: string;
  order: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  estimatedMinutes: number;
  objectives: string[];
  complexity: {
    classical: string;
    quantum: string;
  };
  applications: string[];
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

// ---------------------------------------------------------------------------
// Full Algorithm
// ---------------------------------------------------------------------------

export interface Algorithm {
  meta: AlgorithmMeta;
  content: { blocks: ContentBlock[] };
  quiz: LessonQuiz;
}

// ---------------------------------------------------------------------------
// Challenge Types
// ---------------------------------------------------------------------------

export interface ChallengeMeta {
  id: string;
  title: string;
  subtitle: string;
  order: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  description: string;
  hint: string;
  objectives: string[];
}

export interface ChallengeSpec {
  id: string;
  evaluator_type: 'statevector' | 'probability' | 'equivalence';
  num_qubits: number;
  target_statevector?: number[][];
  target_probabilities?: Record<string, number>;
  target_circuit?: { num_qubits: number; gates: { gate: string; qubits: number[] }[] };
  tolerance: number;
  max_gates?: number | null;
}

export interface ChallengeData {
  meta: ChallengeMeta;
  spec: ChallengeSpec;
}

export interface EvaluationResult {
  passed: boolean;
  score: number;
  feedback: string;
  details: Record<string, unknown>;
}

