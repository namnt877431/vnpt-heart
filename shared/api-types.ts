import type { Chapter, LevelKind } from './content-types';
import type { Badge, GroupRank, Honor, Mission, RankEntry, RankPeriod } from './domain-types';
import type { GameSpec } from './game-types';
import type { MysteryOutcome } from './mystery';

/**
 * Request/response shapes of the HTTP API (server/ ↔ client/ game & admin).
 * All routes live under /api; admin routes under /api/admin.
 */

export type Role = 'player' | 'editor' | 'admin';

// ------------------------------------------------------------------ auth

export interface LoginRequest {
  username: string;
  password: string;
}

export interface MeResponse {
  id: string;
  username: string;
  name: string;
  /** Job title shown under the name, e.g. "NV Kinh doanh". */
  title: string;
  unit: string;
  role: Role;
  groupId: string | null;
  groupName: string | null;
}

// ------------------------------------------------------------------ player

export interface ContentResponse {
  chapters: Chapter[];
  /** BTC setting: every chapter open (otherwise chapter N+1 opens after chapter N). */
  unlockAllChapters: boolean;
}

export interface LevelRecordDto {
  stars: number;
  bestPoints: number;
  plays: number;
}

export interface ProgressResponse {
  levels: Record<string, LevelRecordDto>;
  bonusPoints: number;
  doubleXpNext: boolean;
  seenIntros: string[];
  mission: Mission;
}

export interface PlayRequest {
  levelId: string;
  correct: number;
  total: number;
  timeMs: number;
  failed?: boolean;
  /** Random id per finished game: re-sending after a network error doesn't count twice. */
  clientId?: string;
}

/**
 * Likely cause of an error, as far as the reporter can tell (admin filter + hint):
 * network = the player's connection, browser = a script error on the device,
 * config = the server set-up (LDAP/DB unreachable, missing file, API not running),
 * server = a bug in the server code.
 */
export type ErrorCategory = 'network' | 'browser' | 'config' | 'server';

export interface ClientErrorReport {
  message: string;
  stack?: string;
  url?: string;
  release?: string;
  /** Default 'browser'. The client never claims 'server'. */
  category?: Exclude<ErrorCategory, 'server'>;
  /** Short facts about this occurrence, e.g. "gián đoạn 35 giây · 3 yêu cầu lỗi · mạng 4g". */
  detail?: string;
  /** When it happened (ms since epoch) — reports can be sent later, after the network is back. */
  at?: number;
}

/** One kind of error (same fingerprint), with how often and for whom. */
export interface AdminErrorReport {
  id: number;
  source: 'client' | 'server';
  category: ErrorCategory;
  message: string;
  stack: string;
  /** Last page / API path. */
  url: string;
  release: string;
  count: number;
  /** Distinct accounts that hit it in the kept occurrences. */
  users: number;
  /** "Name (username)" of the last account, null = not logged in / server. */
  lastUser: string | null;
  /** Occurrences per browser, most first, e.g. Chrome 131 · Android. */
  browsers: { label: string; count: number }[];
  firstSeen: string;
  lastSeen: string;
}

export interface AdminErrorList {
  reports: AdminErrorReport[];
  /** Kinds of error per category (ignores the account filter). */
  counts: Record<ErrorCategory, number>;
}

/** One occurrence of an error. */
export interface AdminErrorEvent {
  id: number;
  at: string;
  user: { username: string; name: string; unit: string } | null;
  browser: string;
  userAgent: string;
  url: string;
  release: string;
  detail: string;
  ip: string;
}

export interface PlayResponse {
  stars: number;
  points: number;
  /** Points added to the player's total (only improvements over the best score count). */
  gained: number;
  improvedStars: boolean;
  record: LevelRecordDto;
  doubleXpNext: boolean;
}

export interface StateRequest {
  seenIntro?: string;
}

/** POST /mystery/:levelId — the server rolls the card and applies instant rewards. */
export interface MysteryResponse {
  outcome: MysteryOutcome;
  progress: ProgressResponse;
}

export interface StoryRequest {
  unit: string;
  situation: string;
  problem: string;
  handling: string;
  difficulty: string;
  outcome: string;
  lesson: string;
  anonymous: boolean;
}

export interface LeaderboardResponse {
  period: RankPeriod;
  entries: RankEntry[];
  /** My row (also when I'm outside the top list); null if I have no points yet. */
  me: RankEntry | null;
}

export interface GroupsResponse {
  groups: GroupRank[];
}

export interface MyGroupResponse {
  group: (GroupRank & {
    leader: string;
    weeklyGoal: { progress: number; target: number; label: string };
    roster: RankEntry[];
  }) | null;
}

export interface HonorsResponse {
  honors: Honor[];
}

export interface BadgesResponse {
  badges: Badge[];
}

// ------------------------------------------------------------------ admin

export type LevelStatus = 'draft' | 'published' | 'archived';

export interface AdminChapter {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  building: string;
  intro: string;
  levels: AdminLevelSummary[];
}

export interface AdminLevelSummary {
  id: string;
  position: number;
  kind: LevelKind;
  type: GameSpec['type'] | null;
  title: string;
  status: LevelStatus;
  /** ISO time the level opens to players (null = as soon as published). */
  publishAt: string | null;
  /** Once published the id is frozen (progress is keyed by it). */
  locked: boolean;
  updatedAt: string;
}

export interface AdminLevel extends AdminLevelSummary {
  chapterId: string;
  spec: GameSpec | null;
}

export interface LevelSaveRequest {
  chapterId: string;
  kind: LevelKind;
  spec: GameSpec | null;
}

export interface LevelPublishRequest {
  /** ISO time; omit/null to open now. */
  publishAt?: string | null;
}

export interface LevelRevision {
  id: number;
  kind: LevelKind;
  spec: GameSpec | null;
  status: LevelStatus;
  editedBy: string | null;
  createdAt: string;
}

export interface ChapterSaveRequest {
  id?: string;
  title: string;
  subtitle: string;
  building: string;
  intro: string;
}

export type StoryStatus = 'new' | 'editing' | 'approved' | 'rejected' | 'used';

export interface AdminStory extends StoryRequest {
  id: number;
  author: string | null;
  status: StoryStatus;
  editorNote: string;
  levelId: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  title: string;
  unit: string;
  role: Role;
  groupId: string | null;
  active: boolean;
  lastLoginAt: string | null;
}

export interface AdminGroup {
  id: string;
  name: string;
  leaderId: string | null;
  members: number;
}

export interface AdminSeason {
  id: number;
  name: string;
  startsAt: string;
  endsAt: string;
}

export interface AdminBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  awarded: number;
}

export interface AdminStats {
  players: number;
  activeToday: number;
  activeWeek: number;
  playsWeek: number;
  daily: { day: string; players: number; plays: number }[];
  groups: { groupId: string; name: string; members: number; activeWeek: number }[];
}

export interface AuditEntry {
  id: number;
  user: string | null;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
}

export interface Settings {
  unlockAllChapters: boolean;
  /** Max bonus points a player can get per day outside levels. */
  bonusCapPerDay: number;
  /** Group ranking score = avg·w.avg + participation%·w.participation + bonus·w.bonus */
  groupWeights: { avg: number; participation: number; bonus: number };
}

export interface ApiError {
  error: string;
}
