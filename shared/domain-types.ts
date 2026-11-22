/**
 * Domain types. These mirror the shapes the future backend API should return,
 * so swapping mock.ts for real fetch calls should not change UI code.
 * Level/chapter content types live in data/content/types.ts and data/game-types.ts.
 */
export interface Player {
  id: string;
  name: string;
  role: string;
  groupId: string;
  /** Points earned before this demo session (server total in production). */
  basePoints: number;
  /** XP earned before this demo session. */
  baseXp: number;
}

export interface RankEntry {
  rank: number;
  playerId: string;
  name: string;
  role: string;
  score: number;
}

export interface GroupRank {
  rank: number;
  groupId: string;
  name: string;
  avgScore: number;
  members: number;
  /** % of members who played in the period. */
  participation: number;
  /** Bonus from period achievements (boss clears, events). */
  periodBonus: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  /** Icon name from src/ui/icons.ts */
  icon: string;
  earned: boolean;
  /** 0..1, shown for badges not yet earned. */
  progress: number;
}

export interface Mission {
  id: string;
  title: string;
  progress: number;
  target: number;
  rewardStars: number;
}

export interface Honor {
  title: string;
  icon: string;
  playerId: string;
  name: string;
  value: string;
}

export type RankPeriod = 'week' | 'month' | 'season';
