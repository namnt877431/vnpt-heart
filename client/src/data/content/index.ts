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
 * All chapters ("chặng") in map order. Add a chapter: create a file next to
 * this one, append it here, add its island position in config/layout.ts.
 */
export const CHAPTERS: Chapter[] = [vanHoa, quyTac, thucChien, anToan, quyTrinh, ai];

export const getChapter = (id: string | undefined): Chapter | undefined => CHAPTERS.find((c) => c.id === id);

export const findLevel = (levelId: string | undefined): { chapter: Chapter; level: LevelDef; index: number } | undefined => {
  for (const chapter of CHAPTERS) {
    const index = chapter.levels.findIndex((l) => l.id === levelId);
    if (index >= 0) return { chapter, level: chapter.levels[index], index };
  }
  return undefined;
};

/** One playable sample per game type, for the "Kho trò chơi" gallery. */
export const SAMPLE_BY_TYPE: Record<GameType, string> = (() => {
  const map = {} as Record<GameType, string>;
  for (const c of CHAPTERS) {
    for (const l of c.levels) if (l.spec && !map[l.spec.type]) map[l.spec.type] = l.id;
  }
  return map;
})();

/** Every non-boss spec, used to roll "Mystery Level" challenges. */
export const allSpecs = (): { levelId: string; spec: GameSpec }[] =>
  CHAPTERS.flatMap((c) => c.levels.filter((l) => l.spec).map((l) => ({ levelId: l.id, spec: l.spec! })));
