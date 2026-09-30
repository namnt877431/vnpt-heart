import type { MatchSpec } from '../../data/game-types';
import { $, $$, esc, onAction } from '../dom';
import { icon } from '../icons';
import { shuffled, type GameModule } from './types';

/**
 * "Ghép đúng": pick a left card then a right card (tap), or drag a right card
 * onto a left card (desktop). Each wrong pairing is a mistake.
 */
export const matchGame: GameModule<MatchSpec> = {
  type: 'match',
  mount(root, spec, api) {
    const n = spec.pairs.length;
    const rightOrder = shuffled(spec.pairs.map((_, i) => i));
    const matched = new Set<number>();
    const wrongOn = new Set<number>();
    let mistakes = 0;
    let selected: number | null = null;

    root.innerHTML = `
      <section class="panel game game--match">
        <div class="match">
          <div class="match__col">
            <h3>${esc(spec.leftLabel)}</h3>
            ${spec.pairs.map((p, i) => `<button class="card card--left" data-action="left" data-i="${i}">${esc(p.a)}</button>`).join('')}
          </div>
          <div class="match__col">
            <h3>${esc(spec.rightLabel)}</h3>
            ${rightOrder.map((i) => `<button class="card card--right" draggable="true" data-action="right" data-i="${i}">${esc(spec.pairs[i].b)}</button>`).join('')}
          </div>
        </div>
        <p class="game__hint">${icon('link', 16)} Chọn một thẻ bên trái rồi chọn thẻ phù hợp bên phải (hoặc kéo thẻ phải thả vào thẻ trái).</p>
      </section>`;

    const left = (i: number) => $(root, `.card--left[data-i="${i}"]`);
    const right = (i: number) => $(root, `.card--right[data-i="${i}"]`);

    const result = () => ({
      correct: Math.max(0, n - mistakes),
      total: n,
      notes: spec.pairs.map((p, i) => ({ ok: !wrongOn.has(i), text: `${p.a} ↔ ${p.b}${p.explain ? ` – ${p.explain}` : ''}` })),
    });

    const tryPair = (l: number, r: number) => {
      if (matched.has(l) || matched.has(r)) return;
      if (l === r) {
        matched.add(l);
        const color = matched.size % 5;
        [left(l), right(r)].forEach((c) => {
          c.classList.remove('is-selected');
          c.classList.add('is-matched', `pair-${color}`);
          (c as HTMLButtonElement).disabled = true;
        });
        api.robot('Ghép chuẩn!', 'happy');
        if (matched.size === n) window.setTimeout(() => api.finish(result()), 700);
      } else {
        mistakes++;
        wrongOn.add(l);
        [left(l), right(r)].forEach((c) => {
          c.classList.add('is-wrong');
          window.setTimeout(() => c.classList.remove('is-wrong'), 500);
        });
        api.robot('Chưa khớp, thử lại nhé!', 'sad');
      }
      selected = null;
      $$(root, '.card--left').forEach((c) => c.classList.remove('is-selected'));
    };

    const stop = onAction(root, {
      left: (el) => {
        const i = Number(el.dataset.i);
        if (matched.has(i)) return;
        selected = i;
        $$(root, '.card--left').forEach((c) => c.classList.toggle('is-selected', c === el));
      },
      right: (el) => {
        if (selected === null) return api.robot('Chọn một thẻ bên trái trước nhé!', 'think');
        tryPair(selected, Number(el.dataset.i));
      },
    });

    // HTML5 drag & drop (desktop)
    const onDragStart = (e: DragEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('.card--right');
      if (el) e.dataTransfer?.setData('text/plain', el.dataset.i!);
    };
    const onDragOver = (e: DragEvent) => {
      if ((e.target as HTMLElement).closest('.card--left')) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('.card--left');
      const r = e.dataTransfer?.getData('text/plain');
      if (target && r) {
        e.preventDefault();
        tryPair(Number(target.dataset.i), Number(r));
      }
    };
    root.addEventListener('dragstart', onDragStart);
    root.addEventListener('dragover', onDragOver);
    root.addEventListener('drop', onDrop);

    return {
      destroy: () => {
        stop();
        root.removeEventListener('dragstart', onDragStart);
        root.removeEventListener('dragover', onDragOver);
        root.removeEventListener('drop', onDrop);
      },
      timeout: () => ({ ...result(), correct: Math.max(0, matched.size - mistakes) }),
    };
  },
};
