import { asc, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type {
  BadgesResponse,
  ContentResponse,
  GroupsResponse,
  HonorsResponse,
  LeaderboardResponse,
  MyGroupResponse,
  MysteryResponse,
} from '../../../shared/api-types';
import { badges, stories, userBadges } from '../db/schema';
import { requireUser } from '../http';
import { publishedContent } from '../services/content';
import { groupRanking, honors, leaderboard, myGroup } from '../services/leaderboard';
import { getProgress, markIntroSeen, openMystery, recordPlay } from '../services/player';
import { recordError } from '../services/errors';
import { getSettings } from '../services/settings';
import { SESSION_COOKIE } from '../auth/session';

/** Rate-limit per logged-in session (many employees share one office IP). */
const perSession = (max: number, timeWindow: string) => ({
  rateLimit: { max, timeWindow, keyGenerator: (req: { cookies: Record<string, string | undefined>; ip: string }) => req.cookies[SESSION_COOKIE] ?? req.ip },
});

const period = z.object({ period: z.enum(['week', 'month', 'season']).default('week') });

const playBody = z.object({
  levelId: z.string().min(1).max(80),
  correct: z.number().int().min(0).max(1000),
  total: z.number().int().min(0).max(1000),
  timeMs: z.number().min(0).max(24 * 3_600_000),
  failed: z.boolean().optional(),
  clientId: z.string().min(8).max(64).optional(),
});

const clientErrors = z.object({
  errors: z
    .array(
      z.object({
        message: z.string().max(2000),
        stack: z.string().max(8000).optional(),
        url: z.string().max(1000).optional(),
        release: z.string().max(100).optional(),
        category: z.enum(['network', 'browser', 'config']).optional(),
        detail: z.string().max(1000).optional(),
        at: z.number().int().positive().optional(),
      }),
    )
    .min(1)
    .max(10),
});

const storyBody = z.object({
  unit: z.string().trim().max(200).default(''),
  situation: z.string().trim().min(10, 'Hãy mô tả tình huống (ít nhất 10 ký tự)').max(4000),
  problem: z.string().trim().max(4000).default(''),
  handling: z.string().trim().max(4000).default(''),
  difficulty: z.string().trim().max(2000).default(''),
  outcome: z.string().trim().max(2000).default(''),
  lesson: z.string().trim().max(2000).default(''),
  anonymous: z.boolean().default(false),
});

/** Routes for logged-in players. */
export const playerRoutes = async (app: FastifyInstance) => {
  const { db } = app;

  // Browser error reports. No login needed (errors can happen before it); limited per IP.
  app.post('/client-errors', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (req) => {
    const { errors } = clientErrors.parse(req.body);
    const userAgent = String(req.headers['user-agent'] ?? '');
    for (const e of errors) await recordError(db, { source: 'client', ...e, userAgent, userId: req.user?.id ?? null, ip: req.ip });
    return { ok: true };
  });

  app.get('/content', async (req): Promise<ContentResponse> => {
    requireUser(req);
    const [chapters, settings] = await Promise.all([publishedContent(db), getSettings(db)]);
    return { chapters, unlockAllChapters: settings.unlockAllChapters };
  });

  app.get('/progress', async (req) => getProgress(db, requireUser(req).id));

  app.patch('/progress/state', async (req) => {
    const user = requireUser(req);
    const body = z.object({ seenIntro: z.string().max(80).optional() }).parse(req.body);
    if (body.seenIntro) await markIntroSeen(db, user.id, body.seenIntro);
    return getProgress(db, user.id);
  });

  app.post('/plays', { config: perSession(60, '1 minute') }, async (req) =>
    recordPlay(db, requireUser(req).id, playBody.parse(req.body)),
  );

  app.post<{ Params: { levelId: string } }>('/mystery/:levelId', async (req): Promise<MysteryResponse> =>
    openMystery(db, requireUser(req).id, req.params.levelId),
  );

  app.post('/stories', { config: perSession(10, '1 hour') }, async (req) => {
    const user = requireUser(req);
    const body = storyBody.parse(req.body);
    const [row] = await db.insert(stories).values({ ...body, userId: user.id }).returning({ id: stories.id });
    return { id: row.id };
  });

  app.get('/leaderboard', async (req): Promise<LeaderboardResponse> => {
    const user = requireUser(req);
    return leaderboard(db, period.parse(req.query).period, user.id);
  });

  app.get('/groups/ranking', async (req): Promise<GroupsResponse> => {
    requireUser(req);
    const p = z.object({ period: z.enum(['week', 'month', 'season']).default('month') }).parse(req.query).period;
    return { groups: await groupRanking(db, p) };
  });

  app.get('/groups/mine', async (req): Promise<MyGroupResponse> => ({ group: await myGroup(db, requireUser(req).groupId) }));

  app.get('/honors', async (req): Promise<HonorsResponse> => {
    requireUser(req);
    return { honors: await honors(db) };
  });

  app.get('/badges/mine', async (req): Promise<BadgesResponse> => {
    const user = requireUser(req);
    const [all, mine] = await Promise.all([
      db.select().from(badges).orderBy(asc(badges.order)),
      db.select().from(userBadges).where(eq(userBadges.userId, user.id)),
    ]);
    const earned = new Set(mine.map((b) => b.badgeId));
    return {
      badges: all.map((b) => ({ id: b.id, name: b.name, description: b.description, icon: b.icon, earned: earned.has(b.id), progress: earned.has(b.id) ? 1 : 0 })),
    };
  });
};
