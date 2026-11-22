import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyServerOptions } from 'fastify';
import { ZodError } from 'zod';
import { createProvider, type AuthProvider } from './auth/provider';
import { SESSION_COOKIE, userBySession } from './auth/session';
import type { Config } from './config';
import type { Db } from './db/client';
import { HttpError } from './http';
import { classifyServerError, recordError } from './services/errors';
import { adminContentRoutes } from './routes/admin/content';
import { adminOpsRoutes } from './routes/admin/ops';
import { adminPeopleRoutes } from './routes/admin/people';
import { authRoutes } from './routes/auth';
import { playerRoutes } from './routes/player';

export interface AppDeps {
  config: Config;
  db: Db;
  /** Override the login backend (tests). */
  provider?: AuthProvider;
  logger?: FastifyServerOptions['logger'];
}

/** Build the HTTP app (without listening) — used by index.ts and the tests. */
export const buildApp = async ({ config, db, provider, logger = true }: AppDeps) => {
  const app = Fastify({ logger, trustProxy: true, bodyLimit: 2 * 1024 * 1024 });
  app.decorate('db', db);
  app.decorate('config', config);
  app.decorateRequest('user', null);

  await app.register(cookie);
  await app.register(rateLimit, { global: false });
  await app.register(multipart, { limits: { fileSize: config.uploadMaxBytes, files: 1 } });

  app.addHook('onRequest', async (req) => {
    const token = req.cookies[SESSION_COOKIE];
    req.user = token ? await userBySession(db, token) : null;
  });

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof HttpError) return reply.status(err.status).send({ error: err.message });
    if (err instanceof ZodError) {
      const first = err.issues[0];
      const where = first?.path.length ? ` (${first.path.join('.')})` : '';
      return reply.status(400).send({ error: `Dữ liệu không hợp lệ${where}: ${first?.message ?? ''}`, issues: err.issues });
    }
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status < 500) return reply.status(status).send({ error: (err as Error).message });
    req.log.error(err);
    const e = err as Error;
    recordError(db, {
      source: 'server',
      ...classifyServerError(err),
      message: e.message ?? String(err),
      stack: e.stack,
      url: `${req.method} ${req.url.split('?')[0]}`,
      userAgent: String(req.headers['user-agent'] ?? ''),
      userId: req.user?.id ?? null,
      ip: req.ip,
    }).catch((logErr) => req.log.error(logErr));
    return reply.status(500).send({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  });

  await app.register(
    async (api) => {
      await api.register(authRoutes(provider ?? createProvider(config, db)));
      await api.register(playerRoutes);
      await api.register(
        async (admin) => {
          await admin.register(adminContentRoutes);
          await admin.register(adminPeopleRoutes);
          await admin.register(adminOpsRoutes);
        },
        { prefix: '/admin' },
      );
      api.get('/health', async () => ({ ok: true }));
    },
    { prefix: '/api' },
  );

  // Uploaded images (Caddy serves them directly in production; this covers dev / Windows).
  mkdirSync(config.uploadDir, { recursive: true });
  await app.register(fastifyStatic, { root: resolve(config.uploadDir), prefix: '/uploads/', decorateReply: false });

  // Optional: serve the built game + admin from Node (no separate web server).
  if (config.clientDist && existsSync(config.clientDist)) {
    await app.register(fastifyStatic, { root: resolve(config.clientDist), prefix: '/', decorateReply: false });
  }

  return app;
};
