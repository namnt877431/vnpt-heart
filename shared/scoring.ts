import type { GameSpec } from './game-types';

/**
 * Stars & points rules from the script (docs/game-design.md):
 *   ⭐   = hoàn thành          (≥ 50% correct)
 *   ⭐⭐  = hoàn thành tốt      (≥ 80% correct)
 *   ⭐⭐⭐ = nhanh và chính xác  (100% correct and within par time, if the level has one)
 * Points: correct answers + stars + 3-star bonus + speed bonus (+ x2 when Double XP).
 */

export interface GameNote {
  ok: boolean;
  text: string;
}

export interface GameResult {
  correct: number;
  total: number;
  timeMs: number;
  /** Player ran out of lives/time before finishing. */
  failed?: boolean;
  /** Explanations shown on the result screen ("Xem kiến thức/giải thích"). */
  notes: GameNote[];
}

export const PASS_STARS = 1;

export const starsFor = (r: GameResult, parTimeSec?: number): 0 | 1 | 2 | 3 => {
  if (r.failed || r.total === 0) return 0;
  const ratio = r.correct / r.total;
  if (ratio >= 1 && (!parTimeSec || r.timeMs <= parTimeSec * 1000)) return 3;
  if (ratio >= 0.8) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
};

export const pointsFor = (r: GameResult, stars: number, parTimeSec?: number, doubleXp = false): number => {
  if (stars === 0) return 0;
  const speed = parTimeSec ? Math.max(0, Math.min(30, Math.round(parTimeSec - r.timeMs / 1000))) : 0;
  const base = r.correct * 10 + stars * 20 + (stars === 3 ? 30 : 0) + speed;
  return doubleXp ? base * 2 : base;
};

// ------------------------------------------------------------------ server-side checks
// (used by the server to reject impossible submissions; kept here so the rules sit next
// to how each game module reports `total`.)


/** The `total` each game module reports when finished normally. */
export const expectedTotal = (spec: GameSpec): number => {
  switch (spec.type) {
    case 'choice': return spec.questions.length;
    case 'dialogue': return spec.turns.length * 2;
    case 'spot-errors': return spec.lines.flat().filter((p) => typeof p !== 'string').length;
    case 'match': return spec.pairs.length;
    case 'order': return spec.steps.length;
    case 'binary': return spec.items.length;
    case 'hazard': return spec.hazards.length;
    case 'investigate': return 1;
    case 'escape': return spec.locks.length;
    case 'boss': return spec.steps.length;
  }
};

/** Fastest believable completion: ~0.3 s per answer plus a small floor. */
export const minPlayMs = (total: number): number => 1500 + total * 300;

/** Why a reported result is impossible for `spec`, or null when it is acceptable. */
export const invalidResult = (spec: GameSpec, r: Pick<GameResult, 'correct' | 'total' | 'timeMs' | 'failed'>): string | null => {
  const expected = expectedTotal(spec);
  // a timed-out game without its own timeout handler reports total 1 (see ui/screens/level.ts)
  const totalOk = r.total === expected || (r.failed && r.total === 1);
  if (!Number.isInteger(r.correct) || !Number.isInteger(r.total) || !totalOk) return 'Số câu không khớp với level';
  if (r.correct < 0 || r.correct > r.total) return 'Số câu đúng không hợp lệ';
  if (!Number.isFinite(r.timeMs) || r.timeMs < 0) return 'Thời gian không hợp lệ';
  if (r.timeMs < minPlayMs(r.total)) return 'Hoàn thành nhanh bất thường';
  if (spec.timeLimitSec && r.timeMs > spec.timeLimitSec * 1000 + 5000 && !r.failed) return 'Quá thời gian cho phép';
  return null;
};
