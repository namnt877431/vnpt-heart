import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import pg from 'pg';
import * as schema from './schema';

/** Either driver: real PostgreSQL in production, embedded PGlite for local dev/tests. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface DbHandle {
  db: Db;
  close: () => Promise<void>;
}

/**
 * Open the database and apply pending migrations.
 *   postgres://…          real PostgreSQL
 *   pglite://./some/dir   embedded PostgreSQL stored in that folder
 *   pglite://memory       in-memory (tests)
 */
export const openDb = async (url: string, migrationsDir: string): Promise<DbHandle> => {
  const migrationsFolder = resolve(migrationsDir);
  if (url.startsWith('pglite://')) {
    const target = url.slice('pglite://'.length);
    if (target !== 'memory') mkdirSync(target, { recursive: true });
    const client = target === 'memory' ? new PGlite() : new PGlite(target);
    const db = drizzlePglite(client, { schema });
    await migratePglite(db, { migrationsFolder });
    return { db: db as unknown as Db, close: () => client.close() };
  }
  const pool = new pg.Pool({ connectionString: url, max: 10 });
  const db = drizzlePg(pool, { schema });
  await migratePg(db, { migrationsFolder });
  return { db: db as unknown as Db, close: () => pool.end() };
};
