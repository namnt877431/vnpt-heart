import { me, monthlyGroups } from '../../data/mock';
import { honorList, leaderboard } from '../../data/selectors';
import type { RankEntry, RankPeriod } from '../../data/types';
import { avatar } from '../components/avatar';
import { groupRankList, playerRankList } from '../components/rank-list';
import { $, $$, esc, fmt, onAction } from '../dom';
import { icon } from '../icons';
import type { ScreenModule } from './types';

const PERIODS: { id: RankPeriod; label: string; question: string }[] = [
  { id: 'week', label: 'Tuần', question: 'Ai đang có thành tích tốt nhất trong tuần?' },
  { id: 'month', label: 'Tháng', question: 'Ai đang dẫn đầu thành tích tháng?' },
  { id: 'season', label: 'Toàn mùa', question: 'Ai có hành trình chinh phục tốt nhất?' },
];

const podium = (top: RankEntry[]): string => {
  // visual order: 2nd, 1st, 3rd
  const order = [top[1], top[0], top[2]].filter(Boolean);
  return `<div class="podium">${order
    .map((p) => `
      <div class="podium__slot podium__slot--${p.rank} ${p.playerId === me.id ? 'is-me' : ''}">
        ${p.rank === 1 ? `<span class="podium__crown">${icon('crown', 34)}</span>` : ''}
        ${avatar(p.name, p.rank === 1 ? 76 : 62)}
        <strong>${esc(p.name)}</strong>
        <span class="podium__score">${icon('star', 16, 'c-gold')}${fmt(p.score)}</span>
        <div class="podium__step">${p.rank}</div>
      </div>`)
    .join('')}</div>`;
};

const playersPanel = (period: RankPeriod): string => {
  const list = leaderboard(period);
  const mine = list.find((p) => p.playerId === me.id);
  return `
    <p class="board__q">${esc(PERIODS.find((p) => p.id === period)!.question)}</p>
    ${podium(list.slice(0, 3))}
    ${playerRankList(list.slice(3), me.id, { showRole: true })}
    ${mine ? `
    <footer class="board__me">
      <span>Hạng của bạn</span><b>#${mine.rank}</b>${avatar(me.name, 36)}
      <strong>${esc(me.name)}</strong>
      <span class="rank-row__score">${icon('star', 16, 'c-gold')}${fmt(mine.score)}</span>
    </footer>` : ''}`;
};

/** Personal (week / month / season) and group leaderboards, plus honours. */
export const leaderboardScreen: ScreenModule = {
  id: 'leaderboard',
  scene: 'Map',
  mount(root, { go }) {
    let period: RankPeriod = 'week';

    root.innerHTML = `
      <div class="screen screen--center">
        <section class="panel board">
          <header class="panel__ribbon">${icon('trophy', 26)} BẢNG XẾP HẠNG</header>
          <div class="board__tabs">
            <div class="seg">${PERIODS.map((p, i) => `<button class="seg__btn ${i === 0 ? 'is-active' : ''}" data-action="period" data-period="${p.id}">${p.label}</button>`).join('')}</div>
            <div class="seg">
              <button class="seg__btn is-active" data-action="kind" data-kind="players">Cá nhân</button>
              <button class="seg__btn" data-action="kind" data-kind="groups">Nhóm</button>
              <button class="seg__btn" data-action="kind" data-kind="honors">Vinh danh</button>
            </div>
          </div>

          <div data-kind-panel="players">${playersPanel(period)}</div>
          <div data-kind-panel="groups" hidden>
            <p class="board__q">Điểm nhóm = <b>điểm trung bình thành viên</b> + <b>tỷ lệ tham gia</b> + <b>thành tích trong kỳ</b>, để cả nhóm cùng tham gia chứ không chỉ vài người giỏi.</p>
            ${groupRankList(monthlyGroups, me.groupId, { showMembers: true })}
            <div class="group-metrics">
              <div class="group-metrics__head"><span>Nhóm</span><span>Điểm TB</span><span>Tham gia</span><span>Thành tích kỳ</span></div>
              ${monthlyGroups.map((g) => `<div class="${g.groupId === me.groupId ? 'is-me' : ''}"><span>${esc(g.name)}</span><span>${fmt(g.avgScore)}</span><span>${g.participation}%</span><span>+${fmt(g.periodBonus)}</span></div>`).join('')}
            </div>
          </div>
          <div data-kind-panel="honors" hidden>
            <p class="board__q">Ngoài điểm số, BXH còn ghi nhận những người chơi nổi bật trong kỳ.</p>
            <div class="honors">
              ${honorList().map((h) => `
                <article class="honor ${h.playerId === me.id ? 'is-me' : ''}">
                  <span class="honor__icon">${icon(h.icon, 28)}</span>
                  <small>${esc(h.title)}</small>
                  ${avatar(h.name, 52)}
                  <strong>${esc(h.name)}</strong>
                  <span>${esc(h.value)}</span>
                </article>`).join('')}
            </div>
          </div>
          <button class="btn btn--ghost btn--sm board__back" data-action="back">${icon('chevronLeft', 16)} Bản đồ</button>
        </section>
      </div>
    `;

    const screen = $(root, '.screen');
    return onAction(screen, {
      back: () => go('home'),
      period: (el) => {
        period = el.dataset.period as RankPeriod;
        $$(el.parentElement!, '.seg__btn').forEach((b) => b.classList.toggle('is-active', b === el));
        $(screen, '[data-kind-panel="players"]').innerHTML = playersPanel(period);
      },
      kind: (el) => {
        $$(el.parentElement!, '.seg__btn').forEach((b) => b.classList.toggle('is-active', b === el));
        $$(screen, '[data-kind-panel]').forEach((p) => (p.hidden = p.dataset.kindPanel !== el.dataset.kind));
      },
    });
  },
};
