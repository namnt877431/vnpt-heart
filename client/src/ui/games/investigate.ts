import type { InvestigateSpec } from '../../data/game-types';
import { $, esc, onAction } from '../dom';
import { icon } from '../icons';
import { renderQuestion } from './choice';
import type { GameModule } from './types';

const CLUE_ICON: Record<InvestigateSpec['clues'][number]['kind'], { icon: string; label: string }> = {
  email: { icon: 'mail', label: 'Email' },
  chat: { icon: 'chat', label: 'Tin nhắn' },
  data: { icon: 'chart', label: 'Dữ liệu' },
  log: { icon: 'list', label: 'Lịch sử xử lý' },
};

/** "Điều tra sự cố": open clue cards, then name the root cause. */
export const investigateGame: GameModule<InvestigateSpec> = {
  type: 'investigate',
  mount(root, spec, api) {
    const opened = new Set<number>();
    let stopQ: () => void = () => undefined;

    root.innerHTML = `
      <section class="panel game game--investigate">
        <div class="incident">${icon('bolt', 22)}<p><b>Sự cố:</b> ${esc(spec.incident)}</p></div>
        <div class="clues">
          ${spec.clues.map((c, i) => `
            <button class="clue" data-action="open" data-i="${i}">
              <span class="clue__icon">${icon(CLUE_ICON[c.kind].icon, 26)}</span>
              <span class="clue__kind">${CLUE_ICON[c.kind].label}</span>
              <strong>${esc(c.title)}</strong>
              <span class="clue__body" hidden>${esc(c.body)}</span>
              <span class="clue__cta">Mở manh mối</span>
            </button>`).join('')}
        </div>
        <div class="verdict" data-verdict>
          <p class="verdict__lock">${icon('lock', 18)} Mở ít nhất <b>${spec.minClues}</b> manh mối để đưa ra kết luận (<span data-opened>0</span>/${spec.minClues})</p>
        </div>
      </section>`;

    const verdict = $(root, '[data-verdict]');
    let answered = false;

    const unlockQuestion = () => {
      stopQ = renderQuestion(verdict, spec.question, {
        label: 'Kết luận',
        onAnswer: (ok) => {
          answered = true;
          api.robot(ok ? 'Thám tử giỏi! Bạn đã tìm ra nguyên nhân gốc rễ.' : 'Chưa đúng, xem lại các manh mối nhé.', ok ? 'happy' : 'sad');
          window.setTimeout(() => api.finish({
            correct: ok ? 1 : 0,
            total: 1,
            notes: [{ ok, text: spec.question.explain }],
          }), 1600);
        },
      });
      api.robot('Đủ manh mối rồi! Nguyên nhân thật sự là gì?', 'think');
    };

    const stop = onAction(root, {
      open: (el) => {
        const i = Number(el.dataset.i);
        if (opened.has(i)) return;
        opened.add(i);
        el.classList.add('is-open');
        el.querySelector<HTMLElement>('.clue__body')!.hidden = false;
        el.querySelector<HTMLElement>('.clue__cta')!.hidden = true;
        const counter = root.querySelector('[data-opened]');
        if (counter) counter.textContent = String(opened.size);
        if (opened.size === spec.minClues) unlockQuestion();
        else if (opened.size < spec.minClues) api.robot('Manh mối hay đấy! Mở tiếp nhé.', 'think');
      },
    });

    return {
      destroy: () => {
        stop();
        stopQ();
      },
      timeout: () => ({ correct: 0, total: 1, notes: [{ ok: answered, text: spec.question.explain }] }),
    };
  },
};
