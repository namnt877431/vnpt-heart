import type { MysteryResponse, PlayRequest, PlayResponse, ProgressResponse } from '../../../shared/api-types';
import type { Mission } from '../../../shared/domain-types';
import * as rules from '../../../shared/progress-rules';
import { DEMO } from '../config/demo';
import { API_MODE, ApiError, api, apiGet, apiPost, isRetryable } from '../data/api';
import type { Chapter } from '../data/content';
import { CHAPTERS } from '../data/content';
import { todayMission } from '../data/mock';
import { me } from '../data/player';
import { bus } from './events';
import type { GameResult } from './scoring';

/**
 * Player progress, read synchronously by screens.
 *   Offline demo: stored in this browser's localStorage.
 *   API mode:     loaded from the server at boot (`loadProgress`); results are
 *                 graded and saved by the server (POST /plays), the local copy
 *                 is updated optimistically then replaced by the server's answer.
 */

export interface LevelRecord {
  stars: number;
  bestPoints: number;
  plays: number;
}

export interface SharedStory {
  at: string;
  unit: string;
  situation: string;
  problem: string;
  handling: string;
  difficulty: string;
  outcome: string;
  lesson: string;
  anonymous: boolean;
}

interface ProgressState {
  v: 1;
  levels: Record<string, LevelRecord>;
  /** Points from mystery gifts etc. */
  bonusPoints: number;
  /** Next finished level earns double points. */
  doubleXpNext: boolean;
  /** Chapters whose robot intro has been shown. */
  seenIntros: string[];
  stories: SharedStory[];
}

const KEY = 'vnpt-heart:progress:v1';

const fresh = (): ProgressState => ({ v: 1, levels: {}, bonusPoints: 0, doubleXpNext: false, seenIntros: [], stories: [] });

const seeded = (): ProgressState => {
  const s = fresh();
  if (DEMO.seedProgress && !API_MODE) {
    s.levels['van-hoa-1'] = { stars: 3, bestPoints: 110, plays: 1 };
    s.levels['van-hoa-2'] = { stars: 2, bestPoints: 80, plays: 2 };
  }
  return s;
};

const load = (): ProgressState => {
  if (API_MODE) return fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProgressState;
      if (parsed.v === 1) return { ...fresh(), ...parsed };
    }
  } catch {
    /* storage blocked or corrupt: fall through */
  }
  return seeded();
};

let state = load();
let mission: Mission = todayMission;
/** BTC setting (API mode) / demo switch: every chapter open. */
let unlockAll: boolean = DEMO.unlockAllChapters && !API_MODE;

const changed = () => {
  if (!API_MODE) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* private mode etc.: progress lives for this session only */
    }
  }
  bus.emit('progress:changed');
};

const applyServer = (p: ProgressResponse) => {
  state = { ...state, levels: p.levels, bonusPoints: p.bonusPoints, doubleXpNext: p.doubleXpNext, seenIntros: p.seenIntros };
  mission = p.mission;
};

// ------------------------------------------------------------------ outbox (API mode)
// Results that couldn't reach the server (offline, timeout, server down) wait in
// localStorage and are re-sent in order — on reconnect, every 20 s, and at the
// next visit. Each carries a clientId so the server never counts one twice.

const outboxKey = () => `vnpt-heart:outbox:${me.id}`;
let outbox: PlayRequest[] = [];
let online = true;
let flushing = false;

const saveOutbox = () => {
  try {
    if (outbox.length) localStorage.setItem(outboxKey(), JSON.stringify(outbox));
    else localStorage.removeItem(outboxKey());
  } catch {
    /* storage blocked: the queue lives in memory for this visit */
  }
};

const netStatus = () => bus.emit('net:status', { online, pending: outbox.length });

const newClientId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

const refreshFromServer = async () => {
  try {
    applyServer(await apiGet<ProgressResponse>('/progress'));
    changed();
  } catch {
    /* keep the local copy until the next refresh */
  }
};

/** Send one result; returns false when it should stay queued. */
const send = async (body: PlayRequest): Promise<boolean> => {
  try {
    const res = await apiPost<PlayResponse>('/plays', body);
    state.levels[body.levelId] = res.record;
    state.doubleXpNext = res.doubleXpNext;
    online = true;
    changed();
    return true;
  } catch (e) {
    if (isRetryable(e)) {
      online = false;
      return false;
    }
    // refused by the server (e.g. level closed meanwhile): drop it and resync
    const message = e instanceof ApiError ? e.message : 'Lỗi không xác định';
    bus.emit('progress:error', { message: `Chưa lưu được kết quả: ${message}` });
    await refreshFromServer();
    return true;
  }
};

/** Re-send queued results in order; stops at the first one that still can't get through. */
export const flushOutbox = async (): Promise<void> => {
  if (!API_MODE || flushing || !outbox.length) return;
  flushing = true;
  try {
    while (outbox.length && (await send(outbox[0]))) {
      outbox.shift();
      saveOutbox();
    }
  } finally {
    flushing = false;
    netStatus();
  }
};

if (API_MODE) {
  window.addEventListener('online', () => void flushOutbox());
  window.addEventListener('offline', () => {
    online = false;
    netStatus();
  });
  window.setInterval(() => void flushOutbox(), 20_000);
}

