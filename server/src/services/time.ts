import { and, gte, lte } from 'drizzle-orm';
import type { RankPeriod } from '../../../shared/domain-types';
import type { Db } from '../db/client';
import { seasons } from '../db/schema';

/**
 * Period boundaries in Vietnam time (UTC+7, no DST): weeks start Monday 00:00,
 * months on the 1st, seasons per the `seasons` table (no current season = all time).
 */
const VN_OFFSET_MS = 7 * 3_600_000;

/** Wall-clock parts of `d` in Vietnam time. */
const vn = (d: Date) => new Date(d.getTime() + VN_OFFSET_MS);
/** UTC instant of a Vietnam wall-clock midnight. */
const fromVn = (y: number, m: number, day: number) => new Date(Date.UTC(y, m, day) - VN_OFFSET_MS);

export const startOfDay = (now = new Date()): Date => {
  const v = vn(now);
  return fromVn(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate());
};

export const startOfWeek = (now = new Date()): Date => {
  const v = vn(now);
  const sinceMonday = (v.getUTCDay() + 6) % 7;
  return fromVn(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate() - sinceMonday);
};

export const startOfMonth = (now = new Date()): Date => {
  const v = vn(now);
  return fromVn(v.getUTCFullYear(), v.getUTCMonth(), 1);
};

/** Today's date (YYYY-MM-DD) in Vietnam. */
export const vnDate = (now = new Date()): string => vn(now).toISOString().slice(0, 10);

export const currentSeason = async (db: Db, now = new Date()) => {
  const today = vnDate(now);
  const [s] = await db
    .select()
    .from(seasons)
    .where(and(lte(seasons.startsAt, today), gte(seasons.endsAt, today)))
    .limit(1);
  return s ?? null;
};

export const periodStart = async (db: Db, period: RankPeriod, now = new Date()): Promise<Date> => {
  if (period === 'week') return startOfWeek(now);
  if (period === 'month') return startOfMonth(now);
  const s = await currentSeason(db, now);
  if (!s) return new Date(0);
  const [y, m, d] = s.startsAt.split('-').map(Number);
  return fromVn(y, m - 1, d);
};
