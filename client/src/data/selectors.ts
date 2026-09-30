import { earnedPoints, totalThreeStars } from '../core/progress';
import { honors, me, players } from './mock';
import type { Honor, RankEntry, RankPeriod } from './types';

/**
 * Derived, live values (mock data + this browser's progress). With a backend
 * these come straight from the API; keep the function signatures.
 */

export const XP_PER_LEVEL = 300;

export const playerStats = () => {
  const earned = earnedPoints();
  const xp = me.baseXp + earned;
  return {
    points: me.basePoints + earned,
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    xpInLevel: xp % XP_PER_LEVEL,
    xpNext: XP_PER_LEVEL,
  };
};

/** Leaderboard of a period with my live score merged in and ranks recomputed. */
export const leaderboard = (period: RankPeriod): RankEntry[] => {
  const earned = earnedPoints();
  return players[period]
    .map((p) => (p.playerId === me.id ? { ...p, score: p.score + earned } : p))
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }));
};

export const honorList = (): Honor[] => {
  const mine = totalThreeStars() + 18;
  return honors.map((h) =>
    h.title === 'Nhiều 3 sao nhất' && mine > 21 ? { ...h, playerId: me.id, name: me.name, value: `${mine} level ★★★` } : h,
  );
};
