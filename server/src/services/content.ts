import { and, asc, eq, isNull, lte, or } from 'drizzle-orm';
import type { Chapter, LevelDef } from '../../../shared/content-types';
import type { Db } from '../db/client';
import { chapters, levels } from '../db/schema';

/** The map has 6 island slots (client/src/config/layout.ts). */
export const MAX_CHAPTERS = 6;

/**
 * Content players can see right now: published levels whose open time has
 * passed, grouped into chapters in map order. Chapters without visible levels
 * are hidden; `order` is renumbered 1..n because the map places islands by it.
 */
export const publishedContent = async (db: Db, now = new Date()): Promise<Chapter[]> => {
  const chapterRows = await db.select().from(chapters).orderBy(asc(chapters.order));
  const levelRows = await db
    .select()
    .from(levels)
    .where(and(eq(levels.status, 'published'), or(isNull(levels.publishAt), lte(levels.publishAt, now))))
    .orderBy(asc(levels.chapterId), asc(levels.position));

  const byChapter = new Map<string, LevelDef[]>();
  for (const l of levelRows) {
    const list = byChapter.get(l.chapterId) ?? [];
    list.push(l.spec ? { id: l.id, kind: l.kind, spec: l.spec } : { id: l.id, kind: l.kind });
    byChapter.set(l.chapterId, list);
  }

  return chapterRows
    .filter((c) => (byChapter.get(c.id)?.length ?? 0) > 0)
    .slice(0, MAX_CHAPTERS)
    .map((c, i) => ({
      id: c.id,
      order: i + 1,
      title: c.title,
      subtitle: c.subtitle,
      building: c.building,
      intro: c.intro,
      levels: byChapter.get(c.id)!,
    }));
};

export const findInContent = (content: Chapter[], levelId: string) => {
  for (const chapter of content) {
    const index = chapter.levels.findIndex((l) => l.id === levelId);
    if (index >= 0) return { chapter, level: chapter.levels[index], index };
  }
  return undefined;
};
