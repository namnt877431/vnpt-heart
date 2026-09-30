import { CHAPTERS, findLevel, SAMPLE_BY_TYPE } from '../../data/content';
import { GAME_TYPE_INFO, type GameType } from '../../data/game-types';
import { $, esc, onAction } from '../dom';
import { icon } from '../icons';
import type { ScreenModule } from './types';

/**
 * "Kho trò chơi": every mini-game type with a "Chơi thử" button that plays its
 * sample level without saving progress. Useful for demos and content review.
 */
export const gamesScreen: ScreenModule = {
  id: 'games',
  scene: 'Map',
  mount(root, { go }) {
    const types = Object.keys(GAME_TYPE_INFO) as GameType[];
    const chapterOf = (t: GameType) => findLevel(SAMPLE_BY_TYPE[t])?.chapter;

    root.innerHTML = `
      <div class="screen screen--center">
        <section class="panel gallery">
          <header class="panel__ribbon">${icon('gamepad', 26)} KHO TRÒ CHƠI</header>
          <p class="gallery__intro">
            Mỗi vòng chơi là một hình thức khác nhau để tránh cảm giác "làm bài kiểm tra".
            Chơi thử từng loại dưới đây, hoặc vào <b>Bản đồ</b> để chinh phục ${CHAPTERS.length} chặng theo thứ tự.
          </p>
          <div class="gallery__grid">
            ${types.map((t) => {
              const info = GAME_TYPE_INFO[t];
              const ch = chapterOf(t);
              return `
                <article class="gcard gcard--${t}">
                  <span class="gcard__icon">${icon(info.icon, 30)}</span>
                  <h3>${esc(info.name)}</h3>
                  <p>${esc(info.blurb)}</p>
                  ${ch ? `<small>Ví dụ trong chặng ${ch.order}: ${esc(ch.title)}</small>` : ''}
                  <button class="btn btn--blue btn--sm" data-action="try" data-type="${t}">Chơi thử ${icon('chevronRight', 14)}</button>
                </article>`;
            }).join('')}
            <article class="gcard gcard--mystery">
              <span class="gcard__icon">?</span>
              <h3>Mystery Level</h3>
              <p>Ô bí ẩn trên bản đồ: hộp quà, thử thách tốc độ, puzzle, câu hỏi đặc biệt, mini boss hoặc double XP.</p>
              <button class="btn btn--blue btn--sm" data-action="try" data-type="mystery">Thử vận may ${icon('chevronRight', 14)}</button>
            </article>
          </div>
        </section>
      </div>`;

    return onAction($(root, '.screen'), {
      try: (el) => go('level', { sample: el.dataset.type as GameType | 'mystery' }),
    });
  },
};
