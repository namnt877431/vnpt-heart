/**
 * Domain types. These mirror the shapes the future backend API should return,
 * so swapping mock.ts for real fetch calls should not change UI code.
 */
export interface Player {
  id: string;
  name: string;
  role: string;
  groupId: string;
  level: number;
  xp: number;
  xpNext: number;
  stars: number;
  weeklyRank: number;
}

export type StageStatus = 'done' | 'current' | 'locked';

export interface Stage {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  /** Asset key of the building drawn on the island (see config/assets.ts). */
  building: string;
  status: StageStatus;
  starsEarned: number;
  maxStars: number;
  questionCount: number;
  rewardXp: number;
  /** 'quiz' opens the question screen; 'boss' opens the Gunny-style boss fight. */
  mode: 'quiz' | 'boss';
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

export interface QuizQuestion {
  id: string;
  stageId: number;
  index: number;
  total: number;
  text: string;
  options: string[];
  hint: string;
  timeLimitSec: number;
}

export interface BossInfo {
  name: string;
  hp: number;
  hpMax: number;
}
