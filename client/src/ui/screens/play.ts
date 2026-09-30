import { ASSETS } from '../../config/assets';
import { sampleQuestion, stages } from '../../data/mock';
import { comingSoon } from '../components/overlay';
import { progressBar } from '../components/progress';
import { $, $$, esc, onAction } from '../dom';
import { icon } from '../icons';
import type { ScreenModule } from './types';

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Quiz screen (stages with mode 'quiz'). MVP: static question, selectable
 * answers, visual countdown. Scoring/next-question logic comes later.
 */
export const playScreen: ScreenModule = {
  id: 'play',
  scene: 'Map',
  mount(root, { go, params }) {
    const stage = stages.find((s) => s.id === params.stageId) ?? stages.find((s) => s.status === 'current') ?? stages[0];
    const q = sampleQuestion;
    let remaining = q.timeLimitSec;

    root.innerHTML = `
      <div class="screen screen--center">
        <section class="panel quiz">
          <header class="quiz__head">
            <button class="btn btn--ghost btn--sm" data-action="back">${icon('chevronLeft', 18)} Bản đồ</button>
            <div class="quiz__stage">
              <span class="stage-no">${stage.id}</span>
              <div><strong>${esc(stage.title)}</strong><small>${esc(stage.subtitle)}</small></div>
            </div>
            <div class="quiz__lives" aria-label="Lượt sai còn lại">${icon('heart', 24, 'c-red')}${icon('heart', 24, 'c-red')}${icon('heart', 24, 'c-muted')}</div>
          </header>

          <div class="quiz__steps" aria-label="Tiến độ">
            ${Array.from({ length: q.total }, (_, i) => `<span class="${i < q.index - 1 ? 'is-done' : i === q.index - 1 ? 'is-current' : ''}"></span>`).join('')}
          </div>

          <div class="quiz__timer">
            ${icon('clock', 20)}
            ${progressBar(remaining, q.timeLimitSec, 'time')}
            <b data-timer>${remaining}s</b>
          </div>

          <div class="quiz__question">
            <span class="quiz__label">Câu ${q.index}/${q.total}</span>
            <p>${esc(q.text)}</p>
          </div>

          <div class="quiz__options">
            ${q.options.map((opt, i) => `
              <button class="answer" data-action="pick" data-index="${i}">
                <span class="answer__letter">${LETTERS[i]}</span>
                <span class="answer__text">${esc(opt)}</span>
              </button>`).join('')}
          </div>

          <footer class="quiz__foot">
            <button class="btn btn--blue" data-action="hint">${icon('bulb', 20)} Gợi ý</button>
            <button class="btn btn--ghost" data-action="skip">Bỏ qua</button>
            <button class="btn btn--gold" data-action="submit" disabled>Trả lời ${icon('check', 20)}</button>
          </footer>
        </section>

        <div class="quiz-mascot">
          <div class="speech speech--left" data-hint hidden>${esc(q.hint)}</div>
          <img src="${ASSETS.robot.url}" alt="" draggable="false" />
        </div>
      </div>
    `;

    const screen = $(root, '.screen');
    const submit = $<HTMLButtonElement>(screen, '[data-action="submit"]');
    const timerText = $(screen, '[data-timer]');
    const timerBar = $(screen, '.quiz__timer .bar > span');

    const tick = window.setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      timerText.textContent = `${remaining}s`;
      timerBar.style.width = `${(remaining / q.timeLimitSec) * 100}%`;
      screen.classList.toggle('is-hurry', remaining <= 10);
      if (remaining === 0) window.clearInterval(tick);
    }, 1000);

    const stop = onAction(screen, {
      back: () => go('home'),
      pick: (el) => {
        $$(screen, '.answer').forEach((b) => b.classList.toggle('is-selected', b === el));
        submit.disabled = false;
      },
      hint: () => ($(screen, '[data-hint]').hidden = false),
      skip: () => comingSoon('Chuyển câu hỏi'),
      submit: () => comingSoon('Chấm điểm câu trả lời'),
    });

    return () => {
      window.clearInterval(tick);
      stop();
    };
  },
};
