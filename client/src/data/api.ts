/**
 * HTTP client for server/ (only used when built with VITE_BACKEND=api;
 * the GitHub Pages demo never calls it).
 *
 * Network hardening: every request times out (no endless spinner on a dead
 * connection); reads are retried once on network/5xx errors. Writes are not
 * retried here — results go through the outbox in core/progress.ts instead.
 */

/** true = real backend (login, server progress); false = offline demo with mock data. */
export const API_MODE = import.meta.env.VITE_BACKEND === 'api';

const BASE = `${import.meta.env.VITE_API_BASE ?? ''}/api`;
const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  /** HTTP status; 0 = no answer (offline, timeout, server down). */
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** No answer or a server-side failure: worth trying again later. */
export const isRetryable = (e: unknown): boolean => e instanceof ApiError && (e.status === 0 || e.status >= 500);

/** A request that got no usable answer: kind of failure, for the error log. */
export interface NetFailure {
  kind: 'timeout' | 'unreachable' | 'down';
  method: string;
  path: string;
  status?: number;
}
export interface NetObserver {
  fail(f: NetFailure): void;
  ok(): void;
}
let netObserver: NetObserver | null = null;
/** core/error-report.ts watches requests to log network outages (when they end). */
export const setNetObserver = (o: NetObserver) => (netObserver = o);

let onUnauthorized: (() => void) | null = null;
/** Called when a request answers 401 (session expired) — main.ts reloads to the login screen. */
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn);

const once = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch {
    netObserver?.fail({ kind: ctrl.signal.aborted ? 'timeout' : 'unreachable', method, path });
    throw new ApiError(0, ctrl.signal.aborted ? 'Máy chủ phản hồi quá lâu' : 'Mất kết nối mạng');
  } finally {
    window.clearTimeout(timer);
  }
  // 502/503/504 come from the proxy: the API service itself is not answering
  if (res.status >= 502 && res.status <= 504) netObserver?.fail({ kind: 'down', method, path, status: res.status });
  else netObserver?.ok();
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.status === 401 && !path.startsWith('/auth/') && path !== '/me') onUnauthorized?.();
    throw new ApiError(res.status, data.error ?? `Lỗi kết nối máy chủ (${res.status})`);
  }
  return (await res.json()) as T;
};

export const api = async <T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> => {
  try {
    return await once<T>(method, path, body);
  } catch (e) {
    if (method !== 'GET' || !isRetryable(e)) throw e;
    await new Promise((r) => setTimeout(r, 800));
    return once<T>(method, path, body);
  }
};

export const apiGet = <T>(path: string) => api<T>('GET', path);
export const apiPost = <T>(path: string, body: unknown = {}) => api<T>('POST', path, body);
