import type { GameNote } from '../../core/scoring';
import type { ChoiceQuestion, ChoiceSpec } from '../../data/game-types';
import { $, $$, esc, onAction } from '../dom';
import { icon } from '../icons';
import type { GameModule } from './types';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Renders one multiple-choice question with instant feedback. Shared by
 * choice, investigate, escape and boss games.
 * `onAnswer(ok)` fires once the player picks; the caller decides what's next.
 */
export const renderQuestion = (
  host: HTMLElement,
  q: ChoiceQuestion,
  opts: { label?: string; compact?: boolean; retry?: boolean; onAnswer: (ok: boolean, picked: number) => void },
): (() => void) => {
  host.innerHTML = `
    <div class="q ${opts.compact ? 'q--compact' : ''}">
      <div class="q__text">
        ${opts.label ? `<span class="q__label">${esc(opts.label)}</span>` : ''}
        <p>${esc(q.text)}</p>
      </div>
      <div class="q__options">
        ${q.options.map((o, i) => `
          <button class="answer ${opts.compact ? 'answer--sm' : ''}" data-action="pick" data-i="${i}">
            <span class="answer__letter">${LETTERS[i]}</span><span class="answer__text">${esc(o)}</span>
          </button>`).join('')}
      </div>
      <div class="q__explain" hidden></div>
    </div>`;

  let locked = false;
  return onAction(host, {
    pick: (el) => {
      if (locked) return;
      const i = Number(el.dataset.i);
      const ok = i === q.correct;
      const buttons = $$<HTMLButtonElement>(host, '.answer');
      if (ok || !opts.retry) {
        locked = true;
        buttons.forEach((b, bi) => {
          b.disabled = true;
          b.classList.toggle('is-correct', bi === q.correct);
          b.classList.toggle('is-wrong', bi === i && !ok);
        });
        const ex = $(host, '.q__explain');
        ex.hidden = false;
        ex.innerHTML = `${icon(ok ? 'check' : 'bulb', 20)}<span>${esc(q.explain)}</span>`;
        ex.classList.toggle('is-ok', ok);
      } else {
        el.classList.add('is-wrong');
        (el as HTMLButtonElement).disabled = true;
      }
      opts.onAnswer(ok, i);
    },
  });
};

/** "Nếu là bạn?" / "Ai xử lý đúng?" / "Prompt Master": a run of questions. */
export const choiceGame: GameModule<ChoiceSpec> = {
  type: 'choice',
  mount(root, spec, api) {
    let index = 0;
    let correct = 0;
    const notes: GameNote[] = [];
    let stopQ: () => void = () => undefined;

    root.innerHTML = `
      <section class="panel game game--choice">
        <div class="game__progress" data-progress></div>
        <div data-q></div>
        <footer class="game__foot"><button class="btn btn--gold" data-action="next" hidden>Tiếp tục ${icon('chevronRight', 18)}</button></footer>
      </section>`;
    const qHost = $(root, '[data-q]');
    const next = $<HTMLButtonElement>(root, '[data-action="next"]');

    const show = () => {
      const q = spec.questions[index];
      $(root, '[data-progress]').innerHTML = spec.questions
        .map((_, i) => `<span class="${i < index ? 'is-done' : i === index ? 'is-current' : ''}"></span>`).join('');
      next.hidden = true;
      stopQ();
      stopQ = renderQuestion(qHost, q, {
        label: `Câu ${index + 1}/${spec.questions.length}`,
        onAnswer: (ok) => {
          if (ok) correct++;
          notes.push({ ok, text: q.explain });
          api.robot(ok ? 'Chính xác! Bạn nắm rất chắc.' : 'Chưa đúng rồi, đọc giải thích bên dưới nhé.', ok ? 'happy' : 'sad');
          next.hidden = false;
          next.focus();
        },
      });
    };

    const stop = onAction(root, {
      next: () => {
        index++;
        if (index >= spec.questions.length) api.finish({ correct, total: spec.questions.length, notes });
        else show();
      },
    });
    show();

    return {
      destroy: () => {
        stopQ();
        stop();
      },
      timeout: () => ({ correct, total: spec.questions.length, notes }),
    };
  },
};
