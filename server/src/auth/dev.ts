import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { users } from '../db/schema';
import { verifyPassword } from './password';
import type { AuthProvider } from './provider';

/** Test accounts with a password hash in `users` (created by the seed). Not for production. */
export const devProvider = (db: Db): AuthProvider => ({
  name: 'dev',
  async authenticate(username, password) {
    const [u] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!u?.passwordHash || !(await verifyPassword(password, u.passwordHash))) return null;
    return { username: u.username };
  },
});
