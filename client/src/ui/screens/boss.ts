import { boss, me, sampleQuestion } from '../../data/mock';
import { bus } from '../../core/events';
import { avatar } from '../components/avatar';
import { comingSoon, toast } from '../components/overlay';
import { progressBar } from '../components/progress';
import { $, $$, esc, fmt, onAction } from '../dom';
import { icon } from '../icons';
import { watchSafeArea } from '../safe-area';
import type { ScreenModule } from './types';

const ITEMS = [
  { id: 'x2', label: 'x2 Sát thương', icon: 'sword', count: 1 },
  { id: 'heal', label: '+30 HP', icon: 'plusHeart', count: 2 },
  { id: 'shield', label: 'Khiên', icon: 'shield', count: 1 },
];
const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Boss fight HUD (Gunny-style): HP bars, turn timer, wind, question gate,
 * angle dial, power bar, items and fire button. BossFightScene draws the arena.
 * Keyboard: ↑/↓ angle, ←/→ power, Space fire.
 */
export const bossScreen: ScreenModule = {
  id: 'boss',
  scene: 'BossFight',
  mount(root, { go }) {
    let angle = 45;
    let power = 70;
    let phase: 'question' | 'aim' = 'question';
    const q = sampleQuestion;

    root.innerHTML = `
      <div class="boss-hud">
        <header class="boss-hud__top">
          <div class="fighter panel">
            ${avatar(me.name, 44)}
            <div class="fighter__info"><strong>${esc(me.name)}</strong>${progressBar(100, 100, 'hp')}<small>1.000 / 1.000</small></div>
          </div>
          <div class="turn">
            <div class="turn__clock"><b>15</b></div>
            <span class="turn__label">Lượt của bạn</span>
            <span class="wind">${icon('wind', 18)} Gió <b>◀ 2</b></span>
          </div>
          <div class="fighter fighter--boss panel">
            <div class="fighter__info"><strong>${esc(boss.name)}</strong>${progressBar(boss.hp, boss.hpMax, 'boss')}<small>${fmt(boss.hp)} / ${fmt(boss.hpMax)}</small></div>
            <span class="fighter__boss-icon">${icon('bolt', 30)}</span>
          </div>
        </header>

        <button class="btn btn--ghost btn--sm boss-hud__exit" data-action="exit">${icon('logout', 16)} Rời trận</button>

        <div class="boss-hud__arena" data-safe-area></div>

        <section class="panel gate" data-gate>
          <header class="panel__ribbon">${icon('bulb', 22)} TRẢ LỜI ĐÚNG ĐỂ GIÀNH LƯỢT BẮN</header>
          <p class="gate__q">${esc(q.text)}</p>
          <div class="gate__options">
            ${q.options.map((o, i) => `
              <button class="answer answer--sm" data-action="answer">
                <span class="answer__letter">${LETTERS[i]}</span><span class="answer__text">${esc(o)}</span>
              </button>`).join('')}
          </div>
        </section>

        <footer class="controls panel" data-controls>
          <div class="dial">
            <div class="dial__face"><span class="dial__needle" data-needle></span><b data-angle>${angle}°</b></div>
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
            <div class="power__scale">${[0, 20, 40, 60, 80, 100].map((n) => `<span>${n}</span>`).join('')}</div>
            <small>LỰC <b data-power>${power}</b></small>
          </div>

          <div class="items">
            ${ITEMS.map((it) => `
              <button class="item" data-action="item" data-label="${esc(it.label)}" title="${esc(it.label)}">
                ${icon(it.icon, 26)}<span class="item__count">${it.count}</span>
              </button>`).join('')}
          </div>

          <button class="btn btn--fire" data-action="fire">BẮN!</button>
        </footer>
      </div>
    `;

    const hud = $(root, '.boss-hud');
    const controls = $(hud, '[data-controls]');
    const gate = $(hud, '[data-gate]');

    const render = () => {
      $(hud, '[data-angle]').textContent = `${angle}°`;
      $(hud, '[data-needle]').style.transform = `rotate(${-angle}deg)`;
      $(hud, '[data-power]').textContent = String(power);
      $(hud, '[data-power-fill]').style.clipPath = `inset(0 ${100 - power}% 0 0 round 99px)`;
      $(hud, '[data-power-marker]').style.left = `${power}%`;
      controls.classList.toggle('is-disabled', phase !== 'aim');
      gate.hidden = phase !== 'question';
      bus.emit('boss:aim', { angle, power });
    };

    const fire = () => {
      if (phase !== 'aim') return toast('Trả lời câu hỏi để giành lượt bắn', 'bulb');
      bus.emit('boss:fire', { angle, power });
    };

    const stopActions = onAction(hud, {
      exit: () => go('home'),
      answer: (el) => {
        $$(gate, '.answer').forEach((b) => b.classList.toggle('is-selected', b === el));
        setTimeout(() => {
          phase = 'aim';
          render();
          toast('Chính xác! Bạn được 1 lượt bắn', 'target');
        }, 350);
      },
      angle: (el) => {
        angle = clamp(angle + Number(el.dataset.delta), 0, 90);
        render();
      },
      'power-set': (el, ev) => {
        const r = el.getBoundingClientRect();
        power = clamp(Math.round(((ev.clientX - r.left) / r.width) * 100), 0, 100);
        render();
      },
      item: (el) => comingSoon(`Vật phẩm ${el.dataset.label}`),
      fire,
    });

    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'aim') return;
      const k: Record<string, () => void> = {
        ArrowUp: () => (angle = clamp(angle + 1, 0, 90)),
        ArrowDown: () => (angle = clamp(angle - 1, 0, 90)),
        ArrowRight: () => (power = clamp(power + 2, 0, 100)),
        ArrowLeft: () => (power = clamp(power - 2, 0, 100)),
      };
      if (e.code === 'Space') {
        e.preventDefault();
        fire();
      } else if (k[e.key]) {
        e.preventDefault();
        k[e.key]();
        render();
      }
    };
    window.addEventListener('keydown', onKey);

    const stopSafe = watchSafeArea($(hud, '.boss-hud__arena'));
    render();

    return () => {
      window.removeEventListener('keydown', onKey);
      stopActions();
      stopSafe();
    };
  },
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
