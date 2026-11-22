import type { Chapter } from './content-types';
import { PASS_STARS } from './scoring';

/**
 * Unlock rules shared by the browser (to draw locks) and the server (to refuse
 * results for levels that aren't open yet).
 *   - a level opens when the previous level of its chapter is passed (≥ 1 star)
 *   - a chapter opens when the previous chapter is fully passed, or when the
 *     BTC setting "unlockAllChapters" is on
 */

/** Best stars per level id. */
export type StarsByLevel = Record<string, { stars: number } | undefined>;

export const isLevelDone = (stars: StarsByLevel, levelId: string): boolean => (stars[levelId]?.stars ?? 0) >= PASS_STARS;

export const isChapterDone = (stars: StarsByLevel, chapter: Chapter): boolean =>
  chapter.levels.every((l) => isLevelDone(stars, l.id));

export const isChapterUnlocked = (chapters: Chapter[], stars: StarsByLevel, chapter: Chapter, unlockAll: boolean): boolean => {
  if (unlockAll) return true;
  const sorted = [...chapters].sort((a, b) => a.order - b.order);
  const i = sorted.findIndex((c) => c.id === chapter.id);
  return i <= 0 || isChapterDone(stars, sorted[i - 1]);
};

export const isLevelUnlocked = (chapters: Chapter[], stars: StarsByLevel, chapter: Chapter, index: number, unlockAll: boolean): boolean =>
  isChapterUnlocked(chapters, stars, chapter, unlockAll) && (index === 0 || isLevelDone(stars, chapter.levels[index - 1].id));
