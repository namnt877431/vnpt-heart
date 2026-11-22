import type { GameSpec, GameType } from '../game-types';
import { ai } from './ai';
import { anToan } from './an-toan';
import { quyTac } from './quy-tac';
import { quyTrinh } from './quy-trinh';
import { thucChien } from './thuc-chien';
import type { Chapter, LevelDef } from './types';
import { vanHoa } from './van-hoa';

export type { Chapter, LevelDef, LevelKind } from './types';

/**
 * All chapters ("chặng") in map order.
 * Offline demo: the sample files next to this one (add a chapter: create a file,
 * append it here, add its island position in config/layout.ts).
 * API mode: replaced at boot with the published content from the server
 * (`setChapters`); the official content is edited in the admin page.
 */
export const CHAPTERS: Chapter[] = [vanHoa, quyTac, thucChien, anToan, quyTrinh, ai];

/** Replace the content in place (keeps every reference to CHAPTERS valid). */
export const setChapters = (chapters: Chapter[]) => {
  CHAPTERS.splice(0, CHAPTERS.length, ...chapters);
};

export const getChapter = (id: string | undefined): Chapter | undefined => CHAPTERS.find((c) => c.id === id);

export const findLevel = (levelId: string | undefined): { chapter: Chapter; level: LevelDef; index: number } | undefined => {
  for (const chapter of CHAPTERS) {
    const index = chapter.levels.findIndex((l) => l.id === levelId);
    if (index >= 0) return { chapter, level: chapter.levels[index], index };
  }
  return undefined;
};

/** Id of one playable level of a game type, for the "Kho trò chơi" gallery. */
export const sampleLevelId = (type: GameType): string | undefined =>
  CHAPTERS.flatMap((c) => c.levels).find((l) => l.spec?.type === type)?.id;

/** Every non-boss spec, used to roll "Mystery Level" challenges. */
export const allSpecs = (): { levelId: string; spec: GameSpec }[] =>
  CHAPTERS.flatMap((c) => c.levels.filter((l) => l.spec).map((l) => ({ levelId: l.id, spec: l.spec! })));
