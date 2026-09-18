/**
 * Progress Management Library — Syncs learner progress locally and via backend.
 */

const STORAGE_KEY = 'qwearn_user_progress_v1';
const SESSION_KEY = 'qwearn_session_id';

export interface ProgressState {
  sessionId: string;
  completedLessons: { lessonId: string; quizScore: number; totalQuestions: number; completedAt: string }[];
  completedChallenges: { challengeId: string; score: number; completedAt: string }[];
  completedQMLTopics: string[];
  circuitsExecuted: number;
}

/** Get or generate client session ID. */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr-session';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Get current progress from localStorage. */
export function getLocalProgress(): ProgressState {
  const defaultState: ProgressState = {
    sessionId: getSessionId(),
    completedLessons: [],
    completedChallenges: [],
    completedQMLTopics: [],
    circuitsExecuted: 0,
  };

  if (typeof window === 'undefined') return defaultState;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed, sessionId: getSessionId() };
  } catch {
    return defaultState;
  }
}

/** Save progress to localStorage. */
export function saveLocalProgress(state: ProgressState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

/** Record a completed lesson locally + sync to backend. */
export async function markLessonComplete(
  lessonId: string,
  quizScore: number = 0,
  totalQuestions: number = 0
): Promise<void> {
  const current = getLocalProgress();
  const existingIdx = current.completedLessons.findIndex((l) => l.lessonId === lessonId);

  const newItem = {
    lessonId,
    quizScore,
    totalQuestions,
    completedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    current.completedLessons[existingIdx] = {
      ...current.completedLessons[existingIdx],
      quizScore: Math.max(current.completedLessons[existingIdx].quizScore, quizScore),
      totalQuestions,
    };
  } else {
    current.completedLessons.push(newItem);
  }

  saveLocalProgress(current);

  // Sync to API (fire & forget)
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    await fetch(`${apiUrl}/api/progress/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: current.sessionId,
        lesson_id: lessonId,
        quiz_score: quizScore,
        total_questions: totalQuestions,
      }),
    });
  } catch {
    // Offline mode / backend optional
  }
}

/** Record a completed challenge locally + sync to backend. */
export async function markChallengeComplete(
  challengeId: string,
  score: number = 1.0
): Promise<void> {
  const current = getLocalProgress();
  const existingIdx = current.completedChallenges.findIndex((c) => c.challengeId === challengeId);

  const newItem = {
    challengeId,
    score,
    completedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    current.completedChallenges[existingIdx].score = Math.max(
      current.completedChallenges[existingIdx].score,
      score
    );
  } else {
    current.completedChallenges.push(newItem);
  }

  saveLocalProgress(current);

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    await fetch(`${apiUrl}/api/progress/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: current.sessionId,
        challenge_id: challengeId,
        score,
      }),
    });
  } catch {
    // Offline mode
  }
}

/** Record circuit execution count locally + sync to backend. */
export async function incrementCircuitCount(): Promise<void> {
  const current = getLocalProgress();
  current.circuitsExecuted += 1;
  saveLocalProgress(current);

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    await fetch(`${apiUrl}/api/progress/increment-circuits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: current.sessionId }),
    });
  } catch {
    // Offline mode
  }
}

/** Compute Quantum Rank based on total completions. */
export function computeQuantumRank(progress: ProgressState): {
  rankName: string;
  badge: string;
  level: number;
  coherencePercent: number;
  nextRankThreshold: number;
} {
  const totalLessons = 7;
  const totalChallenges = 4;
  const totalQML = 4;
  const totalItems = totalLessons + totalChallenges + totalQML;

  const completedCount =
    progress.completedLessons.length +
    progress.completedChallenges.length +
    progress.completedQMLTopics.length;

  const coherencePercent = Math.min(100, Math.round((completedCount / totalItems) * 100));

  if (completedCount >= 12) {
    return { rankName: 'Quantum Architect', badge: '⚛️👑', level: 4, coherencePercent, nextRankThreshold: 15 };
  } else if (completedCount >= 7) {
    return { rankName: 'Entanglement Expert', badge: '🌌⚡', level: 3, coherencePercent, nextRankThreshold: 12 };
  } else if (completedCount >= 3) {
    return { rankName: 'Superposition Specialist', badge: '🔮✨', level: 2, coherencePercent, nextRankThreshold: 7 };
  } else {
    return { rankName: 'Qubit Initiate', badge: '🟢⚛️', level: 1, coherencePercent, nextRankThreshold: 3 };
  }
}
