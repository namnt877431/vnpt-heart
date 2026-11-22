import type { ClientErrorReport, ErrorCategory } from '../../../shared/api-types';
import { ApiError, setNetObserver, type NetFailure } from '../data/api';

/**
 * Error log, browser side (API mode only). Sends to POST /api/client-errors,
 * seen in the admin page → "Lỗi hệ thống", each with a likely cause:
 *
 * - browser: uncaught script errors (a game bug, or an old browser).
 * - network: connection outages (logged when the connection is back, with how
 *   long and how many requests failed), files that failed to download.
 * - config: the API service not answering (502/503/504), files missing on the server.
 *
 * Reports wait in localStorage while offline / the server is down, so they are
 * not lost. Same error is sent once per visit; at most 20 per visit. Only the
 * error, the page and connection facts are sent — no form contents or answers.
 */

declare const __BUILD__: string;

type Category = Exclude<ErrorCategory, 'server'>;

const MAX_PER_VISIT = 20;
const MAX_QUEUED = 30;
const QUEUE_KEY = 'vnpt-heart:error-queue';
const OUTAGE_KEY = 'vnpt-heart:outage';
const ENDPOINT = `${import.meta.env.VITE_API_BASE ?? ''}/api/client-errors`;

let installed = false;
const seen = new Set<string>();
let queue: ClientErrorReport[] = [];
let timer = 0;
let made = 0;
let sending = false;

const load = <T>(key: string): T | null => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') as T | null;
  } catch {
    return null;
  }
};
const save = (key: string, value: unknown) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / blocked: keep in memory only */
  }
};

const here = () => {
  const screen = document.body?.dataset.screen ?? '';
  return `${location.pathname}${location.hash}${screen ? ` [${screen}]` : ''}`.slice(0, 500);
};

/** "4g", "3g"… where the browser tells (Chrome/Android). */
const netType = (): string | undefined => (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType;

const fmtDuration = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} giây` : `${Math.floor(s / 60)} phút ${s % 60} giây`;
};

// ---- sending ------------------------------------------------------------

const schedule = (ms: number) => {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => flush(), ms);
};

const flush = (beacon = false) => {
  window.clearTimeout(timer);
  if (!queue.length || sending) return;
  // no point while the connection is down: sent when a request succeeds again
  if (outage || !navigator.onLine) return;
  const batch = queue.slice(0, 10);
  const body = JSON.stringify({ errors: batch });
  const done = () => {
    queue.splice(0, batch.length);
    save(QUEUE_KEY, queue.length ? queue : null);
    if (queue.length) schedule(2000);
  };
  if (beacon) {
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'application/json' }))) done();
    return;
  }
  sending = true;
  fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, credentials: 'same-origin', keepalive: true })
    .then((res) => {
      // 400/413: the server will never take these, drop them; 429/5xx: keep for later
      if (res.ok || res.status === 400 || res.status === 413) done();
      else schedule(30_000);
    })
    .catch(() => undefined) // offline again: kept, retried when back
    .finally(() => (sending = false));
};

const enqueue = (r: ClientErrorReport) => {
  queue.push(r);
  if (queue.length > MAX_QUEUED) queue.splice(0, queue.length - MAX_QUEUED);
  save(QUEUE_KEY, queue);
  schedule(1500);
};

/** Chunk/module download failures look like script errors but are the network (or a just-deployed update). */
const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk|Unable to preload CSS/i;

export const reportError = (message: string, stack?: string, category: Category = 'browser', detail?: string): void => {
  if (!installed || made >= MAX_PER_VISIT) return;
  // cross-origin scripts (browser extensions, injected code) give no details: nothing to act on
  if (message === 'Script error.' && !stack) return;
  const key = `${message}|${(stack ?? '').split('\n')[1] ?? ''}`;
  if (seen.has(key)) return;
  seen.add(key);
  made++;
  if (category === 'browser' && CHUNK_ERROR.test(message)) {
    category = 'network';
    detail = detail ?? 'tải mã game bị gián đoạn — do mạng, hoặc vừa cập nhật phiên bản (tải lại trang)';
  }
  enqueue({
    message: message.slice(0, 1000),
    stack: stack?.slice(0, 6000),
    url: here(),
    release: typeof __BUILD__ === 'string' ? __BUILD__ : 'dev',
    category,
    detail: [detail, netType() ? `mạng ${netType()}` : ''].filter(Boolean).join(' · ') || undefined,
    at: Date.now(),
  });
};

// ---- network outages ----------------------------------------------------

interface Outage {
  start: number;
  last: number;
  kind: NetFailure['kind'];
  status?: number;
  failures: number;
  first: string;
  /** The browser itself said it had no network at some point. */
  offline: boolean;
  net?: string;
  url: string;
}

let outage: Outage | null = null;
let probeTimer = 0;

/** While an outage is open and nothing else calls the server, check now and then whether it is back. */
const probe = () => {
  fetch(`${import.meta.env.VITE_API_BASE ?? ''}/api/health`, { cache: 'no-store' })
    .then((res) => {
      if (res.ok) netObserver.ok();
    })
    .catch(() => undefined);
};

const endOutage = (o: Outage, closedBeforeBack: boolean) => {
  const ms = (closedBeforeBack ? o.last : Date.now()) - o.start;
  // a single blip absorbed by the automatic retry is not worth a log line
  if (!closedBeforeBack && o.failures < 2 && ms < 5000) return;
  const [message, category]: [string, Category] =
    o.kind === 'down'
      ? ['Máy chủ API không phản hồi (proxy báo lỗi 502/503/504)', 'config']
      : o.offline
        ? ['Thiết bị mất mạng', 'network']
        : o.kind === 'timeout'
          ? ['Máy chủ phản hồi quá chậm (quá 15 giây)', 'network']
          : ['Không kết nối được tới máy chủ (mạng chập chờn, proxy hoặc tường lửa chặn)', 'network'];
  const detail = [
    `gián đoạn ${fmtDuration(ms)}${closedBeforeBack ? ' (đóng trang khi chưa có mạng lại)' : ''}`,
    `${o.failures} yêu cầu lỗi`,
    `đầu tiên: ${o.first}`,
    o.status ? `HTTP ${o.status}` : '',
    o.offline ? 'trình duyệt báo mất mạng' : 'trình duyệt vẫn báo có mạng',
    o.net ? `mạng ${o.net}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  if (made >= MAX_PER_VISIT) return;
  made++;
  enqueue({ message, category, detail, url: o.url, release: typeof __BUILD__ === 'string' ? __BUILD__ : 'dev', at: o.start });
};

