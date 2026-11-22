import type { AdminLevelSummary, Role } from '../../../shared/api-types';
import { openModal, toast } from '../ui/components/overlay';
import { esc } from '../ui/dom';
import { icon } from '../ui/icons';

/** Shared bits of the admin page. */

export interface AdminCtx {
  role: Role;
  /** Navigate to a hash route, e.g. go('#/level/van-hoa-3'). */
  go: (hash: string) => void;
}

/** A view renders into `root` and returns a cleanup function. */
export type AdminView = (root: HTMLElement, ctx: AdminCtx, params: URLSearchParams & { id?: string }) => () => void;

export const isAdmin = (ctx: AdminCtx) => ctx.role === 'admin';

export const pageHead = (title: string, actions = '', sub = '') => `
  <header class="adm-head">
    <div><h1>${esc(title)}</h1>${sub ? `<p>${sub}</p>` : ''}</div>
    <div class="adm-head__actions">${actions}</div>
  </header>`;

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '';

export const statusChip = (l: Pick<AdminLevelSummary, 'status' | 'publishAt'>) => {
  if (l.status === 'archived') return '<span class="adm-chip adm-chip--muted">Lưu trữ</span>';
  if (l.status === 'draft') return '<span class="adm-chip adm-chip--draft">Nháp</span>';
  if (l.publishAt && new Date(l.publishAt) > new Date()) return `<span class="adm-chip adm-chip--scheduled">Hẹn ${esc(fmtDateTime(l.publishAt))}</span>`;
  return '<span class="adm-chip adm-chip--live">Đang hiện</span>';
};

/** Run an API call: toast the success message, or the server's error. */
export const run = async <T>(fn: () => Promise<T>, success?: string): Promise<T | undefined> => {
  try {
    const out = await fn();
    if (success) toast(success, 'check');
    return out;
  } catch (e) {
    toast((e as Error).message, 'x');
    return undefined;
  }
};

/** Resolve `onClosed` once the modal element leaves the page (Esc, backdrop, ×, or done()). */
const watchClose = (el: HTMLElement, onClosed: () => void) => {
  const observer = new MutationObserver(() => {
    if (!el.isConnected) {
      observer.disconnect();
      onClosed();
    }
  });
  observer.observe(document.getElementById('modal-root')!, { childList: true, subtree: true });
};

export const confirmDialog = (message: string, okLabel = 'Đồng ý', danger = false): Promise<boolean> =>
  new Promise((resolve) => {
    let answer = false;
    openModal(
      `<p class="adm-confirm">${esc(message)}</p>
       <div class="adm-confirm__btns">
         <button class="btn btn--ghost btn--sm" data-close>Hủy</button>
         <button class="btn ${danger ? 'adm-btn-danger' : 'btn--blue'} btn--sm" data-yes>${esc(okLabel)}</button>
       </div>`,
      {
        title: 'XÁC NHẬN',
        className: 'adm-modal',
        onMount: (el, done) => {
          el.querySelector('[data-yes]')!.addEventListener('click', () => {
            answer = true;
            done();
          });
          watchClose(el, () => resolve(answer));
        },
      },
    );
  });

/** Simple form modal: returns the submitted FormData or null. */
export const formDialog = (title: string, fieldsHtml: string, okLabel = 'Lưu'): Promise<FormData | null> =>
  new Promise((resolve) => {
    let answered = false;
    openModal(
      `<form class="adm-form" data-dialog>${fieldsHtml}
        <div class="adm-confirm__btns">
          <button type="button" class="btn btn--ghost btn--sm" data-close>Hủy</button>
          <button type="submit" class="btn btn--blue btn--sm">${icon('check', 16)} ${esc(okLabel)}</button>
        </div></form>`,
      {
        title,
        className: 'adm-modal',
        onMount: (el, done) => {
          const form = el.querySelector<HTMLFormElement>('[data-dialog]')!;
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            answered = true;
            resolve(new FormData(form));
            done();
          });
          watchClose(el, () => !answered && resolve(null));
        },
      },
    );
  });

export const field = (label: string, input: string, hint = '') =>
  `<label class="adm-field"><span>${esc(label)}</span>${input}${hint ? `<small>${esc(hint)}</small>` : ''}</label>`;
