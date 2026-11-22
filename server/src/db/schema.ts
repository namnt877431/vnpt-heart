import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { LevelKind } from '../../../shared/content-types';
import type { GameSpec } from '../../../shared/game-types';
import type { ErrorCategory, LevelStatus, Role, StoryStatus } from '../../../shared/api-types';

/**
 * Database schema. After editing: `npm run db:generate` (writes a SQL migration
 * to ./drizzle — commit it). Pending migrations run when the server starts.
 */

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

export const groups = pgTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  leaderId: uuid('leader_id'),
  createdAt: createdAt(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Login name from LDAP (lower-case). */
  username: text('username').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull().default(''),
  unit: text('unit').notNull().default(''),
  title: text('title').notNull().default(''),
  groupId: text('group_id').references(() => groups.id, { onDelete: 'set null' }),
  role: text('role').$type<Role>().notNull().default('player'),
  active: boolean('active').notNull().default(true),
  /** Only for AUTH_PROVIDER=dev test accounts (scrypt). LDAP users have none. */
  passwordHash: text('password_hash'),
  createdAt: createdAt(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

export const sessions = pgTable('sessions', {
  /** sha256 of the cookie token (the token itself is never stored). */
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: createdAt(),
});

export const chapters = pgTable('chapters', {
  id: text('id').primaryKey(),
  order: integer('order').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull().default(''),
  /** Asset key of the island building (client/src/config/assets.ts). */
  building: text('building').notNull().default('bld-heart'),
  intro: text('intro').notNull().default(''),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const levels = pgTable(
  'levels',
  {
    /** Progress key. Frozen once the level has been published (`locked`). */
    id: text('id').primaryKey(),
    chapterId: text('chapter_id').notNull().references(() => chapters.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    kind: text('kind').$type<LevelKind>().notNull().default('normal'),
    spec: jsonb('spec').$type<GameSpec | null>(),
    status: text('status').$type<LevelStatus>().notNull().default('draft'),
    /** Opens to players at this time (null = immediately when published). */
    publishAt: timestamp('publish_at', { withTimezone: true }),
    locked: boolean('locked').notNull().default(false),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('levels_chapter_idx').on(t.chapterId, t.position)],
);

export const levelRevisions = pgTable('level_revisions', {
  id: serial('id').primaryKey(),
  levelId: text('level_id').notNull().references(() => levels.id, { onDelete: 'cascade' }),
  kind: text('kind').$type<LevelKind>().notNull(),
  spec: jsonb('spec').$type<GameSpec | null>(),
  status: text('status').$type<LevelStatus>().notNull(),
  editedBy: uuid('edited_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
});

export const plays = pgTable(
  'plays',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    levelId: text('level_id').notNull(),
    correct: integer('correct').notNull(),
    total: integer('total').notNull(),
    timeMs: integer('time_ms').notNull(),
    stars: integer('stars').notNull(),
    points: integer('points').notNull(),
    /** Points added to the total (improvement over the previous best). */
    gained: integer('gained').notNull(),
    doubleXp: boolean('double_xp').notNull().default(false),
    /** Random id from the browser: a result re-sent after a network error is saved once. */
    clientId: text('client_id'),
    createdAt: createdAt(),
  },
  (t) => [
    index('plays_user_time_idx').on(t.userId, t.createdAt),
    index('plays_time_idx').on(t.createdAt),
    uniqueIndex('plays_client_id_idx').on(t.userId, t.clientId),
  ],
);

export const levelRecords = pgTable(
  'level_records',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    levelId: text('level_id').notNull(),
    stars: integer('stars').notNull().default(0),
    bestPoints: integer('best_points').notNull().default(0),
    plays: integer('plays').notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.levelId] })],
);

export const playerState = pgTable('player_state', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  doubleXpNext: boolean('double_xp_next').notNull().default(false),
  seenIntros: jsonb('seen_intros').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  /** Mystery game rolled by the server, waiting for its result: { levelId, spec }. */
  pendingMystery: jsonb('pending_mystery').$type<{ levelId: string; spec: GameSpec } | null>(),
});

export const pointEvents = pgTable(
  'point_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    reason: text('reason').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('point_events_user_time_idx').on(t.userId, t.createdAt)],
);

export const stories = pgTable('stories', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  unit: text('unit').notNull().default(''),
  situation: text('situation').notNull(),
  problem: text('problem').notNull().default(''),
  handling: text('handling').notNull().default(''),
  difficulty: text('difficulty').notNull().default(''),
  outcome: text('outcome').notNull().default(''),
  lesson: text('lesson').notNull().default(''),
  anonymous: boolean('anonymous').notNull().default(false),
  status: text('status').$type<StoryStatus>().notNull().default('new'),
  editorNote: text('editor_note').notNull().default(''),
  levelId: text('level_id'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const seasons = pgTable('seasons', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  startsAt: date('starts_at').notNull(),
  endsAt: date('ends_at').notNull(),
});

export const badges = pgTable('badges', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  /** Icon name from client/src/ui/icons.ts */
  icon: text('icon').notNull().default('medal'),
  order: integer('order').notNull().default(0),
});

export const userBadges = pgTable(
  'user_badges',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    badgeId: text('badge_id').notNull().references(() => badges.id, { onDelete: 'cascade' }),
    awardedBy: uuid('awarded_by').references(() => users.id, { onDelete: 'set null' }),
    awardedAt: timestamp('awarded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeId] })],
);

export const uploads = pgTable('uploads', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** File name on disk inside UPLOAD_DIR. */
  fileName: text('file_name').notNull(),
  originalName: text('original_name').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
});

/**
 * Errors from players' browsers and from the server itself, grouped by
 * fingerprint (same error = one row, `count` goes up). Kept 30 days.
 */
export const errorReports = pgTable(
  'error_reports',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    fingerprint: text('fingerprint').notNull().unique(),
    source: text('source').$type<'client' | 'server'>().notNull(),
    category: text('category').$type<ErrorCategory>().notNull().default('browser'),
    message: text('message').notNull(),
    stack: text('stack').notNull().default(''),
    /** Last page / API path where it happened. */
    url: text('url').notNull().default(''),
    userAgent: text('user_agent').notNull().default(''),
    release: text('release').notNull().default(''),
    lastUserId: uuid('last_user_id').references(() => users.id, { onDelete: 'set null' }),
    count: integer('count').notNull().default(1),
    firstSeen: timestamp('first_seen', { withTimezone: true }).notNull().defaultNow(),
    lastSeen: timestamp('last_seen', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('error_reports_last_seen_idx').on(t.lastSeen)],
);

/** Each occurrence of an error: who, which browser/IP, details. Deleted with its report or after 30 days. */
export const errorEvents = pgTable(
  'error_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    reportId: bigint('report_id', { mode: 'number' })
      .notNull()
      .references(() => errorReports.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    userAgent: text('user_agent').notNull().default(''),
    /** Parsed from userAgent ("Chrome 131 · Android"), for grouping. */
    browser: text('browser').notNull().default(''),
    url: text('url').notNull().default(''),
    release: text('release').notNull().default(''),
    detail: text('detail').notNull().default(''),
    ip: text('ip').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('error_events_report_idx').on(t.reportId, t.createdAt), index('error_events_user_idx').on(t.userId)],
);

export const auditLog = pgTable('audit_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull().default(''),
  data: jsonb('data'),
  createdAt: createdAt(),
});
