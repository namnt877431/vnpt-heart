import { MYSTERY_GIFT_POINTS, rollMystery, type MysteryOutcome } from '../../../../shared/mystery';
import { addBonusPoints, openMysteryOnServer, recordResult, setDoubleXp } from '../../core/progress';
import { API_MODE } from '../../data/api';
import { CHAPTERS } from '../../data/content';
import type { GameSpec } from '../../data/game-types';
import { esc, onAction } from '../dom';
import { icon } from '../icons';

export type { MysteryOutcome } from '../../../../shared/mystery';

/**
 * Render the card-flip picker into `root`. `levelId` is recorded for instant
 * rewards; for game outcomes `onPlay(spec)` is called.
 */
export const mountMystery = (
  root: HTMLElement,
  opts: { levelId?: string; onPlay: (spec: GameSpec) => void; onDone: () => void; robot: (t: string) => void },
): (() => void) => {
  root.innerHTML = `
    <section class="panel game game--mystery">
      <h2 class="mystery__title">${icon('star', 26, 'c-gold')} Vòng bí ẩn ${icon('star', 26, 'c-gold')}</h2>
      <p class="mystery__sub">Chọn một thẻ. Bạn có thể gặp 🎁 Hộp quà, ⚡ Thử thách tốc độ, 🧩 Puzzle, 🎯 Câu hỏi đặc biệt, 🔥 Mini Boss hoặc 💰 Double XP!</p>
      <div class="mystery__cards">
        ${[0, 1, 2].map((i) => `
          <button class="mcard" data-action="flip" data-i="${i}">
            <span class="mcard__inner">
              <span class="mcard__back">?</span>
              <span class="mcard__front" data-front></span>
            </span>
          </button>`).join('')}
      </div>
      <div class="mystery__result" data-result hidden></div>
    </section>`;

  let flipped = false;
  let outcome: MysteryOutcome | null = null;

  return onAction(root, {
    flip: async (el) => {
      if (flipped) return;
      flipped = true;
      if (API_MODE && opts.levelId) {
        // the server rolls the card and applies instant rewards (can't be forged)
        try {
          outcome = await openMysteryOnServer(opts.levelId);
        } catch (e) {
          flipped = false;
          opts.robot(`Chưa lật được thẻ: ${(e as Error).message}`);
          return;
        }
      } else {
        outcome = rollMystery(CHAPTERS);
        if (!outcome.spec && opts.levelId) {
          if (outcome.id === 'gift') addBonusPoints(MYSTERY_GIFT_POINTS);
          if (outcome.id === 'double') setDoubleXp(true);
          recordResult(opts.levelId, { correct: 0, total: 0, timeMs: 0, notes: [] }, 3, 0);
        }
      }
      el.querySelector('[data-front]')!.innerHTML = `<span class="mcard__emoji">${outcome.emoji}</span><b>${esc(outcome.title)}</b>`;
      el.classList.add('is-flipped');
      root.querySelectorAll<HTMLButtonElement>('.mcard').forEach((c) => c !== el && c.classList.add('is-dim'));

      const instant = !outcome.spec;
      opts.robot(instant ? `${outcome.title}! ${outcome.text}` : `${outcome.title}! ${outcome.text} Sẵn sàng chưa?`);

      window.setTimeout(() => {
        const res = root.querySelector<HTMLElement>('[data-result]')!;
        res.hidden = false;
        res.innerHTML = `
          <p><b>${esc(outcome!.title)}:</b> ${esc(outcome!.text)}</p>
          ${instant
            ? `<button class="btn btn--gold" data-action="done">Tiếp tục ${icon('chevronRight', 18)}</button>`
            : `<button class="btn btn--gold" data-action="play">${icon('gamepad', 20)} Chơi ngay</button>`}`;
      }, 700);
    },
    play: () => outcome?.spec && opts.onPlay(outcome.spec),
    done: () => opts.onDone(),
  });
};
