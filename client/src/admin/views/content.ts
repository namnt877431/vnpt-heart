import type { AdminChapter } from '../../../../shared/api-types';
import { api, apiGet, apiPost } from '../../data/api';
import { GAME_TYPE_INFO } from '../../data/game-types';
import { LOADING_HTML } from '../../ui/components/async';
import { esc, onAction } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { field, formDialog, pageHead, run, statusChip, type AdminView } from '../ui';

const KIND_LABEL = { normal: '', mystery: 'Bí ẩn', boss: 'Boss' } as const;

/** Chapters → levels tree: status, order, quick links to the level editor. */
export const contentView: AdminView = (root, ctx) => {
  let chapters: AdminChapter[] = [];
  let showArchived = false;

  const render = () => {
    root.innerHTML = `
      ${pageHead(
        'Nội dung',
        `<label class="adm-check"><input type="checkbox" data-archived ${showArchived ? 'checked' : ''}/> Hiện level lưu trữ</label>`,
        'Mỗi chặng là một hòn đảo trên bản đồ. Level <b>Nháp</b> chỉ BTC thấy; <b>Đăng</b> để người chơi thấy (có thể hẹn giờ mở).',
      )}
      ${chapters
        .map((c) => {
          const levels = c.levels.filter((l) => showArchived || l.status !== 'archived');
          return `
          <section class="adm-card">
            <header class="adm-card__head">
              <div>
                <h2>Chặng ${c.order}: ${esc(c.title)}</h2>
                <p>${esc(c.subtitle)}</p>
              </div>
              <div class="adm-head__actions">
                <button class="btn btn--ghost btn--sm" data-action="edit-chapter" data-id="${esc(c.id)}">${icon('pencil', 14)} Sửa chặng</button>
                <button class="btn btn--blue btn--sm" data-action="new-level" data-id="${esc(c.id)}">${icon('plusHeart', 14)} Thêm level</button>
              </div>
            </header>
            ${levels.length ? `
            <table class="adm-table">
              <thead><tr><th>#</th><th>Level</th><th>Dạng</th><th>Trạng thái</th><th>Sửa lần cuối</th><th></th></tr></thead>
              <tbody>
                ${levels
                  .map((l, i) => `
                  <tr>
                    <td class="adm-num">${i + 1}</td>
                    <td><a href="#/level/${esc(l.id)}"><b>${esc(l.title)}</b></a><br/><small class="adm-muted">${esc(l.id)}</small></td>
                    <td>${l.type ? esc(GAME_TYPE_INFO[l.type].name) : ''} ${KIND_LABEL[l.kind] ? `<span class="adm-chip adm-chip--kind">${KIND_LABEL[l.kind]}</span>` : ''}</td>
                    <td>${statusChip(l)}</td>
                    <td><small>${esc(new Date(l.updatedAt).toLocaleDateString('vi-VN'))}</small></td>
                    <td class="adm-row-actions">
                      <button class="f-icon" data-action="move" data-chapter="${esc(c.id)}" data-id="${esc(l.id)}" data-dir="-1" ${i === 0 ? 'disabled' : ''} title="Lên">${icon('arrowUp', 14)}</button>
                      <button class="f-icon" data-action="move" data-chapter="${esc(c.id)}" data-id="${esc(l.id)}" data-dir="1" ${i === levels.length - 1 ? 'disabled' : ''} title="Xuống">${icon('arrowDown', 14)}</button>
                      <a class="btn btn--ghost btn--sm" href="#/level/${esc(l.id)}">${icon('pencil', 14)} Sửa</a>
                    </td>
                  </tr>`)
                  .join('')}
              </tbody>
            </table>` : '<p class="adm-muted adm-empty">Chưa có level nào.</p>'}
          </section>`;
        })
        .join('')}`;
  };

  const load = async () => {
    root.innerHTML = LOADING_HTML;
    const data = await run(() => apiGet<AdminChapter[]>('/admin/content'));
    if (data) {
      chapters = data;
      render();
    }
  };
  void load();

  const onChange = (e: Event) => {
    if ((e.target as HTMLElement).matches('[data-archived]')) {
      showArchived = (e.target as HTMLInputElement).checked;
      render();
    }
  };
  root.addEventListener('change', onChange);

  const stop = onAction(root, {
    'new-level': (el) => ctx.go(`#/level/new?chapter=${encodeURIComponent(el.dataset.id!)}`),
    'edit-chapter': async (el) => {
      const c = chapters.find((x) => x.id === el.dataset.id)!;
      const fd = await formDialog(
        `CHẶNG ${c.order}`,
        field('Tên chặng', `<input name="title" value="${esc(c.title)}" maxlength="80" required />`) +
          field('Mô tả ngắn', `<input name="subtitle" value="${esc(c.subtitle)}" maxlength="120" />`) +
          field('Lời robot giới thiệu chặng', `<textarea name="intro" rows="4" maxlength="1000">${esc(c.intro)}</textarea>`) +
          field('Biểu tượng công trình (asset key)', `<input name="building" value="${esc(c.building)}" maxlength="40" />`, 'Giữ nguyên nếu không chắc: bld-heart, bld-rule, bld-5g, bld-safety, bld-process, bld-ai'),
      );
      if (!fd) return;
      const ok = await run(
        () => api('PUT', `/admin/chapters/${encodeURIComponent(c.id)}`, Object.fromEntries(['title', 'subtitle', 'intro', 'building'].map((k) => [k, String(fd.get(k) ?? '')]))),
        'Đã lưu chặng',
      );
      if (ok) void load();
    },
    move: async (el) => {
      const c = chapters.find((x) => x.id === el.dataset.chapter)!;
      // reorder among the rows on screen; hidden (archived) levels go last
      const visible = c.levels.filter((l) => showArchived || l.status !== 'archived').map((l) => l.id);
      const hidden = c.levels.map((l) => l.id).filter((id) => !visible.includes(id));
      const i = visible.indexOf(el.dataset.id!);
      const j = i + Number(el.dataset.dir);
      if (j < 0 || j >= visible.length) return;
      [visible[i], visible[j]] = [visible[j], visible[i]];
      const ids = [...visible, ...hidden];
      const ok = await run(() => apiPost(`/admin/chapters/${encodeURIComponent(c.id)}/order`, { levelIds: ids }));
      if (ok) void load();
    },
  });

  return () => {
    stop();
    root.removeEventListener('change', onChange);
  };
};
