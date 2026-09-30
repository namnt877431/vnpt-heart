import { ASSETS } from '../../config/assets';
import { currentChapter, nextLevelIndex, resetProgress } from '../../core/progress';
import { me, monthlyGroups, todayMission } from '../../data/mock';
import { leaderboard, playerStats } from '../../data/selectors';
import { avatar } from '../components/avatar';
import { comingSoon, openModal, toast } from '../components/overlay';
import { progressBar } from '../components/progress';
import { groupRankList, playerRankList } from '../components/rank-list';
import { $, $$, esc, fmt, onAction } from '../dom';
import { icon } from '../icons';
import { watchSafeArea } from '../safe-area';
import type { ScreenModule } from './types';

const DOCK = [
  { action: 'badges', label: 'Bảng thành tích', icon: 'trophy' },
  { action: 'share', label: 'Chia sẻ tình huống', icon: 'chat' },
  { action: 'guide', label: 'Hướng dẫn', icon: 'book' },
  { action: 'settings', label: 'Cài đặt', icon: 'gear' },
];

/** Home: world map (Phaser, behind) framed by profile, leaderboards, mission and dock. */
export const homeScreen: ScreenModule = {
  id: 'home',
  scene: 'Map',
  mount(root, { go }) {
    const stats = playerStats();
    const chapter = currentChapter();
    const nextLevel = chapter.levels[nextLevelIndex(chapter)];

    root.innerHTML = `
      <div class="home">
        <aside class="home__left">
          <section class="panel profile-card">
            <div class="profile-card__head">
              ${avatar(me.name, 60)}
              <div>
                <strong>${esc(me.name)}</strong>
                <small>${esc(me.role)}</small>
              </div>
            </div>
            <div class="profile-card__level">
              <span class="level-tag">Lv.${String(stats.level).padStart(2, '0')}</span>
              <small>${stats.xpInLevel} / ${stats.xpNext} XP</small>
            </div>
            ${progressBar(stats.xpInLevel, stats.xpNext, 'xp')}
            <div class="profile-card__stars">${icon('star', 30, 'c-gold')}<b>${fmt(stats.points)}</b><span class="season-chip">Mùa 1</span></div>
            <button class="btn btn--blue btn--sm btn--block" data-action="profile">Xem chi tiết ${icon('chevronRight', 16)}</button>
          </section>
          <p class="slogan">Cùng VNPT<br/>kiến tạo công nghệ<br/>vì cộng đồng ${icon('heart', 18)}</p>
          <div class="mascot">
            <div class="speech speech--left">Cùng nhau<br/>vượt ải nhé!</div>
            <img src="${ASSETS.robot.url}" alt="" draggable="false" />
          </div>
        </aside>

        <header class="home__title">
          <h1 class="game-logo">VNPT <span>HE${icon('heart', 44, 'game-logo__heart')}RT</span></h1>
          <div class="ribbon">HÀNH TRÌNH VĂN HÓA VNPT ĐẮK LẮK</div>
        </header>

        <div class="home__map" data-safe-area></div>

        <aside class="home__right">
          <section class="panel lb-card">
            <header class="lb-card__head">
              ${icon('trophy', 26, 'c-gold')}<h2>BXH TUẦN</h2>
              <button class="link" data-action="leaderboard">Xem tất cả ${icon('chevronRight', 14)}</button>
            </header>
            <div class="seg" role="tablist">
              <button class="seg__btn is-active" data-action="lb-tab" data-tab="players">Cá nhân</button>
              <button class="seg__btn" data-action="lb-tab" data-tab="groups">Nhóm</button>
            </div>
            <div class="lb-card__list" data-list="players">${playerRankList(leaderboard('week').slice(0, 5), me.id)}</div>
            <div class="lb-card__list" data-list="groups" hidden>${groupRankList(monthlyGroups, me.groupId)}</div>
          </section>
          <section class="panel lb-card">
            <header class="lb-card__head">
              ${icon('trophy', 26, 'c-gold')}<h2>BXH NHÓM <small>(Tháng)</small></h2>
              <button class="link" data-action="group">Xem tất cả ${icon('chevronRight', 14)}</button>
            </header>
            <div class="lb-card__cols"><span>Nhóm</span><span>Điểm TB</span></div>
            ${groupRankList(monthlyGroups, me.groupId)}
          </section>
        </aside>

        <footer class="home__bottom">
          <button class="panel mission" data-action="mission">
            <span class="mission__icon">${icon('gift', 30)}</span>
            <span class="mission__body">
              <strong>Nhiệm vụ hôm nay</strong>
              <small>${esc(todayMission.title)}</small>
              <span class="mission__progress">${progressBar(todayMission.progress, todayMission.target, 'gold')}<b>${todayMission.progress}/${todayMission.target}</b></span>
            </span>
            ${icon('chevronRight', 22)}
          </button>

          <button class="btn btn--gold btn--xl start-btn" data-action="start">
            ${icon('gamepad', 30)} BẮT ĐẦU CHƠI ${icon('chevronRight', 24)}
          </button>

          <nav class="dock" aria-label="Tiện ích">
            ${DOCK.map((d) => `
              <button class="dock__item" data-action="${d.action}">
                <span class="dock__bubble">${icon(d.icon, 30)}</span>
                <span>${esc(d.label)}</span>
              </button>`).join('')}
          </nav>
        </footer>

      </div>
    `;

    const home = $(root, '.home');
    const stopSafe = watchSafeArea($(home, '.home__map'));
    const stopActions = onAction(home, {
      start: () => go('level', { levelId: nextLevel.id }),
      leaderboard: () => go('leaderboard'),
      group: () => go('group'),
      badges: () => go('badges'),
      profile: () => comingSoon('Hồ sơ chi tiết'),
      mission: () => comingSoon('Chi tiết nhiệm vụ'),
      share: () => go('share'),
      settings: () => openModal(SETTINGS_HTML, {
        title: 'CÀI ĐẶT',
        onMount: (el, close) => el.querySelector('[data-reset]')?.addEventListener('click', () => {
          resetProgress();
          close();
          go('home');
          toast('Đã đặt lại tiến độ demo', 'gear');
        }),
      }),
      guide: () => openModal(GUIDE_HTML, { title: 'HƯỚNG DẪN', className: 'modal--guide' }),
      'lb-tab': (el) => {
        const tab = el.dataset.tab!;
        $$(home, '[data-action="lb-tab"]').forEach((b) => b.classList.toggle('is-active', b === el));
        $$(home, '[data-list]').forEach((l) => (l.hidden = l.dataset.list !== tab));
      },
    });

    return () => {
      stopActions();
      stopSafe();
    };
  },
};

