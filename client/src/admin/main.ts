import '../styles/fonts.css';
import '../styles/tokens.css';
import '../styles/components.css';
import '../styles/admin.css';
import type { MeResponse } from '../../../shared/api-types';
import { installErrorReporting } from '../core/error-report';
import { ApiError, apiGet, apiPost, setUnauthorizedHandler } from '../data/api';
import { esc } from '../ui/dom';
import { icon } from '../ui/icons';
import { closeGate, showGateMessage, showLogin } from '../ui/login';
import type { AdminCtx, AdminView } from './ui';
import { contentView } from './views/content';
import { levelView } from './views/level';
import { errorsView } from './views/errors';
import { auditView, seasonsView, settingsView, statsView } from './views/ops';
import { peopleView } from './views/people';
import { storiesView } from './views/stories';

/**
 * Admin page (admin.html) for BTC editors and admins. Hash routes:
 *   #/content  #/level/<id|new>  #/stories  #/people  #/seasons  #/stats  #/audit  #/settings
 */

const NAV: { route: string; label: string; icon: string; adminOnly?: boolean }[] = [
  { route: 'content', label: 'Nội dung', icon: 'map' },
  { route: 'stories', label: 'Tình huống', icon: 'chat' },
  { route: 'people', label: 'Người chơi & nhóm', icon: 'users' },
  { route: 'seasons', label: 'Mùa & huy hiệu', icon: 'medal' },
  { route: 'stats', label: 'Thống kê', icon: 'chart' },
  { route: 'errors', label: 'Lỗi hệ thống', icon: 'bolt' },
  { route: 'audit', label: 'Nhật ký', icon: 'list', adminOnly: true },
  { route: 'settings', label: 'Cấu hình', icon: 'gear' },
];

const VIEWS: Record<string, AdminView> = {
  content: contentView,
  level: levelView,
  stories: storiesView,
  people: peopleView,
  seasons: seasonsView,
  stats: statsView,
  audit: auditView,
  errors: errorsView,
  settings: settingsView,
};

installErrorReporting();

const boot = async () => {
  setUnauthorizedHandler(() => location.reload());
  const me =
    (await apiGet<MeResponse>('/me').catch((e) => {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    })) ?? (await showLogin());

  if (me.role === 'player') {
    showGateMessage('Không có quyền truy cập', 'Trang quản trị chỉ dành cho Ban tổ chức. Liên hệ quản trị viên nếu bạn cần quyền soạn nội dung.');
    return;
  }
  closeGate();

  const app = document.getElementById('admin')!;
  app.innerHTML = `
    <aside class="adm-nav">
      <a class="adm-brand" href="#/content"><span class="brand__mark">${icon('heart', 18)}</span><span><b>VNPT HEART</b><small>Quản trị nội dung</small></span></a>
      <nav>${NAV.filter((n) => !n.adminOnly || me.role === 'admin')
        .map((n) => `<a href="#/${n.route}" data-route="${n.route}">${icon(n.icon, 18)}<span>${esc(n.label)}</span></a>`)
        .join('')}</nav>
      <div class="adm-nav__foot">
        <a href="index.html" target="_blank" rel="noopener">${icon('gamepad', 16)} Mở game</a>
        <div class="adm-user"><b>${esc(me.name)}</b><small>${me.role === 'admin' ? 'Quản trị' : 'Ban tổ chức'}</small></div>
        <button class="btn btn--ghost btn--sm" data-logout>${icon('logout', 14)} Đăng xuất</button>
      </div>
    </aside>
    <main class="adm-main" id="adm-view"></main>`;

  app.querySelector('[data-logout]')!.addEventListener('click', async () => {
    await apiPost('/auth/logout').catch(() => undefined);
    location.reload();
  });

  const view = document.getElementById('adm-view')!;
  const ctx: AdminCtx = { role: me.role, go: (hash) => (location.hash = hash) };
  let cleanup: (() => void) | null = null;

  const route = () => {
    const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
    const [name = 'content', id] = path.split('/');
    const viewFn = VIEWS[name] ?? contentView;
    cleanup?.();
    window.scrollTo({ top: 0 });
    const params = Object.assign(new URLSearchParams(query), { id });
    cleanup = viewFn(view, ctx, params);
    app.querySelectorAll<HTMLElement>('[data-route]').forEach((a) => a.classList.toggle('is-active', a.dataset.route === (name === 'level' ? 'content' : name)));
  };
  window.addEventListener('hashchange', route);
  route();
};

boot().catch((e: Error) => showGateMessage('Không kết nối được máy chủ', `${e.message}. Kiểm tra mạng rồi tải lại trang.`));
