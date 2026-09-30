import { chapterStars, hasDoubleXp, isLevelUnlocked, recordResult } from '../../core/progress';
import { pointsFor, starsFor, type GameResult } from '../../core/scoring';
import { CHAPTERS, findLevel, SAMPLE_BY_TYPE, type Chapter } from '../../data/content';
import { GAME_TYPE_INFO, type GameSpec } from '../../data/game-types';
import { openModal } from '../components/overlay';
import { robotGuide, setRobot } from '../components/robot';
import { $, esc, fmt, onAction } from '../dom';
import { gameFor } from '../games';
import type { GameHandle } from '../games/types';
import { icon } from '../icons';
import { mountMystery } from './mystery';
import type { ScreenModule, ScreenParams } from './types';

interface Resolved {
  spec?: GameSpec;
  mystery: boolean;
  /** Progress key; absent for gallery samples. */
  levelId?: string;
  chapter?: Chapter;
  index?: number;
}

/** Work out what to play from the route params. */
const resolve = (p: ScreenParams): Resolved => {
  const found = p.levelId ? findLevel(p.levelId) : undefined;
  const base = found ? { levelId: found.level.id, chapter: found.chapter, index: found.index } : {};
  if (p.spec) return { ...base, spec: p.spec, mystery: false };
  if (found) return { ...base, spec: found.level.spec, mystery: found.level.kind === 'mystery' };
  if (p.sample === 'mystery') return { mystery: true };
  if (p.sample) return { spec: findLevel(SAMPLE_BY_TYPE[p.sample])?.level.spec, mystery: false };
  return { mystery: false };
};

const TITLES = ['Chưa đạt', 'Hoàn thành', 'Hoàn thành tốt', 'Xuất sắc!'];
const ROBOT_LINES = [
  'Không sao, xem lại giải thích rồi thử lại nhé. Mình tin bạn làm được!',
  'Bạn đã vượt qua! Chơi lại để lấy thêm sao nhé.',
  'Làm tốt lắm! Chỉ còn chút nữa là 3 sao.',
  'Tuyệt vời! Nhanh và chính xác, đúng chất người VNPT!',
];

const fmtTime = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Hosts one level: header (chapter/level, game type, timer), robot guide,
 * the mini-game module, then the result modal (stars, points, explanations).
 */
