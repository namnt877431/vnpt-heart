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
