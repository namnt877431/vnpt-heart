import { createHash } from 'node:crypto';
import { lt, sql } from 'drizzle-orm';
import type { ErrorCategory } from '../../../shared/api-types';
import { browserLabel } from '../../../shared/user-agent';
import type { Db } from '../db/client';
import { errorEvents, errorReports } from '../db/schema';

/**
 * Error log: browser errors (POST /api/client-errors) and server failures.
 * `error_reports` = one row per kind of error (fingerprint) with a count;
 * `error_events` = every occurrence (account, browser, IP, details).
 */

export interface ErrorInput {
  source: 'client' | 'server';
  category?: ErrorCategory;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  release?: string;
  userId?: string | null;
  detail?: string;
  ip?: string;
  /** When it happened, if reported later (clamped to the last 7 days). */
  at?: number;
}

const KEEP_DAYS = 30;
const DAY = 86_400_000;

const cut = (s: string | undefined, max: number) => (s ?? '').slice(0, max);

/** Same error from different builds/lines/users -> same fingerprint. */
export const fingerprint = (e: Pick<ErrorInput, 'source' | 'message' | 'stack'>): string => {
  const message = e.message
    .replace(/https?:\/\/\S+/g, '<url>')
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27}\b/gi, '<id>')
    .replace(/\d+/g, '#');
  // first stack frame, without hashed bundle names and line:col
  const frame = (e.stack ?? '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith('at ') || l.includes('@'))
    ?.replace(/-[A-Za-z0-9_]{8}\.js/g, '.js')
    .replace(/:\d+:\d+\)?$/, '')
    .replace(/\?[^)\s]*/g, '');
  return createHash('sha1').update(`${e.source}|${message}|${frame ?? ''}`).digest('hex');
};

/** System error codes that mean "can't reach / can't use something the server depends on". */
const CONFIG_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ECONNRESET',
  'ENOENT',
  'EACCES',
  'EPERM',
  'EROFS',
  'ENOSPC',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'CERT_HAS_EXPIRED',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  '28P01', // PostgreSQL: wrong password
  '3D000', // database does not exist
  '53300', // too many connections
  '57P03', // database starting up
]);
const CONFIG_TEXT = /ldap|password authentication failed|does not exist|certificate|too many clients|getaddrinfo/i;
const LDAP_ERRORS = /^(InvalidCredentials|NoSuchObject|InsufficientAccessRights|UnwillingToPerform|Unavailable|Busy|ConfidentialityRequired|StrongAuthRequired)Error$/;

/**
 * Server failure -> 'config' when it looks like the set-up (LDAP/DB unreachable,
 * wrong password in .env, missing folder, TLS certificate), otherwise a code bug.
 */
export const classifyServerError = (err: unknown): { category: 'config' | 'server'; detail: string } => {
  const chain: { code?: unknown; name?: unknown; message?: unknown; cause?: unknown; errors?: unknown }[] = [];
  let cur: unknown = err;
  for (let i = 0; cur && typeof cur === 'object' && i < 4; i++) {
    chain.push(cur as (typeof chain)[number]);
    const c = cur as (typeof chain)[number];
    cur = c.cause ?? (Array.isArray(c.errors) ? c.errors[0] : undefined);
  }
  const codes = [...new Set(chain.map((c) => c.code).filter((c): c is string => typeof c === 'string'))];
  const text = chain.map((c) => `${String(c.name ?? '')} ${String(c.message ?? '')}`).join(' | ');
  const config = codes.some((c) => CONFIG_CODES.has(c)) || CONFIG_TEXT.test(text) || chain.some((c) => LDAP_ERRORS.test(String(c.name ?? '')));
  const causes = chain
    .slice(1)
    .map((c) => String(c.message ?? ''))
    .filter(Boolean);
  const detail = [codes.length ? `mã ${codes.join(', ')}` : '', ...causes.map((m) => `nguyên nhân: ${m}`)].filter(Boolean).join(' · ');
  return { category: config ? 'config' : 'server', detail: detail.slice(0, 500) };
};

export const recordError = async (db: Db, e: ErrorInput): Promise<void> => {
  const now = new Date();
  const row = {
    fingerprint: fingerprint(e),
    source: e.source,
    category: e.category ?? (e.source === 'server' ? 'server' : 'browser'),
    message: cut(e.message, 500) || '(không có nội dung)',
    stack: cut(e.stack, 4000),
    url: cut(e.url, 300),
    userAgent: cut(e.userAgent, 300),
    release: cut(e.release, 60),
    lastUserId: e.userId ?? null,
  };
  const [report] = await db
    .insert(errorReports)
    .values(row)
    .onConflictDoUpdate({
      target: errorReports.fingerprint,
      set: {
        count: sql`${errorReports.count} + 1`,
        lastSeen: now,
        category: row.category,
        stack: row.stack,
        url: row.url,
        userAgent: row.userAgent,
        release: row.release,
        lastUserId: row.lastUserId,
      },
    })
    .returning({ id: errorReports.id });

  const at = e.at && e.at > now.getTime() - 7 * DAY && e.at <= now.getTime() ? new Date(e.at) : now;
  await db.insert(errorEvents).values({
    reportId: report.id,
    userId: e.userId ?? null,
    userAgent: row.userAgent,
    browser: browserLabel(row.userAgent),
    url: row.url,
    release: row.release,
    detail: cut(e.detail, 500),
    ip: cut(e.ip, 64),
    createdAt: at,
  });

  // occasional cleanup (events go with their report)
  if (Math.random() < 0.05) {
    const old = new Date(now.getTime() - KEEP_DAYS * DAY);
    await db.delete(errorReports).where(lt(errorReports.lastSeen, old));
    await db.delete(errorEvents).where(lt(errorEvents.createdAt, old));
  }
};
