import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AdminBadge, AdminErrorEvent, AdminErrorList, AdminSeason, AdminStats, AdminStory, AuditEntry, ErrorCategory, Settings } from '../../../../shared/api-types';
import { auditLog, badges, errorEvents, errorReports, seasons, stories, userBadges, users } from '../../db/schema';
import { HttpError, requireRole } from '../../http';
import { audit } from '../../services/audit';
import { rowsOf } from '../../services/player';
import { getSettings, saveSettings } from '../../services/settings';
import { startOfDay, startOfWeek } from '../../services/time';
import { slug } from './people';

const date = z.iso.date();

export const adminOpsRoutes = async (app: FastifyInstance) => {
  const { db } = app;

  // ------------------------------------------------------------------ stories

  app.get('/stories', async (req): Promise<AdminStory[]> => {
    requireRole(req, 'editor');
    const { status } = z.object({ status: z.enum(['new', 'editing', 'approved', 'rejected', 'used']).optional() }).parse(req.query);
    const rows = await db
      .select({ s: stories, author: users.name })
      .from(stories)
      .leftJoin(users, eq(users.id, stories.userId))
      .where(status ? eq(stories.status, status) : undefined)
      .orderBy(desc(stories.createdAt))
      .limit(300);
    return rows.map(({ s, author }) => ({
      id: s.id,
      unit: s.unit,
      situation: s.situation,
      problem: s.problem,
      handling: s.handling,
      difficulty: s.difficulty,
      outcome: s.outcome,
      lesson: s.lesson,
      anonymous: s.anonymous,
      // editors don't see who sent an anonymous story
      author: s.anonymous ? null : author,
      status: s.status,
      editorNote: s.editorNote,
      levelId: s.levelId,
      createdAt: s.createdAt.toISOString(),
    }));
  });

  app.patch<{ Params: { id: string } }>('/stories/:id', async (req) => {
    const me = requireRole(req, 'editor');
    const body = z
      .object({
        status: z.enum(['new', 'editing', 'approved', 'rejected', 'used']).optional(),
        editorNote: z.string().max(4000).optional(),
        levelId: z.string().max(80).nullable().optional(),
      })
      .parse(req.body);
    const [row] = await db.update(stories).set({ ...body, updatedAt: new Date() }).where(eq(stories.id, Number(req.params.id))).returning({ id: stories.id });
    if (!row) throw new HttpError(404, 'Không tìm thấy tình huống');
    await audit(db, me.id, 'update', 'story', String(row.id), body);
    return { ok: true };
  });

  // ------------------------------------------------------------------ seasons

  const seasonBody = z.object({ name: z.string().trim().min(1).max(80), startsAt: date, endsAt: date }).refine((s) => s.startsAt <= s.endsAt, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
  });

  app.get('/seasons', async (req): Promise<AdminSeason[]> => {
    requireRole(req, 'editor');
    return db.select().from(seasons).orderBy(desc(seasons.startsAt));
  });

  app.post('/seasons', async (req) => {
    const me = requireRole(req, 'admin');
    const [row] = await db.insert(seasons).values(seasonBody.parse(req.body)).returning();
    await audit(db, me.id, 'create', 'season', String(row.id));
    return row;
  });

  app.put<{ Params: { id: string } }>('/seasons/:id', async (req) => {
    const me = requireRole(req, 'admin');
    const [row] = await db.update(seasons).set(seasonBody.parse(req.body)).where(eq(seasons.id, Number(req.params.id))).returning();
    if (!row) throw new HttpError(404, 'Không tìm thấy mùa');
    await audit(db, me.id, 'update', 'season', String(row.id));
    return row;
  });

  app.delete<{ Params: { id: string } }>('/seasons/:id', async (req) => {
    const me = requireRole(req, 'admin');
    await db.delete(seasons).where(eq(seasons.id, Number(req.params.id)));
    await audit(db, me.id, 'delete', 'season', req.params.id);
    return { ok: true };
  });

  // ------------------------------------------------------------------ badges

  app.get('/badges', async (req): Promise<AdminBadge[]> => {
    requireRole(req, 'editor');
    const rows = await db
      .select({ b: badges, awarded: sql<number>`(select count(*)::int from user_badges ub where ub.badge_id = "badges"."id")` })
      .from(badges)
      .orderBy(asc(badges.order));
    return rows.map(({ b, awarded }) => ({ id: b.id, name: b.name, description: b.description, icon: b.icon, awarded: Number(awarded) }));
  });

  app.put('/badges', async (req) => {
    const me = requireRole(req, 'admin');
    const body = z
      .object({ id: z.string().trim().max(40).optional(), name: z.string().trim().min(1).max(60), description: z.string().trim().max(200), icon: z.string().trim().max(30) })
      .parse(req.body);
    const id = body.id || slug(body.name);
    const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${badges.order}), 0)::int` }).from(badges);
    const [row] = await db
      .insert(badges)
      .values({ id, name: body.name, description: body.description, icon: body.icon, order: Number(max) + 1 })
      .onConflictDoUpdate({ target: badges.id, set: { name: body.name, description: body.description, icon: body.icon } })
      .returning();
    await audit(db, me.id, 'save', 'badge', id, body);
    return row;
  });

  /** Award a badge to usernames (one per line in the admin page). */
  app.post<{ Params: { id: string } }>('/badges/:id/award', async (req) => {
    const me = requireRole(req, 'editor');
    const { usernames } = z.object({ usernames: z.array(z.string().trim().toLowerCase()).min(1).max(5000) }).parse(req.body);
    const found = await db.select({ id: users.id, username: users.username }).from(users).where(inArray(users.username, usernames));
    if (found.length) {
      await db
        .insert(userBadges)
        .values(found.map((u) => ({ userId: u.id, badgeId: req.params.id, awardedBy: me.id })))
        .onConflictDoNothing();
    }
    const missing = usernames.filter((n) => !found.some((f) => f.username === n));
    await audit(db, me.id, 'award', 'badge', req.params.id, { count: found.length });
    return { awarded: found.length, missing };
  });

  app.delete<{ Params: { id: string; userId: string } }>('/badges/:id/award/:userId', async (req) => {
    const me = requireRole(req, 'editor');
    await db.delete(userBadges).where(and(eq(userBadges.badgeId, req.params.id), eq(userBadges.userId, req.params.userId)));
    await audit(db, me.id, 'revoke', 'badge', req.params.id, { userId: req.params.userId });
    return { ok: true };
  });

  // ------------------------------------------------------------------ stats, audit, settings

  app.get('/stats', async (req): Promise<AdminStats> => {
    requireRole(req, 'editor');
    const day = startOfDay();
    const week = startOfWeek();
    const since = new Date(day.getTime() - 13 * 86_400_000);
    const [totals] = rowsOf<{ players: number; today: number; week: number; plays_week: number }>(
      await db.execute(sql`
        select
          (select count(*)::int from users where active) as players,
          (select count(distinct user_id)::int from plays where created_at >= ${day}) as today,
          (select count(distinct user_id)::int from plays where created_at >= ${week}) as week,
          (select count(*)::int from plays where created_at >= ${week}) as plays_week`),
    );
    const daily = rowsOf<{ day: string; players: number; plays: number }>(
      await db.execute(sql`
        select to_char(created_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') as day,
               count(distinct user_id)::int as players, count(*)::int as plays
        from plays where created_at >= ${since} group by 1 order by 1`),
    );
    const groupStats = rowsOf<{ group_id: string; name: string; members: number; active_week: number }>(
      await db.execute(sql`
        select g.id as group_id, g.name,
               count(distinct u.id)::int as members,
               count(distinct p.user_id)::int as active_week
        from groups g
        left join users u on u.group_id = g.id and u.active
        left join plays p on p.user_id = u.id and p.created_at >= ${week}
        group by g.id, g.name order by g.name`),
    );
    return {
      players: Number(totals.players),
      activeToday: Number(totals.today),
      activeWeek: Number(totals.week),
      playsWeek: Number(totals.plays_week),
      daily: daily.map((d) => ({ day: d.day, players: Number(d.players), plays: Number(d.plays) })),
      groups: groupStats.map((g) => ({ groupId: g.group_id, name: g.name, members: Number(g.members), activeWeek: Number(g.active_week) })),
    };
  });

  app.get('/audit', async (req): Promise<AuditEntry[]> => {
    requireRole(req, 'admin');
    const rows = await db
      .select({ a: auditLog, user: users.name })
      .from(auditLog)
      .leftJoin(users, eq(users.id, auditLog.userId))
      .orderBy(desc(auditLog.id))
      .limit(300);
    return rows.map(({ a, user }) => ({ id: a.id, user, action: a.action, entity: a.entity, entityId: a.entityId, createdAt: a.createdAt.toISOString() }));
  });

  const errorQuery = z.object({
    category: z.enum(['network', 'browser', 'config', 'server']).optional(),
    /** account filter: part of a username or name */
    q: z.string().trim().max(100).optional(),
  });
  const userMatch = (q: string) => {
    const like = `%${q.toLowerCase()}%`;
    return sql`(lower(${users.username}) like ${like} or lower(${users.name}) like ${like})`;
  };

  app.get('/errors', async (req): Promise<AdminErrorList> => {
    requireRole(req, 'editor');
    const { category, q } = errorQuery.parse(req.query);
    const conds = [
      category ? eq(errorReports.category, category) : undefined,
      q
        ? sql`exists (select 1 from ${errorEvents} join ${users} on ${users.id} = ${errorEvents.userId}
                      where ${errorEvents.reportId} = ${errorReports.id} and ${userMatch(q)})`
        : undefined,
    ];
    const rows = await db
      .select({ e: errorReports, name: users.name, username: users.username })
      .from(errorReports)
      .leftJoin(users, eq(users.id, errorReports.lastUserId))
      .where(and(...conds))
      .orderBy(desc(errorReports.lastSeen))
      .limit(200);
    const ids = rows.map((r) => r.e.id);

    const [userCounts, browserCounts, catCounts] = await Promise.all([
      ids.length
        ? db
            .select({ reportId: errorEvents.reportId, n: sql<number>`count(distinct ${errorEvents.userId})::int` })
            .from(errorEvents)
            .where(inArray(errorEvents.reportId, ids))
            .groupBy(errorEvents.reportId)
        : [],
      ids.length
        ? db
            .select({ reportId: errorEvents.reportId, label: errorEvents.browser, n: sql<number>`count(*)::int` })
            .from(errorEvents)
            .where(inArray(errorEvents.reportId, ids))
            .groupBy(errorEvents.reportId, errorEvents.browser)
        : [],
      db.select({ category: errorReports.category, n: sql<number>`count(*)::int` }).from(errorReports).groupBy(errorReports.category),
    ]);
    const usersOf = new Map(userCounts.map((r) => [r.reportId, r.n]));
    const browsersOf = new Map<number, { label: string; count: number }[]>();
    for (const r of browserCounts) {
      const list = browsersOf.get(r.reportId) ?? [];
      list.push({ label: r.label || 'Không rõ', count: r.n });
      browsersOf.set(r.reportId, list);
    }
    const counts: Record<ErrorCategory, number> = { network: 0, browser: 0, config: 0, server: 0 };
    for (const r of catCounts) counts[r.category] = r.n;

    return {
      counts,
      reports: rows.map(({ e, name, username }) => ({
        id: e.id,
        source: e.source,
        category: e.category,
        message: e.message,
        stack: e.stack,
        url: e.url,
        release: e.release,
        count: e.count,
        users: usersOf.get(e.id) ?? 0,
        lastUser: username ? `${name} (${username})` : null,
        browsers: (browsersOf.get(e.id) ?? []).sort((a, b) => b.count - a.count),
        firstSeen: e.firstSeen.toISOString(),
        lastSeen: e.lastSeen.toISOString(),
      })),
    };
  });

  /** Occurrences of one error (latest 200), optionally only for matching accounts. */
  app.get<{ Params: { id: string } }>('/errors/:id/events', async (req): Promise<AdminErrorEvent[]> => {
    requireRole(req, 'editor');
    const { q } = errorQuery.parse(req.query);
    const rows = await db
      .select({ ev: errorEvents, username: users.username, name: users.name, unit: users.unit })
      .from(errorEvents)
      .leftJoin(users, eq(users.id, errorEvents.userId))
      .where(and(eq(errorEvents.reportId, Number(req.params.id)), q ? userMatch(q) : undefined))
      .orderBy(desc(errorEvents.createdAt), desc(errorEvents.id))
      .limit(200);
    return rows.map(({ ev, username, name, unit }) => ({
      id: ev.id,
      at: ev.createdAt.toISOString(),
      user: username ? { username, name: name ?? username, unit: unit ?? '' } : null,
      browser: ev.browser,
      userAgent: ev.userAgent,
      url: ev.url,
      release: ev.release,
      detail: ev.detail,
      ip: ev.ip,
    }));
  });

  /** "Đã xử lý": remove one report (it comes back if the error happens again). */
  app.delete<{ Params: { id: string } }>('/errors/:id', async (req) => {
    const me = requireRole(req, 'editor');
    await db.delete(errorReports).where(eq(errorReports.id, Number(req.params.id)));
    await audit(db, me.id, 'resolve', 'error', req.params.id);
    return { ok: true };
  });

  app.get('/settings', async (req): Promise<Settings> => {
    requireRole(req, 'editor');
    return getSettings(db);
  });

  app.put('/settings', async (req) => {
    const me = requireRole(req, 'admin');
    const body = z
      .object({
        unlockAllChapters: z.boolean(),
        bonusCapPerDay: z.number().int().min(0).max(10_000),
        groupWeights: z.object({ avg: z.number().min(0).max(100), participation: z.number().min(0).max(1000), bonus: z.number().min(0).max(100) }),
      })
      .parse(req.body);
    await saveSettings(db, body);
    await audit(db, me.id, 'update', 'settings', 'game', body);
    return body;
  });
};
