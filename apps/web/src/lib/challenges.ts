/**
 * Challenge loader — imports challenge content from JSON files.
 *
 * Same pattern as lessons.ts / algorithms.ts: static imports at build time.
 */

import type { ChallengeMeta, ChallengeSpec, ChallengeData } from './lesson-types';

// Static imports
import meta01 from '../../../../content/challenges/01-bell-state/meta.json';
import spec01 from '../../../../content/challenges/01-bell-state/spec.json';

import meta02 from '../../../../content/challenges/02-superposition/meta.json';
import spec02 from '../../../../content/challenges/02-superposition/spec.json';

import meta03 from '../../../../content/challenges/03-ghz-state/meta.json';
import spec03 from '../../../../content/challenges/03-ghz-state/spec.json';

import meta04 from '../../../../content/challenges/04-circuit-optimization/meta.json';
import spec04 from '../../../../content/challenges/04-circuit-optimization/spec.json';

const ALL_CHALLENGES: ChallengeData[] = [
  { meta: meta01 as ChallengeMeta, spec: spec01 as ChallengeSpec },
  { meta: meta02 as ChallengeMeta, spec: spec02 as ChallengeSpec },
  { meta: meta03 as ChallengeMeta, spec: spec03 as ChallengeSpec },
  { meta: meta04 as ChallengeMeta, spec: spec04 as ChallengeSpec },
];

/** Get all challenge metadata (for the index page). */
export function getAllChallengeMetas(): ChallengeMeta[] {
  return ALL_CHALLENGES.map((c) => c.meta).sort((a, b) => a.order - b.order);
}

/** Get a full challenge by its ID. */
export function getChallengeById(id: string): ChallengeData | undefined {
  return ALL_CHALLENGES.find((c) => c.meta.id === id);
}

/** Get the next challenge after the given ID. */
export function getNextChallenge(currentId: string): ChallengeMeta | undefined {
  const sorted = getAllChallengeMetas();
  const idx = sorted.findIndex((m) => m.id === currentId);
  return idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : undefined;
}

/** Get the previous challenge before the given ID. */
export function getPrevChallenge(currentId: string): ChallengeMeta | undefined {
  const sorted = getAllChallengeMetas();
  const idx = sorted.findIndex((m) => m.id === currentId);
  return idx > 0 ? sorted[idx - 1] : undefined;
}
