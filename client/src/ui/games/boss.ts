import { bus } from '../../core/events';
import type { GameNote } from '../../core/scoring';
import type { BossSpec } from '../../data/game-types';
import { me } from '../../data/mock';
import { avatar } from '../components/avatar';
import { toast } from '../components/overlay';
import { progressBar } from '../components/progress';
import { $, esc, onAction } from '../dom';
import { icon } from '../icons';
import { watchSafeArea } from '../safe-area';
import { renderQuestion } from './choice';
import type { GameModule } from './types';

const HEARTS = 3;
const DAMAGE = 100;

/**
 * "Boss Challenge" (Gunny-style). A big case split into steps; each correct
 * answer earns one shot (angle + power + wind), each hit removes one step of
 * boss HP. Wrong answer: the boss hits back (-1 heart) and the step repeats.
 * BossFightScene draws the arena; this module is the HUD + turn logic.
 * Keyboard while aiming: ↑/↓ angle, ←/→ power, Space fire.
 */
export const bossGame: GameModule<BossSpec> = {
  type: 'boss',
  scene: 'BossFight',
  fullScreen: true,
  mount(root, spec, api) {
    const steps = spec.steps.length;
    const hpMax = steps * DAMAGE;
    let hp = hpMax;
    let hearts = HEARTS;
    let step = 0;
    let firstTry = true;
    let rightFirstTry = 0;
    let phase: 'question' | 'aim' | 'busy' | 'done' = 'question';
    let angle = 45;
    let power = 70;
    let wind = 0;
    const notes: GameNote[] = [];
    const timers: number[] = [];
    let stopQ: () => void = () => undefined;

    root.innerHTML = `
      <div class="boss-hud">
        <header class="boss-hud__top">
          <div class="fighter panel">
            ${avatar(me.name, 44)}
            <div class="fighter__info"><strong>${esc(me.name)}</strong><span class="hearts" data-hearts></span></div>
          </div>
          <div class="turn">
            <ol class="boss-steps" data-steps>${spec.steps.map((s, i) => `<li data-step="${i}"><span>${i + 1}</span>${esc(s.label)}</li>`).join('')}</ol>
            <span class="wind" data-wind></span>
          </div>
          <div class="fighter fighter--boss panel">
            <div class="fighter__info"><strong>${esc(spec.bossName)}</strong><span data-hp></span><small data-hp-text></small></div>
            <span class="fighter__boss-icon">${icon('bolt', 30)}</span>
          </div>
        </header>

        <button class="btn btn--ghost btn--sm boss-hud__exit" data-action="exit">${icon('logout', 16)} Rời trận</button>
        <div class="boss-hud__arena" data-safe-area></div>

        <section class="panel gate" data-gate>
          <header class="panel__ribbon">${icon('bulb', 22)} <span data-gate-title></span></header>
          <div data-q></div>
        </section>

        <footer class="controls panel" data-controls>
          <div class="dial">
            <div class="dial__face"><span class="dial__needle" data-needle></span><b data-angle></b></div>
            <div class="dial__btns">
              <button class="icon-btn" data-action="angle" data-delta="1" aria-label="Tăng góc">${icon('arrowUp', 18)}</button>
              <button class="icon-btn" data-action="angle" data-delta="-1" aria-label="Giảm góc">${icon('arrowDown', 18)}</button>
            </div>
            <small>GÓC</small>
          </div>
          <div class="power">
            <div class="power__track" data-action="power-set">
              <span class="power__fill" data-power-fill></span>
              <span class="power__marker" data-power-marker></span>
            </div>
            <div class="power__scale">${[0, 20, 40, 60, 80, 100].map((v) => `<span>${v}</span>`).join('')}</div>
            <small>LỰC <b data-power></b></small>
          </div>
          <button class="btn btn--fire" data-action="fire">BẮN!</button>
        </footer>
      </div>`;

    const hud = $(root, '.boss-hud');
    const gate = $(hud, '[data-gate]');
    const controls = $(hud, '[data-controls]');

    const render = () => {
      $(hud, '[data-hearts]').innerHTML = Array.from({ length: HEARTS }, (_, i) => icon('heart', 22, i < hearts ? 'c-red' : 'c-muted')).join('');
      $(hud, '[data-hp]').innerHTML = progressBar(hp, hpMax, 'boss');
      $(hud, '[data-hp-text]').textContent = `${hp} / ${hpMax}`;
      $(hud, '[data-angle]').textContent = `${angle}°`;
      $(hud, '[data-needle]').style.transform = `rotate(${-angle}deg)`;
      $(hud, '[data-power]').textContent = String(power);
      $(hud, '[data-power-fill]').style.clipPath = `inset(0 ${100 - power}% 0 0 round 99px)`;
      $(hud, '[data-power-marker]').style.left = `${power}%`;
      $(hud, '[data-wind]').innerHTML = `${icon('wind', 18)} Gió <b>${wind === 0 ? '0' : wind < 0 ? `◀ ${-wind}` : `${wind} ▶`}</b>`;
      hud.querySelectorAll<HTMLElement>('[data-step]').forEach((li) => {
        const i = Number(li.dataset.step);
        li.className = i < step ? 'is-done' : i === step ? 'is-current' : '';
      });
      controls.classList.toggle('is-disabled', phase !== 'aim');
      gate.hidden = phase !== 'question';
      bus.emit('boss:aim', { angle, power, wind });
    };

    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    const finish = (failed: boolean) => {
      phase = 'done';
      render();
      api.finish({ correct: rightFirstTry, total: steps, notes, failed });
    };

    const askStep = () => {
      phase = 'question';
      const s = spec.steps[step];
      $(hud, '[data-gate-title]').textContent = `BƯỚC ${step + 1}/${steps}: ${s.label.toUpperCase()}`;
      stopQ();
      stopQ = renderQuestion($(gate, '[data-q]'), s, {
        compact: true,
        onAnswer: (ok) => {
          if (ok) {
            if (firstTry) rightFirstTry++;
            notes.push({ ok: firstTry, text: `${s.label}: ${s.explain}` });
            later(1100, () => {
              phase = 'aim';
              wind = Math.round(Math.random() * 6 - 3);
              render();
              toast('Chính xác! Chỉnh góc, lực rồi BẮN!', 'target');
            });
          } else {
            firstTry = false;
            hearts--;
            phase = 'busy';
            later(900, () => {
              gate.hidden = true;
              bus.emit('boss:attack');
            });
            later(2000, () => {
              render();
              if (hearts <= 0) {
                notes.push({ ok: false, text: `${s.label}: ${s.explain}` });
                toast(`${spec.bossName} đã thắng lượt này. Thử lại nhé!`, 'heart');
                finish(true);
              } else {
                toast(`Bị ${spec.bossName} phản công! Còn ${hearts} ♥`, 'heart');
                askStep();
                render();
              }
            });
          }
        },
      });
      render();
    };

    const offLanded = bus.on('boss:shot-landed', ({ hit }) => {
      if (phase !== 'busy') return;
      if (!hit) {
        phase = 'aim';
        render();
        toast('Trượt rồi! Chỉnh lại góc và lực, bắn tiếp!', 'target');
        return;
      }
      hp = Math.max(0, hp - DAMAGE);
      step++;
      firstTry = true;
      render();
      if (hp <= 0) {
        bus.emit('boss:defeated');
        toast(`Hạ gục ${spec.bossName}!`, 'crown');
        later(1800, () => finish(false));
      } else {
        later(700, askStep);
      }
    });

    const fire = () => {
      if (phase !== 'aim') return;
      phase = 'busy';
      render();
      bus.emit('boss:fire', { angle, power, damage: DAMAGE });
    };

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const stop = onAction(hud, {
      exit: () => api.exit(),
      angle: (el) => {
        if (phase !== 'aim') return;
        angle = clamp(angle + Number(el.dataset.delta), 0, 90);
        render();
      },
      'power-set': (el, ev) => {
        if (phase !== 'aim') return;
        const r = el.getBoundingClientRect();
        power = clamp(Math.round(((ev.clientX - r.left) / r.width) * 100), 0, 100);
        render();
      },
      fire,
    });

    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'aim') return;
      const keys: Record<string, () => void> = {
        ArrowUp: () => (angle = clamp(angle + 1, 0, 90)),
        ArrowDown: () => (angle = clamp(angle - 1, 0, 90)),
        ArrowRight: () => (power = clamp(power + 2, 0, 100)),
        ArrowLeft: () => (power = clamp(power - 2, 0, 100)),
      };
      if (e.code === 'Space') {
        e.preventDefault();
        fire();
      } else if (keys[e.key]) {
        e.preventDefault();
        keys[e.key]();
        render();
      }
    };
    window.addEventListener('keydown', onKey);
    const stopSafe = watchSafeArea($(hud, '.boss-hud__arena'));
    askStep();

    return {
      destroy: () => {
        timers.forEach(clearTimeout);
        window.removeEventListener('keydown', onKey);
        offLanded();
        stop();
        stopQ();
        stopSafe();
      },
    };
  },
};
