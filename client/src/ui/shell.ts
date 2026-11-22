import { bus } from '../core/events';
import type { ScreenId } from '../core/screens';
import { me, myRole } from '../data/player';
import { avatar } from './components/avatar';
import { API_MODE, apiPost } from '../data/api';
import { openModal, toast } from './components/overlay';
import { $$, esc, onAction } from './dom';
import { icon } from './icons';
import type { Router } from './router';

/** Top navigation. `screen` is the router target; order = display order. */
const NAV: { screen: ScreenId; label: string; icon: string }[] = [
  { screen: 'home', label: 'Trang chủ', icon: 'home' },
  { screen: 'games', label: 'Chơi game', icon: 'gamepad' },
  { screen: 'leaderboard', label: 'BXH', icon: 'trophy' },
  { screen: 'badges', label: 'Huy hiệu', icon: 'medal' },
  { screen: 'group', label: 'Nhóm', icon: 'users' },
];

/**
 * Persistent chrome around every screen: top bar, the screen container and
 * the modal/toast roots. Returns the element screens are rendered into.
 */
export const mountShell = (ui: HTMLElement): HTMLElement => {
  ui.innerHTML = `
    <header class="topbar">
      <a class="brand" data-action="nav" data-screen="home" href="#">
        <span class="brand__mark">${icon('heart', 22)}</span>
        <span class="brand__text">
          <strong>VNPT ĐẮK LẮK</strong>
          <em>Kết nối giá trị · Lan tỏa văn hóa</em>
        </span>
      </a>
      <nav class="nav" aria-label="Điều hướng chính">
        ${NAV.map((n) => `
          <button class="nav__item" data-action="nav" data-screen="${n.screen}">
            ${icon(n.icon, 26)}<span>${esc(n.label)}</span>
          </button>`).join('')}
      </nav>
      <div class="topbar__right">
        <button class="bell" data-action="bell" aria-label="Thông báo">
          ${icon('bell', 24)}<span class="bell__count">3</span>
        </button>
        <button class="user-chip" data-action="user">
          ${avatar(me.name, 40)}
          <span class="user-chip__text"><strong>${esc(me.name)}</strong><small>${esc(me.role)}</small></span>
          ${icon('chevronDown', 18)}
        </button>
      </div>
    </header>
    <main id="screen-root" class="screen-root"></main>
    <div id="modal-root"></div>
    <div id="toast-root" class="toast-root"></div>
    <div class="net-pill" data-net hidden></div>
  `;
  return ui.querySelector<HTMLElement>('#screen-root')!;
};

/** API mode: account box with logout (and the admin page for BTC/admins). */
const openAccountMenu = () =>
  openModal(
    `<div class="account">
      <p><strong>${esc(me.name)}</strong><br/><small>${esc(me.role)}</small></p>
      <div class="account__actions">
        ${myRole !== 'player' ? `<a class="btn btn--blue btn--sm" href="admin.html" target="_blank" rel="noopener">${icon('gear', 16)} Trang quản trị</a>` : ''}
        <button class="btn btn--ghost btn--sm" data-logout>${icon('logout', 16)} Đăng xuất</button>
      </div>
    </div>`,
    {
      title: 'TÀI KHOẢN',
      onMount: (el) =>
        el.querySelector('[data-logout]')?.addEventListener('click', async () => {
          await apiPost('/auth/logout').catch(() => undefined);
          location.reload();
        }),
    },
  );

/** Wire nav clicks and keep the active tab highlighted. */
export const bindShell = (ui: HTMLElement, router: Router): void => {
  const topbar = ui.querySelector<HTMLElement>('.topbar')!;
  onAction(topbar, {
    nav: (el, ev) => {
      ev.preventDefault();
      router.go(el.dataset.screen as ScreenId);
    },
    bell: () => toast('Bạn có 3 thông báo mới', 'bell'),
    user: () => (API_MODE ? openAccountMenu() : toast('Hồ sơ cá nhân: sẽ có ở phiên bản sau', 'users')),
  });

  // results the server refused / could not save (API mode)
  bus.on('progress:error', ({ message }) => toast(message, 'x'));

  // connection pill: offline / results waiting to be re-sent
  const pill = ui.querySelector<HTMLElement>('[data-net]')!;
  let lastPending = 0;
  bus.on('net:status', ({ online, pending }) => {
    pill.hidden = online && pending === 0;
    pill.classList.toggle('is-offline', !online);
    pill.innerHTML = online
      ? `${icon('arrowUp', 16)} Đang gửi lại ${pending} kết quả…`
      : `${icon('wind', 16)} Mất kết nối${pending ? ` · ${pending} kết quả sẽ tự gửi khi có mạng` : ''}`;
    if (online && pending === 0 && lastPending > 0) toast('Đã gửi xong các kết quả chờ', 'check');
    lastPending = pending;
  });

  // chapter/level screens belong to the "Trang chủ" journey; highlight it there
  const navFor = (id: ScreenId): ScreenId => (id === 'chapter' || id === 'level' || id === 'share' ? 'home' : id);
  bus.on('screen:changed', ({ id }) => {
    $$(topbar, '.nav__item').forEach((b) => b.classList.toggle('is-active', b.dataset.screen === navFor(id)));
  });
};
