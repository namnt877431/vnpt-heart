import { esc } from '../dom';

export const LOADING_HTML = '<p class="async-note">Đang tải…</p>';

/**
 * Render data that arrives later (API mode) into `el`: shows a loading note,
 * then `render(data)`; ignores results if the screen was left meanwhile.
 */
export const fillAsync = <T>(el: HTMLElement, data: Promise<T>, render: (d: T) => string, after?: (d: T) => void): void => {
  el.innerHTML = LOADING_HTML;
  data
    .then((d) => {
      if (!el.isConnected) return;
      el.innerHTML = render(d);
      after?.(d);
    })
    .catch((e: Error) => {
      if (el.isConnected) el.innerHTML = `<p class="async-note async-note--error">Không tải được dữ liệu: ${esc(e.message)}</p>`;
    });
};
