import type { OrderSpec } from '../../data/game-types';
import { $, $$, esc, onAction } from '../dom';
import { icon } from '../icons';
import { shuffled, type GameModule } from './types';

/**
 * "Sắp xếp quy trình" (+ Time Attack when the spec has timeLimitSec).
 * Reorder with ▲/▼ or drag & drop, then press "Kiểm tra".
 */
export const orderGame: GameModule<OrderSpec> = {
  type: 'order',
  mount(root, spec, api) {
    const n = spec.steps.length;
    let order = shuffled(spec.steps.map((_, i) => i));
    let mistakes = 0;

    root.innerHTML = `
      <section class="panel game game--order">
        <ol class="steps" data-steps></ol>
        <footer class="game__foot">
          <span class="game__hint">${icon('list', 16)} Kéo thả hoặc dùng ▲▼ để sắp xếp</span>
          <button class="btn btn--gold" data-action="check">Kiểm tra ${icon('check', 18)}</button>
        </footer>
      </section>`;
    const list = $(root, '[data-steps]');

    const render = (marks = false) => {
      list.innerHTML = order.map((stepIdx, pos) => `
        <li class="step ${marks ? (stepIdx === pos ? 'is-right' : 'is-bad') : ''}" draggable="true" data-pos="${pos}">
          <span class="step__no">${pos + 1}</span>
          <span class="step__text">${esc(spec.steps[stepIdx])}</span>
          <span class="step__btns">
            <button class="icon-btn" data-action="up" data-pos="${pos}" aria-label="Lên" ${pos === 0 ? 'disabled' : ''}>${icon('arrowUp', 16)}</button>
            <button class="icon-btn" data-action="down" data-pos="${pos}" aria-label="Xuống" ${pos === n - 1 ? 'disabled' : ''}>${icon('arrowDown', 16)}</button>
          </span>
        </li>`).join('');
    };

    const move = (from: number, to: number) => {
      if (to < 0 || to >= n) return;
      const next = [...order];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      order = next;
      render();
    };

    const rightCount = () => order.filter((s, i) => s === i).length;
    const result = () => ({
      correct: Math.max(0, n - mistakes),
      total: n,
      notes: [{ ok: mistakes === 0, text: `Thứ tự đúng: ${spec.steps.join(' → ')}` }, { ok: true, text: spec.explain }],
    });

    const stop = onAction(root, {
      up: (el) => move(Number(el.dataset.pos), Number(el.dataset.pos) - 1),
      down: (el) => move(Number(el.dataset.pos), Number(el.dataset.pos) + 1),
      check: () => {
        const ok = rightCount();
        render(true);
        if (ok === n) {
          api.robot('Hoàn hảo! Quy trình chuẩn từng bước.', 'happy');
          $$<HTMLButtonElement>(root, 'button').forEach((b) => (b.disabled = true));
          window.setTimeout(() => api.finish(result()), 800);
        } else {
          mistakes++;
          api.robot(`Đúng ${ok}/${n} vị trí. Các bước màu đỏ cần đổi chỗ!`, 'think');
        }
      },
    });

    // drag & drop reorder (desktop)
    let dragFrom = -1;
    const onDragStart = (e: DragEvent) => {
      const li = (e.target as HTMLElement).closest<HTMLElement>('.step');
      if (!li) return;
      dragFrom = Number(li.dataset.pos);
      e.dataTransfer?.setData('text/plain', String(dragFrom));
      li.classList.add('is-dragging');
    };
    const onDragOver = (e: DragEvent) => {
      if ((e.target as HTMLElement).closest('.step')) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      const li = (e.target as HTMLElement).closest<HTMLElement>('.step');
      if (!li || dragFrom < 0) return;
      e.preventDefault();
      move(dragFrom, Number(li.dataset.pos));
      dragFrom = -1;
    };
    list.addEventListener('dragstart', onDragStart);
    list.addEventListener('dragover', onDragOver);
    list.addEventListener('drop', onDrop);

    render();
    return {
      destroy: () => {
        stop();
        list.removeEventListener('dragstart', onDragStart);
        list.removeEventListener('dragover', onDragOver);
        list.removeEventListener('drop', onDrop);
      },
      timeout: () => ({ ...result(), correct: Math.max(0, rightCount() - mistakes) }),
    };
  },
};
