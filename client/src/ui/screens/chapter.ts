import { assetUrlByKey, ASSETS } from '../../config/assets';
import { chapterStars, introSeen, isChapterUnlocked, isLevelUnlocked, levelRecord, markIntroSeen, nextLevelIndex } from '../../core/progress';
import { getChapter } from '../../data/content';
import { GAME_TYPE_INFO } from '../../data/game-types';
import { openModal, toast } from '../components/overlay';
import { starRow } from '../components/progress';
import { $, esc, onAction } from '../dom';
import { icon } from '../icons';
import type { ScreenModule } from './types';

/** Path geometry (px in a 400-wide coordinate space, scaled with the container). */
const W = 400;
const STEP_Y = 128;
const PAD_Y = 90;

/**
 * One chapter's level path, Candy-Crush style: nodes wind upwards from level 1
 * at the bottom to the boss at the top. Locked nodes show a padlock; the
 * mystery node shows "?"; the boss node is bigger and red.
 */
export const chapterScreen: ScreenModule = {
  id: 'chapter',
  scene: 'Map',
  mount(root, { go, params }) {
    const chapter = getChapter(params.chapterId);
    if (!chapter || !isChapterUnlocked(chapter)) {
      go('home');
      return () => undefined;
    }

    const n = chapter.levels.length;
    const height = PAD_Y * 2 + (n - 1) * STEP_Y;
    const pts = chapter.levels.map((_, i) => ({
      x: W / 2 + Math.sin(i * 1.25) * (W * 0.3),
      y: height - PAD_Y - i * STEP_Y,
    }));
    const path = pts.reduce((d, p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`;
      const prev = pts[i - 1];
      const my = (prev.y + p.y) / 2;
      return `${d} C${prev.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`;
    }, '');
    const currentIdx = nextLevelIndex(chapter);
    const cs = chapterStars(chapter);

    const nodes = chapter.levels.map((lvl, i) => {
      const unlocked = isLevelUnlocked(chapter, i);
      const rec = levelRecord(lvl.id);
      const isCurrent = unlocked && i === currentIdx && !(rec && rec.stars > 0 && i === n - 1);
      const kind = lvl.kind;
      const label = kind === 'boss' ? icon('crown', 34) : kind === 'mystery' ? '?' : String(i + 1);
      const name = kind === 'mystery' ? 'Vòng bí ẩn' : lvl.spec ? GAME_TYPE_INFO[lvl.spec.type].name : '';
      return `
        <div class="lnode-wrap" style="left:${(pts[i].x / W) * 100}%;top:${pts[i].y}px">
          ${isCurrent ? `<img class="lnode__robot" src="${ASSETS.robot.url}" alt="" />` : ''}
          <button class="lnode lnode--${kind} ${unlocked ? '' : 'is-locked'} ${isCurrent ? 'is-current' : ''} ${rec && rec.stars > 0 ? 'is-done' : ''}"
            data-action="${unlocked ? 'play' : 'locked'}" data-level="${lvl.id}" aria-label="Level ${i + 1}: ${esc(name)}">
            <span class="lnode__num">${unlocked ? label : icon('lock', 24)}</span>
          </button>
          <div class="lnode__stars">${unlocked && kind !== 'mystery' ? starRow(rec?.stars ?? 0, 3) : ''}</div>
          <span class="lnode__name">${esc(kind === 'boss' && lvl.spec?.type === 'boss' ? lvl.spec.bossName : name)}</span>
        </div>`;
    }).join('');

    root.innerHTML = `
      <div class="screen screen--center">
        <section class="panel chapter">
          <header class="chapter__head">
            <button class="btn btn--ghost btn--sm" data-action="home">${icon('map', 16)} Bản đồ</button>
            <img class="chapter__art" src="${assetUrlByKey(chapter.building)}" alt="" />
            <div class="chapter__info">
              <small>CHẶNG ${chapter.order} · MÙA 1</small>
              <h2>${esc(chapter.title)}</h2>
              <p>${esc(chapter.subtitle)}</p>
            </div>
            <div class="chapter__progress">
              <b>${icon('star', 20, 'c-gold')} ${cs.earned}/${cs.max}</b>
              <small>${cs.done}/${n} level</small>
            </div>
          </header>
          <div class="lpath" style="height:${height}px" data-path>
            <svg class="lpath__svg" viewBox="0 0 ${W} ${height}" preserveAspectRatio="none" aria-hidden="true">
              <path d="${path}" class="lpath__road"/>
              <path d="${path}" class="lpath__dash"/>
            </svg>
            ${nodes}
          </div>
        </section>
      </div>`;

    const screen = $(root, '.screen');
    // scroll so the current level is in view
    requestAnimationFrame(() => {
      const cur = root.querySelector<HTMLElement>('.lnode.is-current');
      cur?.scrollIntoView({ block: 'nearest' });
    });

    if (!introSeen(chapter.id)) {
      markIntroSeen(chapter.id);
      openModal(`
        <div class="intro">
          <img src="${ASSETS.robot.url}" alt="" />
          <div>
            <h2>Chặng ${chapter.order}: ${esc(chapter.title)}</h2>
            <p>${esc(chapter.intro)}</p>
            <button class="btn btn--gold" data-close>Bắt đầu ${icon('chevronRight', 18)}</button>
          </div>
        </div>`, { className: 'modal--intro' });
    }

    return onAction(screen, {
      home: () => go('home'),
      play: (el) => go('level', { levelId: el.dataset.level }),
      locked: () => toast('Hoàn thành level trước để mở khóa', 'lock'),
    });
  },
};
