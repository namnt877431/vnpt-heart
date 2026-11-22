import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../client/src/data/content';
import { rollMystery } from '../../shared/mystery';
import { isLevelUnlocked } from '../../shared/progress-rules';
import { expectedTotal, invalidResult, pointsFor, starsFor } from '../../shared/scoring';
import { browserLabel } from '../../shared/user-agent';
import { classifyServerError } from '../src/services/errors';
import { parseSpec } from '../src/services/spec-schema';
import { startOfMonth, startOfWeek } from '../src/services/time';

describe('scoring', () => {
  it('gives stars per the script', () => {
    const r = (correct: number, timeMs = 10_000) => ({ correct, total: 10, timeMs, notes: [] });
    expect(starsFor(r(10), 60)).toBe(3);
    expect(starsFor(r(10, 90_000), 60)).toBe(2);
    expect(starsFor(r(8))).toBe(2);
    expect(starsFor(r(5))).toBe(1);
    expect(starsFor(r(4))).toBe(0);
    expect(pointsFor(r(10), 3, 60, true)).toBe(2 * (100 + 60 + 30 + 30));
  });

  it('rejects impossible results', () => {
    const spec = parseSpec({ type: 'choice', title: 'T', intro: '', questions: [{ text: 'Q', options: ['a', 'b'], correct: 0, explain: '' }] });
    expect(invalidResult(spec, { correct: 1, total: 1, timeMs: 5000 })).toBeNull();
    expect(invalidResult(spec, { correct: 2, total: 1, timeMs: 5000 })).not.toBeNull();
    expect(invalidResult(spec, { correct: 1, total: 1, timeMs: 200 })).not.toBeNull();
  });
});

describe('every sample level', () => {
  const all = CHAPTERS.flatMap((c) => c.levels).filter((l) => l.spec);

  it('passes the admin validation schema', () => {
    for (const l of all) expect(() => parseSpec(l.spec), l.id).not.toThrow();
  });

  it('has a positive expected total', () => {
    for (const l of all) expect(expectedTotal(l.spec!), l.id).toBeGreaterThan(0);
  });
});

describe('unlock rules', () => {
  it('opens levels one by one and chapters in order', () => {
    const [c1, c2] = CHAPTERS;
    expect(isLevelUnlocked(CHAPTERS, {}, c1, 0, false)).toBe(true);
    expect(isLevelUnlocked(CHAPTERS, {}, c1, 1, false)).toBe(false);
    expect(isLevelUnlocked(CHAPTERS, { [c1.levels[0].id]: { stars: 1 } }, c1, 1, false)).toBe(true);
    expect(isLevelUnlocked(CHAPTERS, {}, c2, 0, false)).toBe(false);
    expect(isLevelUnlocked(CHAPTERS, {}, c2, 0, true)).toBe(true);
  });
});

describe('mystery', () => {
  it('always yields a playable or instant outcome', () => {
    for (let i = 0; i < 200; i++) {
      const o = rollMystery(CHAPTERS);
      if (o.spec) expect(expectedTotal(o.spec)).toBeGreaterThan(0);
      else expect(['gift', 'double']).toContain(o.id);
    }
  });
});

describe('periods (Vietnam time)', () => {
  it('starts weeks on Monday 00:00 UTC+7', () => {
    // Sunday 2026-11-22 23:30 in Vietnam = 16:30 UTC
    const now = new Date('2026-11-22T16:30:00Z');
    expect(startOfWeek(now).toISOString()).toBe('2026-11-15T17:00:00.000Z');
    // Monday 2026-11-23 00:30 in Vietnam
    expect(startOfWeek(new Date('2026-11-22T17:30:00Z')).toISOString()).toBe('2026-11-22T17:00:00.000Z');
    expect(startOfMonth(now).toISOString()).toBe('2026-10-31T17:00:00.000Z');
  });
});

describe('error log', () => {
  it('tells set-up problems from code bugs', () => {
    const refused = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), { code: 'ECONNREFUSED' });
    expect(classifyServerError(refused)).toMatchObject({ category: 'config', detail: 'mã ECONNREFUSED' });
    expect(classifyServerError(Object.assign(new Error('password authentication failed for user "vh"'), { code: '28P01' })).category).toBe('config');
    const wrapped = new Error('Failed query', { cause: Object.assign(new Error('getaddrinfo ENOTFOUND db'), { code: 'ENOTFOUND' }) });
    expect(classifyServerError(wrapped).category).toBe('config');
    expect(classifyServerError(wrapped).detail).toContain('getaddrinfo ENOTFOUND db');
    expect(classifyServerError(new TypeError("Cannot read properties of undefined (reading 'x')")).category).toBe('server');
  });

  it('names browsers', () => {
    expect(browserLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0')).toBe('Edge 131 · Windows');
    expect(browserLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')).toBe('Safari 17.5 · iOS');
    expect(browserLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/124.0.0 Chrome/118.0.0.0 Safari/537.36')).toBe('Cốc Cốc 124 · Windows');
  });
});
