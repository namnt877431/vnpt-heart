import type { AdminStory, StoryStatus } from '../../../../shared/api-types';
import { api, apiGet } from '../../data/api';
import { LOADING_HTML } from '../../ui/components/async';
import { esc, onAction } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { fmtDateTime, pageHead, run, type AdminView } from '../ui';

export const STORY_STATUS: Record<StoryStatus, string> = {
  new: 'Mới gửi',
  editing: 'Đang biên tập',
  approved: 'Đã duyệt',
  rejected: 'Không dùng',
  used: 'Đã thành level',
};

const FIELDS: { key: keyof AdminStory; label: string }[] = [
  { key: 'situation', label: 'Tình huống' },
  { key: 'problem', label: 'Vấn đề' },
  { key: 'handling', label: 'Cách xử lý' },
  { key: 'difficulty', label: 'Khó khăn' },
  { key: 'outcome', label: 'Kết quả' },
  { key: 'lesson', label: 'Bài học' },
];

/**
 * Stories sent from the game: Thu thập → Biên tập → Ẩn thông tin nhạy cảm →
 * Kịch bản → Game. Editors note what to anonymise and turn good ones into levels.
 */
export const storiesView: AdminView = (root, ctx) => {
  let filter: StoryStatus | '' = 'new';
  let list: AdminStory[] = [];

  const render = () => {
    root.innerHTML = `
      ${pageHead('Tình huống chia sẻ', '', 'Trước khi đưa vào game: <b>ẩn tên người, khách hàng, số điện thoại, địa chỉ</b> và mọi thông tin nhạy cảm.')}
      <div class="seg adm-seg">
        ${(['new', 'editing', 'approved', 'used', 'rejected', ''] as const)
          .map((s) => `<button class="seg__btn ${filter === s ? 'is-active' : ''}" data-action="filter" data-status="${s}">${s ? STORY_STATUS[s] : 'Tất cả'}</button>`)
          .join('')}
      </div>
      ${list.length ? '' : '<p class="adm-muted adm-empty">Không có tình huống nào.</p>'}
      ${list
        .map(
          (s) => `
        <article class="adm-card adm-story" data-id="${s.id}">
          <header class="adm-card__head">
            <div><h2>#${s.id} · ${esc(s.unit || 'Không rõ đơn vị')}</h2>
              <p>${esc(fmtDateTime(s.createdAt))} · ${s.anonymous ? 'Ẩn danh' : esc(s.author ?? '')}${s.levelId ? ` · Level <a href="#/level/${esc(s.levelId)}">${esc(s.levelId)}</a>` : ''}</p></div>
            <span class="adm-chip">${STORY_STATUS[s.status]}</span>
          </header>
          <dl class="adm-dl">${FIELDS.filter((f) => s[f.key]).map((f) => `<dt>${f.label}</dt><dd>${esc(s[f.key])}</dd>`).join('')}</dl>
          <div class="f-row">
            <label class="f-field"><span>Trạng thái</span><select data-status>${(Object.keys(STORY_STATUS) as StoryStatus[])
              .map((k) => `<option value="${k}" ${k === s.status ? 'selected' : ''}>${STORY_STATUS[k]}</option>`)
              .join('')}</select></label>
          </div>
          <label class="f-field"><span>Ghi chú biên tập</span><textarea rows="2" data-note>${esc(s.editorNote)}</textarea></label>
          <div class="adm-head__actions">
            <button class="btn btn--ghost btn--sm" data-action="save" data-id="${s.id}">${icon('check', 14)} Lưu</button>
            <button class="btn btn--blue btn--sm" data-action="to-level" data-id="${s.id}">${icon('gamepad', 14)} Tạo level từ tình huống</button>
          </div>
        </article>`,
        )
        .join('')}`;
  };

  const load = async () => {
    root.innerHTML = LOADING_HTML;
    const data = await run(() => apiGet<AdminStory[]>(`/admin/stories${filter ? `?status=${filter}` : ''}`));
    if (data) {
      list = data;
      render();
    }
  };
  void load();

  return onAction(root, {
    filter: (el) => {
      filter = el.dataset.status as StoryStatus | '';
      void load();
    },
    save: async (el) => {
      const card = root.querySelector<HTMLElement>(`.adm-story[data-id="${el.dataset.id}"]`)!;
      const body = {
        status: card.querySelector<HTMLSelectElement>('[data-status]')!.value,
        editorNote: card.querySelector<HTMLTextAreaElement>('[data-note]')!.value,
      };
      if (await run(() => api('PATCH', `/admin/stories/${el.dataset.id}`, body), 'Đã lưu')) void load();
    },
    'to-level': (el) => ctx.go(`#/level/new?chapter=thuc-chien&story=${el.dataset.id}`),
  });
};
