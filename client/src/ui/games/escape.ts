import type { GameNote } from '../../core/scoring';
import type { EscapeSpec } from '../../data/game-types';
import { $ } from '../dom';
import { icon } from '../icons';
import { renderQuestion } from './choice';
import type { GameModule } from './types';

/** "Escape Room": each correct answer opens one lock; wrong answers can be retried. */
export const escapeGame: GameModule<EscapeSpec> = {
  type: 'escape',
  mount(root, spec, api) {
    const n = spec.locks.length;
    let index = 0;
    let mistakes = 0;
    const notes: GameNote[] = [];
    let wrongHere = false;
    let stopQ: () => void = () => undefined;

    root.innerHTML = `
      <section class="panel game game--escape">
        <div class="door" data-door>
          <div class="door__frame">
            <div class="door__panel">
              <div class="door__locks">${spec.locks.map((_, i) => `<span class="padlock" data-lock="${i}">${icon('lock', 26)}</span>`).join('')}</div>
              <span class="door__knob"></span>
            </div>
          </div>
        </div>
        <div data-q></div>
      </section>`;

    const qHost = $(root, '[data-q]');

    const show = () => {
      wrongHere = false;
      stopQ();
      stopQ = renderQuestion(qHost, spec.locks[index], {
        label: `Ổ khóa ${index + 1}/${n}`,
        retry: true,
        onAnswer: (ok) => {
          if (!ok) {
            mistakes++;
            wrongHere = true;
            $(root, '[data-door]').classList.add('is-shake');
            window.setTimeout(() => root.querySelector('[data-door]')?.classList.remove('is-shake'), 400);
            api.robot('Khóa chưa mở! Thử đáp án khác nhé.', 'sad');
            return;
          }
          notes.push({ ok: !wrongHere, text: spec.locks[index].explain });
          const lock = $(root, `[data-lock="${index}"]`);
          lock.classList.add('is-open');
          lock.innerHTML = icon('unlock', 26);
          index++;
          if (index >= n) {
            $(root, '[data-door]').classList.add('is-open');
            api.robot('Cánh cửa đã mở! Bạn thoát khỏi phòng rồi!', 'happy');
            window.setTimeout(() => api.finish({ correct: Math.max(0, n - mistakes), total: n, notes }), 1300);
          } else {
            api.robot(`Mở được ổ khóa ${index}! Còn ${n - index} ổ nữa.`, 'happy');
            window.setTimeout(show, 1400);
          }
        },
      });
    };
    show();

    return {
      destroy: () => stopQ(),
      timeout: () => ({ correct: Math.max(0, index - mistakes), total: n, notes, failed: index < n }),
    };
  },
};
