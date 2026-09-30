import { esc } from '../dom';
import { icon } from '../icons';

/**
 * Modal + toast primitives. Both render into fixed roots created by the shell
 * (#modal-root, #toast-root), so screens never manage z-index themselves.
 */

export const openModal = (
  bodyHtml: string,
  opts: { title?: string; className?: string; onMount?: (el: HTMLElement, close: () => void) => void } = {},
): (() => void) => {
  const root = document.getElementById('modal-root')!;
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `
    <div class="modal panel ${opts.className ?? ''}" role="dialog" aria-modal="true">
      ${opts.title ? `<header class="panel__ribbon">${esc(opts.title)}</header>` : ''}
      <button class="modal__close" data-close aria-label="Đóng">${icon('x', 20)}</button>
      <div class="modal__body">${bodyHtml}</div>
    </div>`;

  const close = () => {
    wrap.classList.add('is-leaving');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => wrap.remove(), 160);
  };
  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();

  wrap.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === wrap || t.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', onKey);
  root.appendChild(wrap);
  opts.onMount?.(wrap.querySelector<HTMLElement>('.modal')!, close);
  return close;
};

export const toast = (message: string, iconName = 'bell'): void => {
  const root = document.getElementById('toast-root')!;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icon(iconName, 20)}<span>${esc(message)}</span>`;
  root.appendChild(el);
  setTimeout(() => el.classList.add('is-leaving'), 2200);
  setTimeout(() => el.remove(), 2500);
};

export const comingSoon = (feature: string): void => toast(`${feature}: sẽ có ở phiên bản sau`, 'gear');
