import { DEMO } from '../config/demo';
import type { Chapter } from '../data/content';
import { CHAPTERS } from '../data/content';
import { bus } from './events';
import { PASS_STARS } from './scoring';

/**
 * Player progress. DEMO ONLY: stored in this browser's localStorage.
 * With a backend, keep this module's API and back it with server calls.
 */

export interface LevelRecord {
  stars: number;
  bestPoints: number;
  plays: number;
}

export interface SharedStory {
  at: string;
  unit: string;
  situation: string;
  problem: string;
  handling: string;
  difficulty: string;
  outcome: string;
  lesson: string;
  anonymous: boolean;
}

interface ProgressState {
  v: 1;
  levels: Record<string, LevelRecord>;
  /** Points from mystery gifts etc. */
  bonusPoints: number;
  /** Next finished level earns double points. */
  doubleXpNext: boolean;
  /** Chapters whose robot intro has been shown. */
  seenIntros: string[];
  stories: SharedStory[];
}

const KEY = 'vnpt-heart:progress:v1';

const fresh = (): ProgressState => ({ v: 1, levels: {}, bonusPoints: 0, doubleXpNext: false, seenIntros: [], stories: [] });

const seeded = (): ProgressState => {
  const s = fresh();
  if (DEMO.seedProgress) {
    s.levels['van-hoa-1'] = { stars: 3, bestPoints: 110, plays: 1 };
    s.levels['van-hoa-2'] = { stars: 2, bestPoints: 80, plays: 2 };
  }
  return s;
};

const load = (): ProgressState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProgressState;
      if (parsed.v === 1) return { ...fresh(), ...parsed };
    }
  } catch {
    /* storage blocked or corrupt: fall through */
  }
  return seeded();
};

let state = load();

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode etc.: progress lives for this session only */
  }
  bus.emit('progress:changed');
};

// ------------------------------------------------------------------ queries

export const levelRecord = (levelId: string): LevelRecord | undefined => state.levels[levelId];

export const isLevelDone = (levelId: string): boolean => (state.levels[levelId]?.stars ?? 0) >= PASS_STARS;

export const isChapterDone = (chapter: Chapter): boolean => chapter.levels.every((l) => isLevelDone(l.id));

export const isChapterUnlocked = (chapter: Chapter): boolean => {
  if (DEMO.unlockAllChapters || chapter.order === 1) return true;
  const prev = CHAPTERS.find((c) => c.order === chapter.order - 1);
  return !prev || isChapterDone(prev);
};

export const isLevelUnlocked = (chapter: Chapter, index: number): boolean =>
  isChapterUnlocked(chapter) && (index === 0 || isLevelDone(chapter.levels[index - 1].id));

/** First unfinished level of a chapter (or the last one if all done). */
export const nextLevelIndex = (chapter: Chapter): number => {
  const i = chapter.levels.findIndex((l) => !isLevelDone(l.id));
  return i === -1 ? chapter.levels.length - 1 : i;
};

export const chapterStars = (chapter: Chapter): { earned: number; max: number; done: number } => ({
  earned: chapter.levels.reduce((s, l) => s + (state.levels[l.id]?.stars ?? 0), 0),
  max: chapter.levels.length * 3,
  done: chapter.levels.filter((l) => isLevelDone(l.id)).length,
});

/** The chapter the player is "on": first unlocked chapter with unfinished levels. */
export const currentChapter = (): Chapter =>
  CHAPTERS.find((c) => isChapterUnlocked(c) && !isChapterDone(c)) ?? CHAPTERS[CHAPTERS.length - 1];

export const earnedPoints = (): number =>
  Object.values(state.levels).reduce((s, r) => s + r.bestPoints, 0) + state.bonusPoints;

export const totalThreeStars = (): number => Object.values(state.levels).filter((r) => r.stars === 3).length;

export const hasDoubleXp = (): boolean => state.doubleXpNext;
export const introSeen = (chapterId: string): boolean => state.seenIntros.includes(chapterId);
export const stories = (): SharedStory[] => [...state.stories];

// ---------------------------------------------------------------- mutations

/** Store a finished level. Only improvements over the best score add points. */
export const recordResult = (levelId: string, stars: number, points: number): { gained: number; improvedStars: boolean } => {
  const prev = state.levels[levelId] ?? { stars: 0, bestPoints: 0, plays: 0 };
  const next: LevelRecord = {
    stars: Math.max(prev.stars, stars),
    bestPoints: Math.max(prev.bestPoints, points),
    plays: prev.plays + 1,
  };
  state.levels[levelId] = next;
  if (stars > 0) state.doubleXpNext = false;
  save();
  return { gained: next.bestPoints - prev.bestPoints, improvedStars: next.stars > prev.stars };
};

export const addBonusPoints = (n: number) => {
  state.bonusPoints += n;
  save();
};

export const setDoubleXp = (on: boolean) => {
  state.doubleXpNext = on;
  save();
};

export const markIntroSeen = (chapterId: string) => {
  if (!state.seenIntros.includes(chapterId)) state.seenIntros.push(chapterId);
  save();
};

export const addStory = (story: SharedStory) => {
  state.stories.push(story);
  save();
};

export const resetProgress = () => {
  state = seeded();
  save();
};
