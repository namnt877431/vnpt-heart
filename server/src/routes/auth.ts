import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { MeResponse } from '../../../shared/api-types';
import type { AuthProvider } from '../auth/provider';
import { createSession, deleteSession, SESSION_COOKIE } from '../auth/session';
import { groups, users } from '../db/schema';
import { HttpError, requireUser, type SessionUser } from '../http';
import { classifyServerError, recordError } from '../services/errors';

const loginBody = z.object({ username: z.string().trim().min(1).max(100), password: z.string().min(1).max(200) });

export const meOf = async (app: FastifyInstance, u: SessionUser): Promise<MeResponse> => {
  const group = u.groupId ? (await app.db.select().from(groups).where(eq(groups.id, u.groupId)).limit(1))[0] : undefined;
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    title: u.title,
    unit: u.unit,
    role: u.role,
    groupId: u.groupId,
    groupName: group?.name ?? null,
  };
};

export const authRoutes = (provider: AuthProvider) => async (app: FastifyInstance) => {
  const { db, config } = app;

  // Limit per IP; generous because staff behind one office NAT share an address.
  app.post('/auth/login', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = loginBody.parse(req.body);
    const username = body.username.toLowerCase();
    let identity: Awaited<ReturnType<AuthProvider['authenticate']>>;
    try {
      identity = await provider.authenticate(username, body.password);
    } catch (err) {
      // the login backend (LDAP) is unreachable or misconfigured: log it as a set-up problem
      req.log.error(err);
      const e = err as Error;
      await recordError(db, {
        source: 'server',
        category: 'config',
        message: `Không đăng nhập được qua ${provider.name.toUpperCase()}: ${e.message ?? String(err)}`,
        stack: e.stack,
        url: 'POST /api/auth/login',
        detail: [`tài khoản đang đăng nhập: ${username}`, classifyServerError(err).detail].filter(Boolean).join(' · '),
        userAgent: String(req.headers['user-agent'] ?? ''),
        ip: req.ip,
      }).catch((logErr) => req.log.error(logErr));
      throw new HttpError(503, 'Chưa kết nối được máy chủ đăng nhập, vui lòng thử lại sau ít phút');
    }
    if (!identity) throw new HttpError(401, 'Sai tên đăng nhập hoặc mật khẩu');

    const isAdmin = config.adminUsernames.includes(username);
    const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existing && !existing.active) throw new HttpError(403, 'Tài khoản đã bị khóa, liên hệ BTC');

    const profile = {
      ...(identity.name ? { name: identity.name } : {}),
      ...(identity.email ? { email: identity.email } : {}),
      ...(identity.unit ? { unit: identity.unit } : {}),
      ...(identity.title ? { title: identity.title } : {}),
      lastLoginAt: new Date(),
    };
    let user: SessionUser;
    if (existing) {
      [user] = await db
        .update(users)
        .set({ ...profile, ...(isAdmin ? { role: 'admin' as const } : {}) })
        .where(eq(users.id, existing.id))
        .returning();
    } else {
      [user] = await db
        .insert(users)
        .values({ username, name: identity.name ?? username, ...profile, role: isAdmin ? 'admin' : 'player' })
        .returning();
    }

    const session = await createSession(db, user.id, config.sessionDays);
    reply.setCookie(SESSION_COOKIE, session.token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: config.cookieSecure,
      expires: session.expiresAt,
    });
    return meOf(app, user);
  });

  app.post('/auth/logout', async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    if (token) await deleteSession(db, token);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/me', async (req) => meOf(app, requireUser(req)));
};
