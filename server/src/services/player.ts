import { and, eq, gte, sql } from 'drizzle-orm';
import type { LevelRecordDto, PlayRequest, PlayResponse, ProgressResponse } from '../../../shared/api-types';
import type { Mission } from '../../../shared/domain-types';
import type { GameSpec } from '../../../shared/game-types';
import { MYSTERY_GIFT_POINTS, rollMystery, type MysteryOutcome } from '../../../shared/mystery';
import { isLevelUnlocked, type StarsByLevel } from '../../../shared/progress-rules';
import { invalidResult, pointsFor, starsFor } from '../../../shared/scoring';
import type { Db } from '../db/client';
import { levelRecords, playerState, plays, pointEvents } from '../db/schema';
import { HttpError } from '../http';
import { findInContent, publishedContent } from './content';
import { getSettings } from './settings';
import { startOfDay } from './time';

/** Rows returned by db.execute() (same shape for node-postgres and PGlite). */
export const rowsOf = <T>(res: unknown): T[] => (res as { rows: T[] }).rows;

const state = async (db: Db, userId: string) => {
  const [row] = await db.select().from(playerState).where(eq(playerState.userId, userId)).limit(1);
  if (row) return row;
  const [created] = await db.insert(playerState).values({ userId }).onConflictDoNothing().returning();
  return created ?? (await db.select().from(playerState).where(eq(playerState.userId, userId)))[0];
};

const records = async (db: Db, userId: string): Promise<Record<string, LevelRecordDto>> => {
  const rows = await db.select().from(levelRecords).where(eq(levelRecords.userId, userId));
  return Object.fromEntries(rows.map((r) => [r.levelId, { stars: r.stars, bestPoints: r.bestPoints, plays: r.plays }]));
};

const sumPointEvents = async (db: Db, userId: string, since?: Date): Promise<number> => {
  const where = since ? and(eq(pointEvents.userId, userId), gte(pointEvents.createdAt, since)) : eq(pointEvents.userId, userId);
  const [row] = await db.select({ total: sql<number>`coalesce(sum(${pointEvents.amount}), 0)::int` }).from(pointEvents).where(where);
  return Number(row?.total ?? 0);
};

/** Daily mission: finish (≥ 1 star) one level today. */
const mission = async (db: Db, userId: string): Promise<Mission> => {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(plays)
    .where(and(eq(plays.userId, userId), gte(plays.createdAt, startOfDay()), gte(plays.stars, 1)));
  return { id: 'daily-finish-1', title: 'Hoàn thành 1 level bất kỳ hôm nay', progress: Math.min(1, Number(row?.n ?? 0)), target: 1, rewardStars: 0 };
};

export const getProgress = async (db: Db, userId: string): Promise<ProgressResponse> => {
  const s = await state(db, userId);
  return {
    levels: await records(db, userId),
    bonusPoints: await sumPointEvents(db, userId),
    doubleXpNext: s.doubleXpNext,
    seenIntros: s.seenIntros,
    mission: await mission(db, userId),
  };
};

export const markIntroSeen = async (db: Db, userId: string, chapterId: string) => {
  const s = await state(db, userId);
  if (!s.seenIntros.includes(chapterId)) {
    await db.update(playerState).set({ seenIntros: [...s.seenIntros, chapterId] }).where(eq(playerState.userId, userId));
  }
};

/** Store an improvement over the best score; returns the new record and points gained. */
const upsertRecord = async (db: Db, userId: string, levelId: string, stars: number, points: number) => {
  const [prev] = await db
    .select()
    .from(levelRecords)
    .where(and(eq(levelRecords.userId, userId), eq(levelRecords.levelId, levelId)))
    .limit(1);
  const next = {
    stars: Math.max(prev?.stars ?? 0, stars),
    bestPoints: Math.max(prev?.bestPoints ?? 0, points),
    plays: (prev?.plays ?? 0) + 1,
  };
  await db
    .insert(levelRecords)
    .values({ userId, levelId, ...next })
    .onConflictDoUpdate({ target: [levelRecords.userId, levelRecords.levelId], set: { ...next, updatedAt: new Date() } });
  return { record: next, gained: next.bestPoints - (prev?.bestPoints ?? 0), improvedStars: next.stars > (prev?.stars ?? 0) };
};

/** Check the level is visible and open for this player. */
const openLevel = async (db: Db, userId: string, levelId: string) => {
  const content = await publishedContent(db);
  const found = findInContent(content, levelId);
  if (!found) throw new HttpError(404, 'Không tìm thấy level');
  const settings = await getSettings(db);
  const stars: StarsByLevel = await records(db, userId);
  if (!isLevelUnlocked(content, stars, found.chapter, found.index, settings.unlockAllChapters)) {
    throw new HttpError(403, 'Level này chưa được mở khóa');
  }
  return { content, ...found, settings };
};

