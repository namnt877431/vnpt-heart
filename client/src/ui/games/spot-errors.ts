import type { GameNote } from '../../core/scoring';
import type { SpotErrorsSpec } from '../../data/game-types';
import { $, $$, esc, onAction } from '../dom';
import { icon } from '../icons';
import type { GameModule } from './types';

/**
 * "Soi lỗi": every text fragment is clickable; only the `bad` ones count.
 * Misclicks cost points (every 2 misclicks cancel one find).
 */
export const spotErrorsGame: GameModule<SpotErrorsSpec> = {
  type: 'spot-errors',
  mount(root, spec, api) {
    const bads: { id: number; bad: string; why: string }[] = [];
    let nextId = 0;
    const body = spec.lines
      .map((line) => `<p class="doc__line">${line.map((part) => {
        if (typeof part === 'string') return `<span class="spot" data-action="miss">${esc(part)}</span>`;
        const id = nextId++;
        bads.push({ id, ...part });
        return `<span class="spot" data-action="hit" data-id="${id}">${esc(part.bad)}</span>`;
      }).join(' ')}</p>`)
      .join('');

    const h = spec.header;
    const header = spec.format === 'email' && h
      ? `<dl class="doc__mail"><div><dt>Từ</dt><dd>${esc(h.from ?? '')}</dd></div><div><dt>Đến</dt><dd>${esc(h.to ?? '')}</dd></div><div><dt>Tiêu đề</dt><dd>${esc(h.subject ?? '')}</dd></div></dl>`
      : spec.format === 'doc' && h?.subject ? `<h3 class="doc__title">${esc(h.subject)}</h3>`
        : spec.format === 'chat' ? `<div class="doc__ai">${icon('bolt', 18)} Trợ lý AI</div>` : '';

    root.innerHTML = `
      <section class="panel game game--spot">
        <div class="spot-hud">
          <span>${icon('search', 20)} Đã tìm: <b data-found>0</b>/${bads.length}</span>
          <span class="spot-hud__miss">${icon('x', 18)} Bấm nhầm: <b data-miss>0</b></span>
          <button class="btn btn--gold btn--sm" data-action="submit">Nộp bài ${icon('check', 16)}</button>
        </div>
        <article class="doc doc--${spec.format}">${header}<div class="doc__body">${body}</div></article>
      </section>`;

    const found = new Set<number>();
    let misses = 0;

    const result = () => {
      const notes: GameNote[] = bads.map((b) => ({ ok: found.has(b.id), text: `"${b.bad}" – ${b.why}` }));
      return { correct: Math.max(0, found.size - Math.floor(misses / 2)), total: bads.length, notes };
    };

    const reveal = () => $$(root, '.spot[data-action="hit"]').forEach((s) => !found.has(Number(s.dataset.id)) && s.classList.add('is-missed'));

    const stop = onAction(root, {
      hit: (el) => {
        const id = Number(el.dataset.id);
        if (found.has(id)) return;
        found.add(id);
        el.classList.add('is-found');
        const why = bads.find((b) => b.id === id)!.why;
        el.insertAdjacentHTML('afterend', `<span class="spot-why">${icon('bulb', 14)}${esc(why)}</span>`);
        $(root, '[data-found]').textContent = String(found.size);
        api.robot(`Chuẩn! ${why}`, 'happy');
        if (found.size === bads.length) window.setTimeout(() => api.finish(result()), 900);
      },
      miss: (el) => {
        if (el.classList.contains('is-wrong')) return;
        misses++;
        el.classList.add('is-wrong');
        window.setTimeout(() => el.classList.remove('is-wrong'), 600);
        $(root, '[data-miss]').textContent = String(misses);
        api.robot('Đoạn này ổn mà, tìm chỗ khác nhé!', 'think');
      },
      submit: () => {
        reveal();
        window.setTimeout(() => api.finish(result()), 700);
      },
    });

    return { destroy: stop, timeout: () => (reveal(), result()) };
  },
};
