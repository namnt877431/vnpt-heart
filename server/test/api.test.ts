import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { AdminErrorEvent, AdminErrorList, ContentResponse, PlayResponse, ProgressResponse } from '../../shared/api-types';
import { expectedTotal } from '../../shared/scoring';
import type { ChoiceSpec } from '../../shared/game-types';
import { buildApp } from '../src/app';
import { config } from '../src/config';
import { openDb, type DbHandle } from '../src/db/client';
import { DEV_PASSWORD, seed } from '../src/db/seed';

let handle: DbHandle;
let app: FastifyInstance;

const sessions = new Map<string, { cookie: string }>();
const login = async (username: string) => {
  const cached = sessions.get(username);
  if (cached) return cached;
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username, password: DEV_PASSWORD } });
  expect(res.statusCode).toBe(200);
  const cookie = res.cookies.find((c) => c.name === 'vh_session')!;
  const who = { cookie: `vh_session=${cookie.value}` };
  sessions.set(username, who);
  return who;
};

const get = (url: string, headers: { cookie: string }) => app.inject({ method: 'GET', url, headers });
const post = (url: string, headers: { cookie: string }, payload?: object) => app.inject({ method: 'POST', url, headers, payload: payload ?? {} });

const choiceLevel = async (who: { cookie: string }, levelId: string) => {
  const content = (await get('/api/content', who)).json<ContentResponse>();
  return content.chapters.flatMap((c) => c.levels).find((l) => l.id === levelId)!.spec as ChoiceSpec;
};

beforeAll(async () => {
  handle = await openDb('pglite://memory', './drizzle');
  await seed(handle.db, { devUsers: true });
  app = await buildApp({ config: { ...config, authProvider: 'dev', uploadDir: './.data/test-uploads', clientDist: '' }, db: handle.db, logger: false });
}, 60_000);

afterAll(async () => {
  await app?.close();
  await handle?.close();
});

describe('auth', () => {
  it('rejects a wrong password and requires login', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'lan', password: 'sai' } });
    expect(res.statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/api/me' })).statusCode).toBe(401);
  });

  it('returns the profile after login', async () => {
    const me = (await get('/api/me', await login('lan'))).json();
    expect(me).toMatchObject({ username: 'lan', name: 'Nguyễn Thị Lan', role: 'player', groupId: 'g-kd', groupName: 'Nhóm Kinh doanh' });
  });
});

