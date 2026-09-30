import { me, myGroup } from '../../data/mock';
import { comingSoon } from '../components/overlay';
import { progressBar } from '../components/progress';
import { playerRankList } from '../components/rank-list';
import { $, esc, fmt, onAction } from '../dom';
import { icon } from '../icons';
import type { ScreenModule } from './types';

const CHALLENGES = [
  { title: 'Cả nhóm vượt Ải 01', reward: 200, progress: 18, target: 24, icon: 'flag' },
  { title: 'Tổng 5.000 sao trong tuần', reward: 150, progress: 3420, target: 5000, icon: 'star' },
];

/** The player's group: stats, weekly goal, member ranking and group challenges. */
export const groupScreen: ScreenModule = {
  id: 'group',
  scene: 'Map',
  mount(root, { go }) {
    const g = myGroup;

    root.innerHTML = `
      <div class="screen screen--center">
        <section class="panel group">
          <header class="panel__ribbon">${icon('users', 26)} NHÓM CỦA TÔI</header>
          <div class="group__grid">
            <div class="group__card">
              <div class="group__emblem">${icon('users', 44)}</div>
              <h2>${esc(g.name)}</h2>
              <p>Trưởng nhóm: <b>${esc(g.leader)}</b></p>
              <dl class="stats">
                <div><dt>Hạng tháng</dt><dd>#${g.rank}</dd></div>
                <div><dt>Điểm TB</dt><dd>${fmt(g.avgScore)}</dd></div>
                <div><dt>Thành viên</dt><dd>${g.members}</dd></div>
              </dl>
              <div class="goal">
                <small>Mục tiêu tuần: ${g.weeklyGoal.progress}/${g.weeklyGoal.target} ${esc(g.weeklyGoal.label)}</small>
                ${progressBar(g.weeklyGoal.progress, g.weeklyGoal.target, 'gold')}
              </div>
            </div>

            <div class="group__members">
              <h3>Thành viên nổi bật</h3>
              ${playerRankList(g.roster, me.id, { showRole: true })}
            </div>

            <div class="group__challenges">
              <h3>Thử thách nhóm</h3>
              ${CHALLENGES.map((c) => `
                <button class="challenge" data-action="challenge">
                  <span class="challenge__icon">${icon(c.icon, 26)}</span>
                  <span class="challenge__body">
                    <strong>${esc(c.title)}</strong>
                    ${progressBar(c.progress, c.target, 'xp')}
                    <small>${fmt(c.progress)} / ${fmt(c.target)}</small>
                  </span>
                  <span class="challenge__reward">+${c.reward}${icon('star', 16, 'c-gold')}</span>
                </button>`).join('')}
            </div>
          </div>
          <button class="btn btn--ghost btn--sm board__back" data-action="back">${icon('chevronLeft', 16)} Bản đồ</button>
        </section>
      </div>
    `;

    return onAction($(root, '.screen'), {
      back: () => go('home'),
      challenge: () => comingSoon('Chi tiết thử thách nhóm'),
    });
  },
};
