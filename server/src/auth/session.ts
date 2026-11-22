import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, lt } from 'drizzle-orm';
import type { Db } from '../db/client';
import { sessions, users } from '../db/schema';

export const SESSION_COOKIE = 'vh_session';

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

/** New session; returns the cookie token (only its hash is stored). */
export const createSession = async (db: Db, userId: string, days: number): Promise<{ token: string; expiresAt: Date }> => {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + days * 86_400_000);
  await db.insert(sessions).values({ id: hash(token), userId, expiresAt });
  // opportunistic cleanup of expired sessions
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  return { token, expiresAt };
};

export const userBySession = async (db: Db, token: string) => {
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hash(token)), gt(sessions.expiresAt, new Date()), eq(users.active, true)))
    .limit(1);
  return row?.user ?? null;
};

export const deleteSession = async (db: Db, token: string) => {
  await db.delete(sessions).where(eq(sessions.id, hash(token)));
};

export const deleteUserSessions = async (db: Db, userId: string) => {
  await db.delete(sessions).where(eq(sessions.userId, userId));
};
