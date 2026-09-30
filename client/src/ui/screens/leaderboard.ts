import { me, monthlyGroups, weeklyPlayers } from '../../data/mock';
import { avatar } from '../components/avatar';
import { groupRankList, playerRankList } from '../components/rank-list';
import { $, $$, esc, fmt, onAction } from '../dom';
import { icon } from '../icons';
import type { RankEntry } from '../../data/types';
import type { ScreenModule } from './types';

const podium = (top: RankEntry[]): string => {
  // visual order: 2nd, 1st, 3rd
  const order = [top[1], top[0], top[2]].filter(Boolean);
  return `<div class="podium">${order
    .map((p) => `
      <div class="podium__slot podium__slot--${p.rank}">
        ${p.rank === 1 ? `<span class="podium__crown">${icon('crown', 34)}</span>` : ''}
        ${avatar(p.name, p.rank === 1 ? 76 : 62)}
        <strong>${esc(p.name)}</strong>
        <span class="podium__score">${icon('star', 16, 'c-gold')}${fmt(p.score)}</span>
        <div class="podium__step">${p.rank}</div>
      </div>`)
    .join('')}</div>`;
};

/** Full leaderboard. Period tabs are visual-only in the MVP (same mock data). */
export const leaderboardScreen: ScreenModule = {
  id: 'leaderboard',
  scene: 'Map',
  mount(root, { go }) {
    const mine = weeklyPlayers.find((p) => p.playerId === me.id);

    root.innerHTML = `
      <div class="screen screen--center">
        <section class="panel board">
          <header class="panel__ribbon">${icon('trophy', 26)} BẢNG XẾP HẠNG</header>
          <div class="board__tabs">
            <div class="seg">
              <button class="seg__btn is-active" data-action="period">Tuần</button>
              <button class="seg__btn" data-action="period">Tháng</button>
              <button class="seg__btn" data-action="period">Toàn thời gian</button>
            </div>
            <div class="seg">
              <button class="seg__btn is-active" data-action="kind" data-kind="players">Cá nhân</button>
              <button class="seg__btn" data-action="kind" data-kind="groups">Nhóm</button>
            </div>
          </div>

          <div data-kind-panel="players">
            ${podium(weeklyPlayers.slice(0, 3))}
            ${playerRankList(weeklyPlayers.slice(3), me.id, { showRole: true })}
          </div>
          <div data-kind-panel="groups" hidden>
            ${groupRankList(monthlyGroups, me.groupId, { showMembers: true })}
          </div>

          ${mine ? `
          <footer class="board__me">
            <span>Hạng của bạn</span>
            <b>#${mine.rank}</b>
            ${avatar(me.name, 36)}
            <strong>${esc(me.name)}</strong>
            <span class="rank-row__score">${icon('star', 16, 'c-gold')}${fmt(mine.score)}</span>
          </footer>` : ''}
          <button class="btn btn--ghost btn--sm board__back" data-action="back">${icon('chevronLeft', 16)} Bản đồ</button>
        </section>
      </div>
    `;

    const screen = $(root, '.screen');
    return onAction(screen, {
      back: () => go('home'),
      period: (el) => $$(el.parentElement!, '.seg__btn').forEach((b) => b.classList.toggle('is-active', b === el)),
      kind: (el) => {
        $$(el.parentElement!, '.seg__btn').forEach((b) => b.classList.toggle('is-active', b === el));
        $$(screen, '[data-kind-panel]').forEach((p) => (p.hidden = p.dataset.kindPanel !== el.dataset.kind));
      },
    });
  },
};
