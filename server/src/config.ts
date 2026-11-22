import { existsSync } from 'node:fs';

/** Runtime configuration from environment variables (see .env.example). */
if (existsSync('.env')) process.loadEnvFile('.env');

const env = process.env;

const list = (v: string | undefined) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export const config = {
  port: Number(env.PORT ?? 3000),
  host: env.HOST ?? '0.0.0.0',
  databaseUrl: env.DATABASE_URL ?? 'pglite://./.data/pglite',
  migrationsDir: env.MIGRATIONS_DIR ?? './drizzle',
  authProvider: (env.AUTH_PROVIDER ?? 'dev') as 'dev' | 'ldap',
  ldap: {
    url: env.LDAP_URL ?? '',
    baseDn: env.LDAP_BASE_DN ?? '',
    bindDn: env.LDAP_BIND_DN ?? '',
    bindPassword: env.LDAP_BIND_PASSWORD ?? '',
    userAttr: env.LDAP_USER_ATTR ?? 'sAMAccountName',
    tlsVerify: env.LDAP_TLS_VERIFY !== 'false',
  },
  adminUsernames: list(env.ADMIN_USERNAMES),
  uploadDir: env.UPLOAD_DIR ?? './.data/uploads',
  cookieSecure: env.COOKIE_SECURE === 'true',
  sessionDays: Number(env.SESSION_DAYS ?? 30),
  clientDist: env.CLIENT_DIST ?? '',
  /** Max upload size in bytes. */
  uploadMaxBytes: 5 * 1024 * 1024,
};

export type Config = typeof config;
