import { ASSETS } from '../../config/assets';
import { stages } from '../../data/mock';
import { openModal } from '../components/overlay';
import { starRow } from '../components/progress';
import { esc, fmt } from '../dom';
import { icon } from '../icons';
import type { Router } from '../router';

/** Building asset key -> URL, so the modal can show the same art as the island. */
const buildingUrl = (key: string): string =>
  Object.values(ASSETS).find((a) => a.key === key)?.url ?? ASSETS.island.url;

/** Modal opened when an island is clicked on the map (`stage:select`). */
export const openStageDetail = (stageId: number, router: Router): void => {
  const stage = stages.find((s) => s.id === stageId);
  if (!stage) return;
  const locked = stage.status === 'locked';
  const target = stage.mode === 'boss' ? 'boss' : 'play';

  const body = `
    <div class="stage-detail ${locked ? 'is-locked' : ''}">
      <div class="stage-detail__art">
        <img src="${buildingUrl(stage.building)}" alt="" />
        ${locked ? `<span class="stage-detail__lock">${icon('lock', 28)}</span>` : ''}
      </div>
      <div class="stage-detail__info">
        <span class="stage-detail__tag">Ải ${String(stage.id).padStart(2, '0')}</span>
        <h2>${esc(stage.title)}</h2>
        <p class="stage-detail__sub">${esc(stage.subtitle)}</p>
        <p>${esc(stage.description)}</p>
        <div class="stage-detail__stars">${starRow(stage.starsEarned, stage.maxStars)}</div>
        <dl class="stats">
          <div><dt>Câu hỏi</dt><dd>${stage.questionCount}</dd></div>
          <div><dt>Thưởng</dt><dd>+${fmt(stage.rewardXp)} XP</dd></div>
          <div><dt>Chế độ</dt><dd>${stage.mode === 'boss' ? 'Bắn Boss' : 'Trắc nghiệm'}</dd></div>
        </dl>
        ${locked ? `<p class="stage-detail__hint">${icon('lock', 16)} Hoàn thành ải trước để mở khóa.</p>` : ''}
        <div class="stage-detail__actions">
          ${locked
            ? `<button class="btn btn--blue" data-go>${icon('gamepad', 20)} Xem trước (demo)</button>`
            : `<button class="btn btn--gold" data-go>${icon('gamepad', 20)} Vào ải</button>`}
          <button class="btn btn--ghost" data-close>Để sau</button>
        </div>
      </div>
    </div>`;

  openModal(body, {
    className: 'modal--stage',
    onMount: (el, close) => {
      el.querySelector('[data-go]')?.addEventListener('click', () => {
        close();
        router.go(target, { stageId: stage.id });
      });
    },
  });
};
