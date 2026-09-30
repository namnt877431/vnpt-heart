import { addBonusPoints, recordResult, setDoubleXp } from '../../core/progress';
import { CHAPTERS } from '../../data/content';
import type { GameSpec } from '../../data/game-types';
import { esc, onAction } from '../dom';
import { icon } from '../icons';

/**
 * "Mystery Level": three face-down cards; the player flips one. The outcome
 * is either an instant reward or a surprise mini-game drawn from the content.
 */
export interface MysteryOutcome {
  id: 'gift' | 'double' | 'speed' | 'puzzle' | 'special' | 'miniboss';
  emoji: string;
  title: string;
  text: string;
  /** Present when the outcome is a game to play. */
  spec?: GameSpec;
}

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const specsOf = <K extends GameSpec['type']>(type: K) =>
  CHAPTERS.flatMap((c) => c.levels.map((l) => l.spec)).filter((s): s is Extract<GameSpec, { type: K }> => s?.type === type);

export const rollOutcome = (): MysteryOutcome => {
  const roll = pick(['gift', 'double', 'speed', 'puzzle', 'special', 'miniboss'] as const);
  switch (roll) {
    case 'gift':
      return { id: roll, emoji: '🎁', title: 'Hộp quà', text: 'Bạn nhận được +50 điểm thưởng!' };
    case 'double':
      return { id: roll, emoji: '💰', title: 'Double XP', text: 'Level tiếp theo bạn hoàn thành sẽ được nhân đôi điểm!' };
    case 'speed': {
      const s = pick(specsOf('binary'));
      return { id: roll, emoji: '⚡', title: 'Thử thách tốc độ', text: '20 giây, phân loại thật nhanh!', spec: { ...s, title: 'Thử thách tốc độ', timeLimitSec: 20, parTimeSec: 15 } };
    }
    case 'puzzle':
      return { id: roll, emoji: '🧩', title: 'Puzzle', text: 'Ghép các cặp thẻ đúng với nhau.', spec: { ...pick(specsOf('match')), title: 'Puzzle bí ẩn' } };
    case 'special': {
      const s = pick(specsOf('choice'));
      return { id: roll, emoji: '🎯', title: 'Câu hỏi đặc biệt', text: 'Một câu hỏi, cơ hội ghi điểm lớn!', spec: { ...s, title: 'Câu hỏi đặc biệt', questions: [pick(s.questions)] } };
    }
    case 'miniboss': {
      const s = pick(specsOf('boss'));
      return { id: roll, emoji: '🔥', title: 'Mini Boss', text: `${s.bossName} (bản mini) xuất hiện!`, spec: { ...s, title: `Mini Boss: ${s.bossName}`, steps: s.steps.slice(0, 2) } };
    }
  }
};

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
    flip: (el) => {
      if (flipped) return;
      flipped = true;
      outcome = rollOutcome();
      el.querySelector('[data-front]')!.innerHTML = `<span class="mcard__emoji">${outcome.emoji}</span><b>${esc(outcome.title)}</b>`;
      el.classList.add('is-flipped');
      root.querySelectorAll<HTMLButtonElement>('.mcard').forEach((c) => c !== el && c.classList.add('is-dim'));

      const instant = !outcome.spec;
      if (instant && opts.levelId) {
        if (outcome.id === 'gift') addBonusPoints(50);
        if (outcome.id === 'double') setDoubleXp(true);
        recordResult(opts.levelId, 3, 0);
      }
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