/** Answer for a result that was already saved (same clientId sent again after a network error). */
const replay = async (db: Db, userId: string, clientId: string): Promise<PlayResponse | null> => {
  const [p] = await db.select().from(plays).where(and(eq(plays.userId, userId), eq(plays.clientId, clientId))).limit(1);
  if (!p) return null;
  const s = await state(db, userId);
  const record = (await records(db, userId))[p.levelId] ?? { stars: p.stars, bestPoints: p.points, plays: 1 };
  return { stars: p.stars, points: p.points, gained: p.gained, improvedStars: false, record, doubleXpNext: s.doubleXpNext };
};

/** POST /plays — grade a finished level with the shared rules and save it. */
export const recordPlay = async (db: Db, userId: string, body: PlayRequest): Promise<PlayResponse> => {
  if (body.clientId) {
    const again = await replay(db, userId, body.clientId);
    if (again) return again;
  }
  const { level } = await openLevel(db, userId, body.levelId);
  const s = await state(db, userId);

  let spec: GameSpec | undefined = level.spec;
  if (level.kind === 'mystery') {
    if (s.pendingMystery?.levelId !== level.id) throw new HttpError(409, 'Hãy lật thẻ bí ẩn trước khi chơi');
    spec = s.pendingMystery.spec;
  }
  if (!spec) throw new HttpError(400, 'Level chưa có nội dung');

  const result = { correct: body.correct, total: body.total, timeMs: Math.round(body.timeMs), failed: !!body.failed, notes: [] };
  const invalid = invalidResult(spec, result);
  if (invalid) throw new HttpError(422, `Kết quả không hợp lệ: ${invalid}`);

  const doubleXp = s.doubleXpNext;
  const stars = starsFor(result, spec.parTimeSec);
  const points = pointsFor(result, stars, spec.parTimeSec, doubleXp);

  const save = () => db.transaction(async (tx) => {
    const saved = await upsertRecord(tx as unknown as Db, userId, level.id, stars, points);
    await tx.insert(plays).values({
      userId,
      levelId: level.id,
      correct: result.correct,
      total: result.total,
      timeMs: result.timeMs,
      stars,
      points,
      gained: saved.gained,
      doubleXp,
      clientId: body.clientId ?? null,
    });
    const doubleXpNext = stars > 0 ? false : doubleXp;
    await tx
      .update(playerState)
      .set({ doubleXpNext, ...(level.kind === 'mystery' ? { pendingMystery: null } : {}) })
      .where(eq(playerState.userId, userId));
    return { stars, points, gained: saved.gained, improvedStars: saved.improvedStars, record: saved.record, doubleXpNext };
  });
  try {
    return await save();
  } catch (e) {
    // the same result arrived twice at once (retry racing the original): answer with the saved one
    if (body.clientId && isUniqueViolation(e)) {
      const again = await replay(db, userId, body.clientId);
      if (again) return again;
    }
    throw e;
  }
};

const isUniqueViolation = (e: unknown): boolean => {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === '23505' || err?.cause?.code === '23505';
};

/** Give bonus points, respecting the per-day cap. Returns what was actually given. */
const giveBonus = async (db: Db, userId: string, amount: number, reason: string, capPerDay: number): Promise<number> => {
  const today = await sumPointEvents(db, userId, startOfDay());
  const given = Math.max(0, Math.min(amount, capPerDay - today));
  if (given > 0) await db.insert(pointEvents).values({ userId, amount: given, reason });
  return given;
};

/** POST /mystery/:levelId — roll the card server-side and apply instant rewards. */
export const openMystery = async (db: Db, userId: string, levelId: string): Promise<{ outcome: MysteryOutcome; progress: ProgressResponse }> => {
  const { content, level, settings } = await openLevel(db, userId, levelId);
  if (level.kind !== 'mystery') throw new HttpError(400, 'Đây không phải level bí ẩn');
  await state(db, userId);

  const outcome = rollMystery(content);
  if (outcome.spec) {
    await db.update(playerState).set({ pendingMystery: { levelId, spec: outcome.spec } }).where(eq(playerState.userId, userId));
  } else {
    if (outcome.id === 'gift') {
      const given = await giveBonus(db, userId, MYSTERY_GIFT_POINTS, `mystery:${levelId}`, settings.bonusCapPerDay);
      if (given < MYSTERY_GIFT_POINTS) {
        outcome.text = given > 0 ? `Bạn nhận được +${given} điểm thưởng (đã chạm mức tối đa hôm nay).` : 'Hôm nay bạn đã nhận đủ điểm thưởng, quay lại vào ngày mai nhé!';
      }
    }
    if (outcome.id === 'double') {
      await db.update(playerState).set({ doubleXpNext: true }).where(eq(playerState.userId, userId));
    }
    // instant outcome = level passed with 3 stars, no points (same as the offline demo)
    const saved = await upsertRecord(db, userId, levelId, 3, 0);
    await db.insert(plays).values({ userId, levelId, correct: 0, total: 0, timeMs: 0, stars: 3, points: 0, gained: saved.gained, doubleXp: false });
  }
  return { outcome, progress: await getProgress(db, userId) };
};