const GUIDE_HTML = `
  <ol class="guide-list">
    <li>${icon('map', 22)}<span><b>Bản đồ → Chặng → Level.</b> Mỗi hòn đảo là một chặng nội dung; mỗi chặng gồm nhiều level, hoàn thành level trước để mở level sau.</span></li>
    <li>${icon('gamepad', 22)}<span><b>Mỗi level một trò chơi khác nhau:</b> Nếu là bạn?, Soi lỗi, Chọn cách nói, Ghép đúng, Sắp xếp, Time Attack, Tìm mối nguy, Điều tra sự cố, Escape Room…</span></li>
    <li>${icon('star', 22)}<span><b>Sao:</b> ⭐ hoàn thành · ⭐⭐ hoàn thành tốt · ⭐⭐⭐ nhanh và chính xác. Chơi lại để cải thiện.</span></li>
    <li>${icon('book', 22)}<span><b>Xem giải thích</b> sau mỗi level để ghi nhớ kiến thức.</span></li>
    <li>${icon('target', 22)}<span><b>Boss Challenge</b> cuối mỗi chặng: trả lời đúng để giành lượt bắn, chỉnh góc và lực để hạ Boss.</span></li>
    <li>${icon('users', 22)}<span><b>Thi đua:</b> BXH tuần, tháng, toàn mùa; điểm nhóm tính theo điểm trung bình, tỷ lệ tham gia và thành tích trong kỳ.</span></li>
  </ol>`;

const SETTINGS_HTML = `
  <div class="settings">
    <p>${icon('gear', 18)} Âm thanh, nhạc nền: sẽ có ở phiên bản sau.</p>
    <p>${icon('shield', 18)} Bản demo lưu tiến độ ngay trên trình duyệt này.</p>
    <button class="btn btn--ghost" data-reset>${icon('x', 18)} Đặt lại tiến độ demo</button>
  </div>`;