describe('player flow', () => {
  it('serves the seeded content', async () => {
    const content = (await get('/api/content', await login('lan'))).json<ContentResponse>();
    expect(content.chapters).toHaveLength(6);
    expect(content.chapters[0].levels[0].id).toBe('van-hoa-1');
  });

  it('grades a play on the server and keeps the best score', async () => {
    const lan = await login('lan');
    const spec = await choiceLevel(lan, 'van-hoa-1');
    const total = expectedTotal(spec);
    const res = await post('/api/plays', lan, { levelId: 'van-hoa-1', correct: total, total, timeMs: 20_000 });
    expect(res.statusCode).toBe(200);
    const body = res.json<PlayResponse>();
    expect(body.stars).toBe(3);
    expect(body.gained).toBe(body.points);

    const worse = (await post('/api/plays', lan, { levelId: 'van-hoa-1', correct: 1, total, timeMs: 30_000 })).json<PlayResponse>();
    expect(worse.gained).toBe(0);
    expect(worse.record).toMatchObject({ stars: 3, bestPoints: body.points, plays: 2 });

    const progress = (await get('/api/progress', lan)).json<ProgressResponse>();
    expect(progress.levels['van-hoa-1'].stars).toBe(3);
    expect(progress.mission.progress).toBe(1);
  });

  it('saves a result once when it is re-sent (network retry)', async () => {
    const mai = await login('mai');
    const spec = await choiceLevel(mai, 'van-hoa-1');
    const total = expectedTotal(spec);
    const body = { levelId: 'van-hoa-1', correct: total, total, timeMs: 20_000, clientId: 'retry-test-0001' };
    // original + retry racing it + a later retry
    const [a, b] = await Promise.all([post('/api/plays', mai, body), post('/api/plays', mai, body)]);
    const c = await post('/api/plays', mai, body);
    for (const r of [a, b, c]) expect(r.statusCode).toBe(200);
    expect(c.json<PlayResponse>().points).toBe(a.json<PlayResponse>().points);
    const progress = (await get('/api/progress', mai)).json<ProgressResponse>();
    expect(progress.levels['van-hoa-1'].plays).toBe(1);
  });

  it('logs browser errors grouped, with every occurrence and its account', async () => {
    const report = { errors: [{ message: 'TypeError: x is undefined at 12', stack: 'at f (index-AbC12345.js:1:2)', url: '/#home', release: 't1' }] };
    const ua = { 'user-agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36' };
    expect((await app.inject({ method: 'POST', url: '/api/client-errors', payload: report, headers: { ...ua, ...(await login('hoang')) } })).statusCode).toBe(200);
    // same error, other line number / build hash, other account -> same row, count 2
    const again = { errors: [{ ...report.errors[0], message: 'TypeError: x is undefined at 99', stack: 'at f (index-ZzZ99999.js:7:8)' }] };
    await app.inject({ method: 'POST', url: '/api/client-errors', payload: again, headers: await login('anh') });
    const btc = await login('btc');
    const { reports } = (await get('/api/admin/errors', btc)).json<AdminErrorList>();
    const row = reports.find((e) => e.message.startsWith('TypeError: x is undefined'))!;
    expect(row).toMatchObject({ source: 'client', category: 'browser', count: 2, users: 2 });
    expect(row.browsers.map((b) => b.label)).toContain('Chrome 131 · Android');

    const events = (await get(`/api/admin/errors/${row.id}/events`, btc)).json<AdminErrorEvent[]>();
    expect(events.map((e) => e.user?.username).sort()).toEqual(['anh', 'hoang']);
    // account filter, on the list and on the occurrences
    const forHoang = (await get('/api/admin/errors?q=hoang', btc)).json<AdminErrorList>();
    expect(forHoang.reports.map((r) => r.id)).toContain(row.id);
    expect((await get('/api/admin/errors?q=khong-co-ai', btc)).json<AdminErrorList>().reports).toHaveLength(0);
    expect((await get(`/api/admin/errors/${row.id}/events?q=hoang`, btc)).json<AdminErrorEvent[]>()).toHaveLength(1);

    expect((await app.inject({ method: 'DELETE', url: `/api/admin/errors/${row.id}`, headers: btc })).statusCode).toBe(200);
    expect((await get(`/api/admin/errors/${row.id}/events`, btc)).json<AdminErrorEvent[]>()).toHaveLength(0);
  });

  it('keeps the category, details and time of network reports sent later', async () => {
    const at = Date.now() - 10 * 60_000;
    const report = { errors: [{ message: 'Thiết bị mất mạng', category: 'network', detail: 'gián đoạn 35 giây · 3 yêu cầu lỗi', at }] };
    await app.inject({ method: 'POST', url: '/api/client-errors', payload: report, headers: await login('mai') });
    const btc = await login('btc');
    const list = (await get('/api/admin/errors?category=network', btc)).json<AdminErrorList>();
    expect(list.reports.every((r) => r.category === 'network')).toBe(true);
    expect(list.counts.network).toBeGreaterThan(0);
    const row = list.reports.find((r) => r.message === 'Thiết bị mất mạng')!;
    const [ev] = (await get(`/api/admin/errors/${row.id}/events`, btc)).json<AdminErrorEvent[]>();
    expect(ev).toMatchObject({ detail: 'gián đoạn 35 giây · 3 yêu cầu lỗi', user: { username: 'mai' } });
    expect(new Date(ev.at).getTime()).toBe(at);
    // the browser cannot claim a server error
    const bad = { errors: [{ message: 'x', category: 'server' }] };
    expect((await app.inject({ method: 'POST', url: '/api/client-errors', payload: bad })).statusCode).toBe(400);
  });

  it('logs an unreachable login server as a set-up problem', async () => {
    const down = Object.assign(new Error('connect ECONNREFUSED 10.0.0.5:636'), { code: 'ECONNREFUSED' });
    const ldapApp = await buildApp({
      config: { ...config, uploadDir: './.data/test-uploads', clientDist: '' },
      db: handle.db,
      logger: false,
      provider: { name: 'ldap', authenticate: async () => Promise.reject(down) },
    });
    const res = await ldapApp.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'Lan', password: 'x' } });
    await ldapApp.close();
    expect(res.statusCode).toBe(503);
    const { reports } = (await get('/api/admin/errors?category=config', await login('btc'))).json<AdminErrorList>();
    const row = reports.find((r) => r.message.startsWith('Không đăng nhập được qua LDAP'))!;
    expect(row).toMatchObject({ source: 'server', category: 'config' });
    const [ev] = (await get(`/api/admin/errors/${row.id}/events`, await login('btc'))).json<AdminErrorEvent[]>();
    expect(ev.detail).toContain('lan');
    expect(ev.detail).toContain('ECONNREFUSED');
  });

  it('rejects impossible results', async () => {
    const lan = await login('lan');
    const spec = await choiceLevel(lan, 'van-hoa-1');
    const total = expectedTotal(spec);
    const tooFast = await post('/api/plays', lan, { levelId: 'van-hoa-1', correct: total, total, timeMs: 100 });
    expect(tooFast.statusCode).toBe(422);
    const wrongTotal = await post('/api/plays', lan, { levelId: 'van-hoa-1', correct: 50, total: 50, timeMs: 60_000 });
    expect(wrongTotal.statusCode).toBe(422);
  });

  it('refuses locked levels', async () => {
    const dung = await login('dung');
    const res = await post('/api/plays', dung, { levelId: 'van-hoa-3', correct: 1, total: 1, timeMs: 10_000 });
    expect(res.statusCode).toBe(403);
  });

  it('ranks players by points of the period', async () => {
    const lb = (await get('/api/leaderboard?period=week', await login('dung'))).json();
    expect(lb.entries[0].name).toBe('Nguyễn Thị Lan');
    expect(lb.me).toBeNull();
    const groups = (await get('/api/groups/ranking', await login('dung'))).json();
    expect(groups.groups.find((g: { groupId: string }) => g.groupId === 'g-kd').avgScore).toBeGreaterThan(0);
    expect(groups.groups.find((g: { groupId: string }) => g.groupId === 'g-kt').avgScore).toBe(0);
    const mine = (await get('/api/groups/mine', await login('lan'))).json();
    expect(mine.group.roster[0].name).toBe('Nguyễn Thị Lan');
  });

  it('rolls mystery levels on the server', async () => {
    const admin = await login('admin');
    await app.inject({ method: 'PUT', url: '/api/admin/settings', headers: admin, payload: { unlockAllChapters: true, bonusCapPerDay: 100, groupWeights: { avg: 1, participation: 0, bonus: 1 } } });
    const hoang = await login('hoang');
    const content = (await get('/api/content', hoang)).json<ContentResponse>();
    const mystery = content.chapters[0].levels.find((l) => l.kind === 'mystery')!;
    // levels before it must be passed first
    expect((await post(`/api/mystery/${mystery.id}`, hoang)).statusCode).toBe(403);
    // a result for a mystery level without flipping a card is refused
    expect((await post('/api/plays', hoang, { levelId: mystery.id, correct: 1, total: 1, timeMs: 9000 })).statusCode).toBe(403);
  });
});

