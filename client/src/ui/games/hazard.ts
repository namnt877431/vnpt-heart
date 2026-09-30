import type { HazardSpec } from '../../data/game-types';
import { $, esc } from '../dom';
import { icon } from '../icons';
import { HAZARD_SCENES } from './hazard-scenes';
import type { GameModule } from './types';

/** "Tìm mối nguy" / "5S Detective": click hotspots on a picture. 3 misclicks cancel one find. */
export const hazardGame: GameModule<HazardSpec> = {
  type: 'hazard',
  mount(root, spec, api) {
    const found = new Set<string>();
    let misses = 0;

    root.innerHTML = `
      <section class="panel game game--hazard">
        <div class="spot-hud">
          <span>${icon('shield', 20)} Mối nguy: <b data-found>0</b>/${spec.hazards.length}</span>
          <span class="spot-hud__miss">${icon('x', 18)} Bấm nhầm: <b data-miss>0</b></span>
          <button class="btn btn--gold btn--sm" data-submit>Nộp bài ${icon('check', 16)}</button>
        </div>
        <div class="hazard" data-stage>${HAZARD_SCENES[spec.scene]}<svg class="hazard__marks" viewBox="0 0 800 450" data-marks></svg></div>
        <ul class="hazard__list" data-list></ul>
      </section>`;

    const svg = $(root, '[data-stage] .hazard__svg') as unknown as SVGSVGElement;
    const marks = $(root, '[data-marks]') as unknown as SVGSVGElement;
    const list = $(root, '[data-list]');

    const result = () => ({
      correct: Math.max(0, found.size - Math.floor(misses / 3)),
      total: spec.hazards.length,
      notes: spec.hazards.map((h) => ({ ok: found.has(h.id), text: `${h.label}: ${h.explain}` })),
    });

    const mark = (x: number, y: number, r: number, cls: string) =>
      marks.insertAdjacentHTML('beforeend', `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}"/>`);

    const reveal = () => spec.hazards.forEach((h) => !found.has(h.id) && mark(h.x, h.y, h.r, 'mark mark--missed'));

    const onClick = (e: MouseEvent) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
      const hit = spec.hazards.find((h) => !found.has(h.id) && Math.hypot(h.x - p.x, h.y - p.y) <= h.r);
      if (hit) {
        found.add(hit.id);
        mark(hit.x, hit.y, hit.r, 'mark mark--found');
        list.insertAdjacentHTML('beforeend', `<li>${icon('check', 16)}<b>${esc(hit.label)}</b> – ${esc(hit.explain)}</li>`);
        $(root, '[data-found]').textContent = String(found.size);
        api.robot(`Phát hiện: ${hit.label}!`, 'happy');
        if (found.size === spec.hazards.length) window.setTimeout(() => api.finish(result()), 900);
      } else if (!spec.hazards.some((h) => Math.hypot(h.x - p.x, h.y - p.y) <= h.r)) {
        misses++;
        mark(p.x, p.y, 10, 'mark mark--miss');
        $(root, '[data-miss]').textContent = String(misses);
        api.robot('Chỗ này an toàn. Quan sát kỹ sàn nhà, ổ điện, lối đi…', 'think');
      }
    };
    const stage = $(root, '[data-stage]');
    stage.addEventListener('click', onClick);
    const submit = $(root, '[data-submit]');
    const onSubmit = () => {
      reveal();
      window.setTimeout(() => api.finish(result()), 900);
    };
    submit.addEventListener('click', onSubmit);

    return {
      destroy: () => {
        stage.removeEventListener('click', onClick);
        submit.removeEventListener('click', onSubmit);
      },
      timeout: () => (reveal(), result()),
    };
  },
};