/** API mode: send results left from a previous visit, then fetch my progress (called at boot). */
export const loadProgress = async (unlockAllChapters: boolean): Promise<void> => {
  unlockAll = unlockAllChapters;
  try {
    outbox = JSON.parse(localStorage.getItem(outboxKey()) ?? '[]') as PlayRequest[];
  } catch {
    outbox = [];
  }
  await flushOutbox();
  applyServer(await apiGet<ProgressResponse>('/progress'));
  // results still queued stay visible locally until they reach the server
  for (const p of outbox) {
    const r = state.levels[p.levelId];
    if (!r) state.levels[p.levelId] = { stars: 1, bestPoints: 0, plays: 1 };
  }
  bus.emit('progress:changed');
  netStatus();
};

// ------------------------------------------------------------------ queries

export const levelRecord = (levelId: string): LevelRecord | undefined => state.levels[levelId];

export const isLevelDone = (levelId: string): boolean => rules.isLevelDone(state.levels, levelId);

export const isChapterDone = (chapter: Chapter): boolean => rules.isChapterDone(state.levels, chapter);

export const isChapterUnlocked = (chapter: Chapter): boolean => rules.isChapterUnlocked(CHAPTERS, state.levels, chapter, unlockAll);

export const isLevelUnlocked = (chapter: Chapter, index: number): boolean =>
  rules.isLevelUnlocked(CHAPTERS, state.levels, chapter, index, unlockAll);

/** First unfinished level of a chapter (or the last one if all done). */
export const nextLevelIndex = (chapter: Chapter): number => {
  const i = chapter.levels.findIndex((l) => !isLevelDone(l.id));
  return i === -1 ? chapter.levels.length - 1 : i;
};

export const chapterStars = (chapter: Chapter): { earned: number; max: number; done: number } => ({
  earned: chapter.levels.reduce((s, l) => s + (state.levels[l.id]?.stars ?? 0), 0),
  max: chapter.levels.length * 3,
  done: chapter.levels.filter((l) => isLevelDone(l.id)).length,
});

/** The chapter the player is "on": first unlocked chapter with unfinished levels. */
export const currentChapter = (): Chapter =>
  CHAPTERS.find((c) => isChapterUnlocked(c) && !isChapterDone(c)) ?? CHAPTERS[CHAPTERS.length - 1];

export const earnedPoints = (): number =>
  Object.values(state.levels).reduce((s, r) => s + r.bestPoints, 0) + state.bonusPoints;

export const totalThreeStars = (): number => Object.values(state.levels).filter((r) => r.stars === 3).length;

export const hasDoubleXp = (): boolean => state.doubleXpNext;
export const introSeen = (chapterId: string): boolean => state.seenIntros.includes(chapterId);
export const stories = (): SharedStory[] => [...state.stories];
export const dailyMission = (): Mission => mission;

// ---------------------------------------------------------------- mutations

/** Store a finished level. Only improvements over the best score add points. */
export const recordResult = (
  levelId: string,
  result: GameResult,
  stars: number,
  points: number,
): { gained: number; improvedStars: boolean } => {
  const prev = state.levels[levelId] ?? { stars: 0, bestPoints: 0, plays: 0 };
  const next: LevelRecord = {
    stars: Math.max(prev.stars, stars),
    bestPoints: Math.max(prev.bestPoints, points),
    plays: prev.plays + 1,
  };
  state.levels[levelId] = next;
  if (stars > 0) state.doubleXpNext = false;
  if (stars > 0) mission = { ...mission, progress: Math.min(mission.target, mission.progress + 1) };
  changed();

  if (API_MODE) {
    const body: PlayRequest = {
      levelId,
      correct: result.correct,
      total: result.total,
      timeMs: Math.round(result.timeMs),
      failed: !!result.failed,
      clientId: newClientId(),
    };
    outbox.push(body);
    saveOutbox();
    void flushOutbox();
  }
  return { gained: next.bestPoints - prev.bestPoints, improvedStars: next.stars > prev.stars };
};

/** Offline demo only (the server applies mystery rewards itself in API mode). */
export const addBonusPoints = (n: number) => {
  state.bonusPoints += n;
  changed();
};

export const setDoubleXp = (on: boolean) => {
  state.doubleXpNext = on;
  changed();
};

/** API mode: flip a mystery card on the server; instant rewards are applied there. */
export const openMysteryOnServer = async (levelId: string) => {
  const res = await apiPost<MysteryResponse>(`/mystery/${encodeURIComponent(levelId)}`);
  applyServer(res.progress);
  changed();
  return res.outcome;
};

export const markIntroSeen = (chapterId: string) => {
  if (!state.seenIntros.includes(chapterId)) state.seenIntros.push(chapterId);
  changed();
  if (API_MODE) api('PATCH', '/progress/state', { seenIntro: chapterId }).catch(() => undefined);
};

export const addStory = async (story: SharedStory): Promise<void> => {
  if (API_MODE) {
    const { at: _at, ...body } = story;
    await apiPost('/stories', body);
  }
  state.stories.push(story);
  changed();
};

export const resetProgress = () => {
  state = seeded();
  changed();
};