describe('admin', () => {
  it('forbids players', async () => {
    expect((await get('/api/admin/content', await login('lan'))).statusCode).toBe(403);
  });

  it('creates, validates, publishes and schedules levels', async () => {
    const btc = await login('btc');
    const bad = await post('/api/admin/levels', btc, { chapterId: 'van-hoa', kind: 'normal', spec: { type: 'choice', title: 'X', intro: '', questions: [] } });
    expect(bad.statusCode).toBe(400);

    const spec = {
      type: 'choice',
      title: 'Level mới',
      intro: 'Thử nhé',
      questions: [{ text: 'Câu hỏi?', options: ['A', 'B'], correct: 1, explain: 'Vì B' }],
    };
    const created = await post('/api/admin/levels', btc, { chapterId: 'van-hoa', kind: 'normal', spec });
    expect(created.statusCode).toBe(200);
    const level = created.json();
    expect(level).toMatchObject({ id: 'van-hoa-7', status: 'draft', locked: false });

    const lan = await login('lan');
    const ids = () => get('/api/content', lan).then((r) => r.json<ContentResponse>().chapters[0].levels.map((l) => l.id));
    expect(await ids()).not.toContain('van-hoa-7');

    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect((await post('/api/admin/levels/van-hoa-7/publish', btc, { publishAt: future })).json()).toMatchObject({ status: 'published', locked: true });
    expect(await ids()).not.toContain('van-hoa-7');

    await post('/api/admin/levels/van-hoa-7/publish', btc, { publishAt: null });
    expect(await ids()).toContain('van-hoa-7');

    const edited = await app.inject({ method: 'PUT', url: '/api/admin/levels/van-hoa-7', headers: btc, payload: { chapterId: 'van-hoa', kind: 'normal', spec: { ...spec, title: 'Đã sửa' } } });
    expect(edited.json().title).toBe('Đã sửa');
    const revisions = (await get('/api/admin/levels/van-hoa-7/revisions', btc)).json();
    expect(revisions.length).toBeGreaterThanOrEqual(3);
    const restored = await post(`/api/admin/levels/van-hoa-7/revisions/${revisions[0].id}/restore`, btc);
    expect(restored.json().title).toBe('Level mới');

    // published levels are archived, not deleted (players may have progress)
    const del = await app.inject({ method: 'DELETE', url: '/api/admin/levels/van-hoa-7', headers: btc });
    expect(del.json()).toEqual({ archived: true });
  });

  it('imports users and reports stats', async () => {
    const admin = await login('admin');
    const res = await post('/api/admin/users/import', admin, { csv: 'username,họ tên,nhóm\nnv001,Trần Văn A,Nhóm Kỹ thuật\nnv002,Lê Thị B,Nhóm Mới' });
    expect(res.json()).toEqual({ created: 2, updated: 0, newGroups: 1 });
    const stats = (await get('/api/admin/stats', admin)).json();
    expect(stats.activeWeek).toBeGreaterThanOrEqual(1);
    expect(stats.daily.length).toBeGreaterThanOrEqual(1);
    const audit = (await get('/api/admin/audit', admin)).json();
    expect(audit.some((a: { action: string }) => a.action === 'import')).toBe(true);
  });

  it('answers every admin list endpoint', async () => {
    const admin = await login('admin');
    for (const url of ['/api/admin/content', '/api/admin/users', '/api/admin/groups', '/api/admin/stories', '/api/admin/seasons', '/api/admin/badges', '/api/admin/settings', '/api/admin/uploads']) {
      const res = await get(url, admin);
      expect(res.statusCode, url).toBe(200);
    }
    const groups = (await get('/api/admin/groups', admin)).json();
    expect(groups.find((g: { id: string }) => g.id === 'g-kd').members).toBeGreaterThanOrEqual(1);
    const awarded = await post('/api/admin/badges/b1/award', admin, { usernames: ['lan', 'khongco'] });
    expect(awarded.json()).toEqual({ awarded: 1, missing: ['khongco'] });
    expect((await get('/api/badges/mine', await login('lan'))).json().badges.find((b: { id: string }) => b.id === 'b1').earned).toBe(true);
  });

  it('only admins change roles', async () => {
    const btc = await login('btc');
    const users = (await get('/api/admin/users?q=lan', btc)).json();
    const res = await app.inject({ method: 'PATCH', url: `/api/admin/users/${users[0].id}`, headers: btc, payload: { role: 'admin' } });
    expect(res.statusCode).toBe(403);
  });
});
