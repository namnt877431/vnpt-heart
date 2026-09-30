import type { GameNote } from '../../core/scoring';
import type { BinarySpec } from '../../data/game-types';
import { $, esc, onAction } from '../dom';
import { icon } from '../icons';
import type { GameModule } from './types';

/** "Đúng hay sai?" / "AI hay thủ công?": one card at a time, two bins. Keys ← / →. */
export const binaryGame: GameModule<BinarySpec> = {
  type: 'binary',
  mount(root, spec, api) {
    let index = 0;
    let correct = 0;
    let busy = false;
    const notes: GameNote[] = [];

    root.innerHTML = `
      <section class="panel game game--binary">
        <div class="deck__count" data-count></div>
        <div class="deck"><div class="deck__card" data-card></div></div>
        <div class="bins">
          <button class="bin bin--a" data-action="pick" data-bin="0">${icon('chevronLeft', 22)} ${esc(spec.labels[0])}</button>
          <button class="bin bin--b" data-action="pick" data-bin="1">${esc(spec.labels[1])} ${icon('chevronRight', 22)}</button>
        </div>
      </section>`;
    const card = $(root, '[data-card]');

    const show = () => {
      card.className = 'deck__card';
      card.textContent = spec.items[index].text;
      $(root, '[data-count]').textContent = `Thẻ ${index + 1}/${spec.items.length}`;
    };

    const pick = (bin: 0 | 1) => {
      if (busy || index >= spec.items.length) return;
      busy = true;
      const item = spec.items[index];
      const ok = item.answer === bin;
      if (ok) correct++;
      notes.push({ ok, text: `${item.text} → ${spec.labels[item.answer]}. ${item.explain}` });
      card.classList.add(bin === 0 ? 'fly-left' : 'fly-right', ok ? 'is-ok' : 'is-bad');
      api.robot(ok ? `Đúng! ${item.explain}` : `Sai rồi: ${item.explain}`, ok ? 'happy' : 'sad');
      window.setTimeout(() => {
        busy = false;
        index++;
        if (index >= spec.items.length) api.finish({ correct, total: spec.items.length, notes });
        else show();
      }, 650);
    };

    const stop = onAction(root, { pick: (el) => pick(Number(el.dataset.bin) as 0 | 1) });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') pick(0);
      if (e.key === 'ArrowRight') pick(1);
    };
    window.addEventListener('keydown', onKey);
    show();

    return {
      destroy: () => {
        stop();
        window.removeEventListener('keydown', onKey);
      },
      timeout: () => ({ correct, total: spec.items.length, notes }),
    };
  },
};
