import { asc, eq, sql } from 'drizzle-orm';
import type { MyGroupResponse } from '../../../shared/api-types';
import type { GroupRank, Honor, RankEntry, RankPeriod } from '../../../shared/domain-types';
import type { Db } from '../db/client';
import { groups, users } from '../db/schema';
import { rowsOf } from './player';
import { getSettings } from './settings';
import { periodStart, startOfMonth, startOfWeek } from './time';

/**
 * Rankings. Points of a period = points gained from levels (improvements over
 * personal bests) + bonus points, earned inside the period.
 */

interface ScoreRow {
  id: string;
  name: string;
  title: string;
  group_id: string | null;
  score: number;
}

/** Active users with their points since `since` (users without points included, score 0). */
const scores = async (db: Db, since: Date, until?: Date): Promise<ScoreRow[]> => {
  const upper = until ?? new Date('9999-01-01');
  const res = await db.execute(sql`
    with pts as (
      select user_id, gained as p from plays where created_at >= ${since} and created_at < ${upper}
      union all
      select user_id, amount from point_events where created_at >= ${since} and created_at < ${upper}
    )
    select u.id, u.name, u.title, u.group_id, coalesce(sum(pts.p), 0)::int as score
    from users u left join pts on pts.user_id = u.id
    where u.active
    group by u.id, u.name, u.title, u.group_id
    order by score desc, u.name asc`);
  return rowsOf<ScoreRow>(res).map((r) => ({ ...r, score: Number(r.score) }));
};

const toEntries = (rows: ScoreRow[]): RankEntry[] =>
  rows.map((r, i) => ({ rank: i + 1, playerId: r.id, name: r.name, role: r.title, score: r.score }));

export const leaderboard = async (db: Db, period: RankPeriod, userId: string, limit = 50) => {
  const all = toEntries((await scores(db, await periodStart(db, period))).filter((r) => r.score > 0));
  return { period, entries: all.slice(0, limit), me: all.find((e) => e.playerId === userId) ?? null };
};

interface Activity {
  user_id: string;
  plays: number;
  passed_levels: number;
}

const activity = async (db: Db, since: Date): Promise<Map<string, Activity>> => {
  const res = await db.execute(sql`
    select user_id, count(*)::int as plays, count(distinct case when stars >= 1 then level_id end)::int as passed_levels
    from plays where created_at >= ${since} group by user_id`);
  return new Map(rowsOf<Activity>(res).map((r) => [r.user_id, { ...r, plays: Number(r.plays), passed_levels: Number(r.passed_levels) }]));
};

/** Group ranking for a period: average points, participation, period bonus → weighted score. */
export const groupRanking = async (db: Db, period: RankPeriod = 'month'): Promise<GroupRank[]> => {
  const since = await periodStart(db, period);
  const [rows, act, groupRows, settings] = await Promise.all([scores(db, since), activity(db, since), db.select().from(groups), getSettings(db)]);
  const w = settings.groupWeights;
  const ranked = groupRows
    .map((g) => {
      const members = rows.filter((r) => r.group_id === g.id);
      const total = members.reduce((s, m) => s + m.score, 0);
      const active = members.filter((m) => act.has(m.id)).length;
      const avgScore = members.length ? Math.round(total / members.length) : 0;
      const participation = members.length ? Math.round((active * 100) / members.length) : 0;
      const periodBonus = 0; // period achievements: to be defined by BTC
      return {
        groupId: g.id,
        name: g.name,
        avgScore,
        members: members.length,
        participation,
        periodBonus,
        weighted: avgScore * w.avg + participation * w.participation + periodBonus * w.bonus,
      };
    })
    .filter((g) => g.members > 0)
    .sort((a, b) => b.weighted - a.weighted || a.name.localeCompare(b.name, 'vi'));
  return ranked.map(({ weighted: _w, ...g }, i) => ({ rank: i + 1, ...g }));
};

export const myGroup = async (db: Db, groupId: string | null): Promise<MyGroupResponse['group']> => {
  if (!groupId) return null;
  const ranking = await groupRanking(db, 'month');
  const g = ranking.find((r) => r.groupId === groupId);
  const [row] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!g || !row) return null;

  const month = (await scores(db, startOfMonth())).filter((r) => r.group_id === groupId);
  const weekAct = await activity(db, startOfWeek());
  const leader = row.leaderId ? (await db.select({ name: users.name }).from(users).where(eq(users.id, row.leaderId)))[0]?.name : undefined;
  return {
    ...g,
    leader: leader ?? '—',
    weeklyGoal: {
      progress: month.filter((m) => (weekAct.get(m.id)?.passed_levels ?? 0) > 0).length,
      target: month.length,
      label: 'thành viên hoàn thành ít nhất 1 level tuần này',
    },
    roster: toEntries(month),
  };
};

/** "Ngoài điểm số" honours of the current week. */
export const honors = async (db: Db): Promise<Honor[]> => {
  const week = startOfWeek();
  const lastWeek = new Date(week.getTime() - 7 * 86_400_000);
  const people = new Map((await db.select({ id: users.id, name: users.name }).from(users).orderBy(asc(users.name))).map((u) => [u.id, u.name]));
  const act = [...(await activity(db, week)).values()];
  const out: Honor[] = [];
  const top = <T>(list: T[], value: (t: T) => number) => list.reduce<T | undefined>((best, t) => (!best || value(t) > value(best) ? t : best), undefined);

  const mostPlays = top(act, (a) => a.plays);
  if (mostPlays) out.push({ title: 'Tích cực nhất', icon: 'bolt', playerId: mostPlays.user_id, name: people.get(mostPlays.user_id) ?? '', value: `${mostPlays.plays} lượt chơi` });

  const now = toEntries((await scores(db, week)).filter((r) => r.score > 0));
  const before = toEntries((await scores(db, lastWeek, week)).filter((r) => r.score > 0));
  const gains = now
    .map((e) => ({ e, prev: before.find((b) => b.playerId === e.playerId)?.rank }))
    .filter((x): x is { e: RankEntry; prev: number } => x.prev !== undefined && x.prev > x.e.rank);
  const improved = top(gains, (x) => x.prev - x.e.rank);
  if (improved) out.push({ title: 'Tiến bộ nhất', icon: 'arrowUp', playerId: improved.e.playerId, name: improved.e.name, value: `Tăng ${improved.prev - improved.e.rank} hạng` });

  const mostLevels = top(act, (a) => a.passed_levels);
  if (mostLevels?.passed_levels) out.push({ title: 'Nhiều thử thách nhất', icon: 'flag', playerId: mostLevels.user_id, name: people.get(mostLevels.user_id) ?? '', value: `${mostLevels.passed_levels} level` });

  const res = await db.execute(sql`select user_id, count(*)::int as n from level_records where stars = 3 group by user_id order by n desc limit 1`);
  const three = rowsOf<{ user_id: string; n: number }>(res)[0];
  if (three) out.push({ title: 'Nhiều 3 sao nhất', icon: 'star', playerId: three.user_id, name: people.get(three.user_id) ?? '', value: `${Number(three.n)} level ★★★` });
  return out;
};
