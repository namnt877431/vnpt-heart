import type { MeResponse } from '../../../shared/api-types';
import { apiPost } from '../data/api';
import { $, esc } from './dom';
import { icon } from './icons';

/**
 * Full-screen gate shown before the game boots (API mode): the login form, or
 * a message (no content yet, server unreachable). Lives outside #ui, which
 * stays hidden until the game is ready.
 */
const gate = (): HTMLElement => {
  let el = document.getElementById('gate');
  if (!el) {
    el = document.createElement('div');
    el.id = 'gate';
    el.className = 'login-gate';
    document.body.append(el);
  }
  return el;
};

const brand = `
  <div class="login-gate__brand">
    <span class="brand__mark">${icon('heart', 26)}</span>
    <h1 class="game-logo login-gate__logo">VNPT <span>HEART</span></h1>
    <p>Hành trình văn hóa VNPT Đắk Lắk</p>
  </div>`;

/** Ask for credentials until the server accepts them. */
export const showLogin = (): Promise<MeResponse> =>
  new Promise((resolve) => {
    const el = gate();
    el.innerHTML = `
      <form class="panel login-gate__card" data-login novalidate>
        ${brand}
        <label class="field"><span>Tên đăng nhập</span>
          <input name="username" autocomplete="username" required autofocus placeholder="Tài khoản email / mã nhân viên" />
        </label>
        <label class="field"><span>Mật khẩu</span>
          <input name="password" type="password" autocomplete="current-password" required />
        </label>
        <p class="login-gate__error" data-error hidden></p>
        <button class="btn btn--gold btn--block" type="submit">${icon('unlock', 20)} Đăng nhập</button>
        <small class="login-gate__hint">Dùng tài khoản nội bộ VNPT. Quên mật khẩu: liên hệ bộ phận CNTT.</small>
      </form>`;
    const form = $<HTMLFormElement>(el, '[data-login]');
    const error = $(el, '[data-error]');
    const submit = $<HTMLButtonElement>(el, '[type="submit"]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const username = String(fd.get('username') ?? '').trim();
      const password = String(fd.get('password') ?? '');
      if (!username || !password) {
        error.hidden = false;
        error.textContent = 'Nhập tên đăng nhập và mật khẩu.';
        return;
      }
      submit.disabled = true;
      error.hidden = true;
      try {
        const me = await apiPost<MeResponse>('/auth/login', { username, password });
        resolve(me);
      } catch (err) {
        error.hidden = false;
        error.textContent = (err as Error).message;
        form.querySelector<HTMLInputElement>('[name="password"]')!.value = '';
      } finally {
        submit.disabled = false;
      }
    });
  });

/** A message instead of the game (e.g. no published content yet). */
export const showGateMessage = (title: string, text: string): void => {
  gate().innerHTML = `
    <div class="panel login-gate__card">
      ${brand}
      <h2 class="login-gate__title">${esc(title)}</h2>
      <p class="login-gate__text">${esc(text)}</p>
      <button class="btn btn--blue btn--block" onclick="location.reload()">${icon('arrowUp', 18)} Tải lại</button>
    </div>`;
};

export const closeGate = (): void => document.getElementById('gate')?.remove();