export const levelScreen: ScreenModule = {
  id: 'level',
  scene: (p) => (resolve(p).spec?.type === 'boss' ? 'BossFight' : 'Map'),
  mount(root, { go, params }) {
    const r = resolve(params);
    const back = () => (r.chapter ? go('chapter', { chapterId: r.chapter.id }) : go('games'));

    if (!r.spec && !r.mystery) {
      root.innerHTML = `<div class="screen screen--center"><section class="panel empty"><p>Không tìm thấy level.</p></section></div>`;
      return () => undefined;
    }

    const module = r.spec ? gameFor(r.spec) : null;
    const doubleXp = !!r.levelId && hasDoubleXp();
    const where = r.chapter ? `Chặng ${r.chapter.order} · Level ${r.index! + 1}` : 'Chơi thử';
    const info = r.spec ? GAME_TYPE_INFO[r.spec.type] : { name: 'Mystery Level', icon: 'star' };
    const limit = r.spec?.timeLimitSec;

    if (module?.fullScreen) {
      root.innerHTML = `<div class="level level--full" data-game></div>`;
    } else {
      root.innerHTML = `
        <div class="screen level">
          <header class="level__head panel">
            <button class="btn btn--ghost btn--sm" data-action="back">${icon('chevronLeft', 16)} ${r.chapter ? 'Chặng' : 'Kho trò chơi'}</button>
            <div class="level__title">
              <small>${esc(where)}</small>
              <strong>${esc(r.spec?.title ?? 'Vòng bí ẩn')}</strong>
            </div>
            <span class="chip">${icon(info.icon, 16)} ${esc(info.name)}</span>
            ${doubleXp ? `<span class="chip chip--gold">${icon('bolt', 16)} x2 điểm</span>` : ''}
            ${limit ? `<span class="timer" data-timer>${icon('clock', 18)}<b>${limit}s</b></span>` : ''}
          </header>
          <div class="level__body">
            <aside class="level__robot">${robotGuide(r.spec?.intro ?? 'Vòng bí ẩn! Lật một thẻ để xem điều bất ngờ nhé.')}</aside>
            <div class="level__game" data-game></div>
          </div>
        </div>`;
    }

    const gameRoot = $(root, '[data-game]');
    const robot = (text: string, mood?: Parameters<typeof setRobot>[2]) => setRobot(root, text, mood);
    const started = performance.now();
    let handle: GameHandle | null = null;
    let tick = 0;
    let finished = false;
    let closeResult: (() => void) | null = null;

    const finish = (partial: Omit<GameResult, 'timeMs'>) => {
      if (finished || !r.spec) return;
      finished = true;
      window.clearInterval(tick);
      const result: GameResult = { ...partial, timeMs: performance.now() - started };
      const stars = starsFor(result, r.spec.parTimeSec);
      const points = pointsFor(result, stars, r.spec.parTimeSec, doubleXp);
      const saved = r.levelId ? recordResult(r.levelId, stars, points) : null;
      robot(ROBOT_LINES[stars], stars >= 2 ? 'happy' : stars === 0 ? 'sad' : 'idle');
      closeResult = showResult(result, stars, points, saved?.gained ?? null);
    };

    const showResult = (res: GameResult, stars: number, points: number, gained: number | null) => {
      const next = r.chapter && r.index !== undefined ? r.chapter.levels[r.index + 1] : undefined;
      const canNext = !!next && isLevelUnlocked(r.chapter!, r.index! + 1);
      const chapterDone = r.chapter && !next && stars > 0;
      const nextChapter = chapterDone ? CHAPTERS.find((c) => c.order === r.chapter!.order + 1) : undefined;
      const cs = r.chapter ? chapterStars(r.chapter) : null;

      return openModal(`
        <div class="result">
          <div class="result__stars">${[0, 1, 2].map((i) => `<span class="rstar ${i < stars ? 'is-on' : ''}" style="--d:${i * 0.18}s">${icon('star', 64)}</span>`).join('')}</div>
          <h2 class="result__title">${TITLES[stars]}</h2>
          <dl class="stats">
            <div><dt>Đúng</dt><dd>${res.correct}/${res.total}</dd></div>
            <div><dt>Thời gian</dt><dd>${fmtTime(res.timeMs)}</dd></div>
            <div><dt>Điểm</dt><dd>+${fmt(points)}${doubleXp && points ? ' <small>x2</small>' : ''}</dd></div>
          </dl>
          ${gained !== null ? `<p class="result__saved">${gained > 0 ? `${icon('star', 16, 'c-gold')} +${fmt(gained)} điểm vào tổng thành tích` : 'Chưa vượt kỷ lục cũ của bạn ở level này.'}${cs ? ` · Chặng: ${cs.earned}/${cs.max} ★` : ''}</p>` : '<p class="result__saved">Chế độ chơi thử: kết quả không được lưu.</p>'}
          ${chapterDone ? `<p class="result__chapter">${icon('crown', 20, 'c-gold')} Bạn đã hoàn thành chặng <b>${esc(r.chapter!.title)}</b>!</p>` : ''}
          <details class="result__notes" open>
            <summary>${icon('book', 18)} Xem kiến thức & giải thích</summary>
            <ul>${res.notes.map((n) => `<li class="${n.ok ? 'is-ok' : 'is-bad'}">${icon(n.ok ? 'check' : 'x', 16)}<span>${esc(n.text)}</span></li>`).join('')}</ul>
          </details>
          <div class="result__actions">
            <button class="btn btn--ghost" data-go="replay">${icon('arrowUp', 16)} Chơi lại</button>
            ${canNext ? `<button class="btn btn--gold" data-go="next">Level tiếp theo ${icon('chevronRight', 18)}</button>` : ''}
            ${nextChapter ? `<button class="btn btn--gold" data-go="next-chapter">Chặng tiếp theo ${icon('chevronRight', 18)}</button>` : ''}
            <button class="btn btn--blue" data-go="back">${r.chapter ? 'Về bản đồ chặng' : 'Kho trò chơi'}</button>
          </div>
        </div>`, {
        className: 'modal--result',
        onMount: (el, close) => {
          el.addEventListener('click', (e) => {
            const action = (e.target as HTMLElement).closest<HTMLElement>('[data-go]')?.dataset.go;
            if (!action) return;
            close();
            if (action === 'replay') go('level', params);
            if (action === 'next' && next) go('level', { levelId: next.id });
            if (action === 'next-chapter' && nextChapter) go('chapter', { chapterId: nextChapter.id });
            if (action === 'back') back();
          });
        },
      });
    };

    const stopHead = onAction(root, { back });

    if (r.mystery && !r.spec) {
      const stopMystery = mountMystery(gameRoot, {
        levelId: r.levelId,
        robot: (t) => robot(t, 'happy'),
        onPlay: (spec) => go('level', { ...params, spec }),
        onDone: back,
      });
      return () => {
        stopMystery();
        stopHead();
      };
    }

    handle = module!.mount(gameRoot, r.spec!, { finish, robot, exit: back });

    if (limit) {
      const timerEl = $(root, '[data-timer]');
      tick = window.setInterval(() => {
        const left = Math.max(0, Math.ceil(limit - (performance.now() - started) / 1000));
        timerEl.querySelector('b')!.textContent = `${left}s`;
        timerEl.classList.toggle('is-hurry', left <= 10);
        if (left === 0 && !finished) {
          robot('Hết giờ! Cùng xem kết quả nhé.', 'sad');
          finish(handle?.timeout?.() ?? { correct: 0, total: 1, notes: [], failed: true });
        }
      }, 250);
    }

    return () => {
      window.clearInterval(tick);
      closeResult?.();
      handle?.destroy();
      stopHead();
    };
  },
};