const netObserver = {
  fail(f: NetFailure) {
    const now = Date.now();
    if (!outage) {
      outage = { start: now, last: now, kind: f.kind, failures: 0, first: `${f.method} /api${f.path}`.slice(0, 120), offline: false, net: netType(), url: here() };
    }
    outage.failures++;
    outage.last = now;
    if (!navigator.onLine) outage.offline = true;
    if (f.kind === 'down') {
      outage.kind = 'down';
      outage.status = f.status;
    }
    save(OUTAGE_KEY, outage); // survives closing the page while offline
    if (!probeTimer) probeTimer = window.setInterval(probe, 30_000);
  },
  ok() {
    window.clearInterval(probeTimer);
    probeTimer = 0;
    if (outage) {
      const o = outage;
      outage = null;
      save(OUTAGE_KEY, null);
      endOutage(o, false);
    }
    if (queue.length) flush();
  },
};

// ---- files that failed to load ------------------------------------------

/** An image/script/game asset failed: ask the server whether the file exists to tell "missing" from "network". */
export const reportFailedFile = (src: string): void => {
  if (!installed || !src || src.startsWith('data:') || src.startsWith('blob:')) return;
  const u = new URL(src, location.href);
  const path = u.origin === location.origin ? u.pathname : u.href;
  if (!navigator.onLine) {
    reportError(`Không tải được file (thiết bị mất mạng): ${path}`, undefined, 'network');
    return;
  }
  fetch(u.href, { method: 'HEAD', cache: 'no-store' })
    .then((res) => {
      const type = res.headers.get('content-type') ?? '';
      if (res.status === 404 || res.status === 403 || res.status === 410 || (res.ok && type.includes('text/html') && !/\.html?$/.test(u.pathname))) {
        reportError(`Thiếu file trên máy chủ: ${path}`, undefined, 'config', `HTTP ${res.status}`);
      } else if (!res.ok) {
        reportError(`Máy chủ lỗi khi trả file: ${path}`, undefined, 'config', `HTTP ${res.status}`);
      } else {
        reportError(`Tải file bị gián đoạn: ${path}`, undefined, 'network', 'thử lại thì file vẫn có trên máy chủ');
      }
    })
    .catch(() => reportError(`Không tải được file do mạng: ${path}`, undefined, 'network'));
};

// ---- install ------------------------------------------------------------

/** Install global handlers (call once, first thing in main). */
export const installErrorReporting = (): void => {
  if (installed) return;
  installed = true;
  queue = load<ClientErrorReport[]>(QUEUE_KEY) ?? [];
  // an outage still open when the last visit ended
  const previous = load<Outage>(OUTAGE_KEY);
  save(OUTAGE_KEY, null);
  if (previous) endOutage(previous, true);
  setNetObserver(netObserver);

  window.addEventListener(
    'error',
    (e) => {
      // resource load errors (img/script/link) have no `error`
      if (!e.error && e.target && e.target !== window) {
        const el = e.target as HTMLImageElement & HTMLLinkElement;
        reportFailedFile(el.src || el.href || '');
        return;
      }
      reportError(e.message || String(e.error), (e.error as Error | undefined)?.stack);
    },
    true,
  );
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason as Error | undefined;
    // API errors are shown to the player; outages are logged by the observer above
    if (r instanceof ApiError) return;
    reportError(r?.message ?? String(e.reason), r?.stack);
  });
  window.addEventListener('online', () => (outage ? probe() : flush()));
  window.addEventListener('pagehide', () => flush(true));
  if (queue.length) schedule(3000);
};
