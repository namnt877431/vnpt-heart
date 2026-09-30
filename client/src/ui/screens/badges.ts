import { badges } from '../../data/mock';
import { progressBar } from '../components/progress';
import { $, esc, onAction } from '../dom';
import { icon } from '../icons';
import type { ScreenModule } from './types';

/** Badge collection grid: earned badges glow gold, others show progress. */
export const badgesScreen: ScreenModule = {
  id: 'badges',
  scene: 'Map',
  mount(root, { go }) {
    const earned = badges.filter((b) => b.earned).length;

    root.innerHTML = `
      <div class="screen screen--center">
        <section class="panel badges">
          <header class="panel__ribbon">${icon('medal', 26)} HUY HIỆU</header>
          <p class="badges__summary">Đã đạt <b>${earned}</b> / ${badges.length} huy hiệu</p>
          <div class="badge-grid">
            ${badges.map((b) => `
              <article class="badge ${b.earned ? 'is-earned' : 'is-locked'}" title="${esc(b.description)}">
                <div class="badge__medal">${icon(b.icon, 40)}${b.earned ? '' : `<span class="badge__lock">${icon('lock', 14)}</span>`}</div>
                <strong>${esc(b.name)}</strong>
                <small>${esc(b.description)}</small>
                ${b.earned ? '<span class="badge__done">Đã đạt</span>' : progressBar(b.progress * 100, 100, 'gold')}
              </article>`).join('')}
          </div>
          <button class="btn btn--ghost btn--sm board__back" data-action="back">${icon('chevronLeft', 16)} Bản đồ</button>
        </section>
      </div>
    `;

    return onAction($(root, '.screen'), { back: () => go('home') });
  },
};
