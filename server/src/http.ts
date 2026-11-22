import type { FastifyRequest } from 'fastify';
import type { Role } from '../../shared/api-types';
import type { Config } from './config';
import type { Db } from './db/client';
import type { users } from './db/schema';

/** Logged-in user attached to the request by the session hook (app.ts). */
export type SessionUser = typeof users.$inferSelect;

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
    config: Config;
  }
  interface FastifyRequest {
    user: SessionUser | null;
  }
}

/** Throw to answer with a status and a Vietnamese message: { error }. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const requireUser = (req: FastifyRequest): SessionUser => {
  if (!req.user) throw new HttpError(401, 'Vui lòng đăng nhập');
  return req.user;
};

const RANK: Record<Role, number> = { player: 0, editor: 1, admin: 2 };

/** editor ⊂ admin: requireRole(req, 'editor') lets admins through too. */
export const requireRole = (req: FastifyRequest, role: Role): SessionUser => {
  const user = requireUser(req);
  if (RANK[user.role] < RANK[role]) throw new HttpError(403, 'Bạn không có quyền thực hiện thao tác này');
  return user;
};
