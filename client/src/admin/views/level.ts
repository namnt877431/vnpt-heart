import type { AdminChapter, AdminLevel, LevelRevision } from '../../../../shared/api-types';
import type { LevelKind } from '../../../../shared/content-types';
import { api, apiGet, apiPost } from '../../data/api';
import { GAME_TYPE_INFO, type GameSpec, type GameType } from '../../data/game-types';
import { LOADING_HTML } from '../../ui/components/async';
import { openModal, toast } from '../../ui/components/overlay';
import { esc, onAction } from '../../ui/dom';
import { HAZARD_SCENES } from '../../ui/games/hazard-scenes';
import { icon } from '../../ui/icons';
import { bindForm, renderFields } from '../forms/engine';
import { fromFormDraft, newSpec, SPEC_FIELDS, toFormDraft } from '../forms/specs';
import { confirmDialog, fmtDateTime, pageHead, run, statusChip, type AdminView } from '../ui';

const NORMAL_TYPES = (Object.keys(GAME_TYPE_INFO) as GameType[]).filter((t) => t !== 'boss');

/** Prefill from a shared story ("Tạo level từ tình huống"). */
const fromStory = (s: { situation: string; handling: string; lesson: string }): GameSpec => ({
  type: 'choice',
  title: 'Tình huống thực tế',
  intro: 'Một tình huống có thật do đồng nghiệp chia sẻ. Bạn sẽ xử lý thế nào?',
  questions: [{ text: s.situation, options: [s.handling || 'Cách xử lý đúng', '', ''], correct: 0, explain: s.lesson }],
});

/**
 * Level editor: kind + game type, generated form (or raw JSON), save,
 * play-test, publish / schedule / unpublish, history.
 */
export const levelView: AdminView = (root, ctx, params) => {
  const isNew = params.id === 'new';
  let level: AdminLevel | null = null;
  let chapters: AdminChapter[] = [];
  let chapterId = params.get('chapter') ?? '';
  let kind: LevelKind = 'normal';
  let draft: Record<string, unknown> = toFormDraft(newSpec('choice'));
  let jsonMode = false;
  let dirty = false;
  let unbind: (() => void) | null = null;
  const storyId = params.get('story');

  const type = (): GameType | null => (kind === 'mystery' ? null : (draft.type as GameType));

  const markDirty = () => {
    dirty = true;
    root.querySelector('[data-action="save"]')?.classList.add('is-dirty');
  };

  const formHtml = () => {
    if (kind === 'mystery') return '<p class="adm-muted">Level bí ẩn không cần nội dung: khi mở, người chơi lật thẻ và nhận quà hoặc một thử thách ngẫu nhiên lấy từ các level đã đăng.</p>';
    if (jsonMode) {
      return `<label class="f-field"><span>Nội dung dạng JSON</span><textarea class="f-mono" rows="28" data-json>${esc(JSON.stringify(fromFormDraft(draft), null, 2))}</textarea>
        <small class="f-hint">Dành cho người rành kỹ thuật. Bấm "Về form" để kiểm tra và quay lại form.</small></label>`;
    }
    return renderFields(SPEC_FIELDS[type()!], draft, '', { hazardScene: HAZARD_SCENES.workplace });
  };

  const renderForm = () => {
    unbind?.();
    const box = root.querySelector<HTMLElement>('[data-form]')!;
    const scroll = window.scrollY;
    box.innerHTML = formHtml();
    if (!jsonMode && kind !== 'mystery') unbind = bindForm(box, SPEC_FIELDS[type()!], draft, renderForm, markDirty);
    window.scrollTo({ top: scroll });
  };

  const render = () => {
    const chapter = chapters.find((c) => c.id === chapterId);
    const locked = level?.locked ?? false;
    root.innerHTML = `
      ${pageHead(
        isNew ? 'Level mới' : level!.title,
        `<a class="btn btn--ghost btn--sm" href="#/content">${icon('chevronLeft', 14)} Nội dung</a>`,
        isNew ? 'Lưu để tạo level (ở trạng thái Nháp).' : `${esc(level!.id)} · ${statusChip(level!)}${level!.locked ? ' · <small>đã phát hành: không đổi chặng/mã được</small>' : ''}`,
      )}
      <div class="adm-editor">
        <section class="adm-card adm-editor__main">
          <div class="f-row">
            <label class="f-field"><span>Chặng</span>
              <select data-chapter ${locked ? 'disabled' : ''}>${chapters.map((c) => `<option value="${esc(c.id)}" ${c.id === chapterId ? 'selected' : ''}>Chặng ${c.order}: ${esc(c.title)}</option>`).join('')}</select>
            </label>
            <label class="f-field"><span>Loại level</span>
              <select data-kind>
                <option value="normal" ${kind === 'normal' ? 'selected' : ''}>Thường</option>
                <option value="mystery" ${kind === 'mystery' ? 'selected' : ''}>Bí ẩn (Mystery)</option>
                <option value="boss" ${kind === 'boss' ? 'selected' : ''}>Boss cuối chặng</option>
              </select>
            </label>
            ${kind === 'normal' ? `
            <label class="f-field"><span>Dạng trò chơi</span>
              <select data-type>${NORMAL_TYPES.map((t) => `<option value="${t}" ${t === type() ? 'selected' : ''}>${esc(GAME_TYPE_INFO[t].name)}</option>`).join('')}</select>
            </label>` : ''}
          </div>
          ${type() ? `<p class="adm-muted adm-type-blurb">${icon(GAME_TYPE_INFO[type()!].icon, 16)} ${esc(GAME_TYPE_INFO[type()!].blurb)}</p>` : ''}
          ${kind !== 'mystery' ? `<div class="adm-toolbar"><button class="btn btn--ghost btn--sm" data-action="json">${jsonMode ? 'Về form' : '{ } Chế độ JSON'}</button></div>` : ''}
          <div data-form></div>
        </section>
        <aside class="adm-card adm-editor__side">
          <h3>Thao tác</h3>
          <button class="btn btn--gold btn--block" data-action="save">${icon('check', 18)} ${isNew ? 'Tạo level' : 'Lưu thay đổi'}</button>
          ${!isNew ? `
            ${kind !== 'mystery' ? `<button class="btn btn--blue btn--block" data-action="preview">${icon('gamepad', 18)} Chơi thử</button>` : ''}
            <hr/>
            ${level!.status !== 'published' || (level!.publishAt && new Date(level!.publishAt) > new Date())
              ? `<button class="btn btn--blue btn--block" data-action="publish">${icon('flag', 16)} Đăng ngay</button>` : ''}
            <label class="f-field"><span>Hẹn giờ mở</span><input type="datetime-local" data-at /></label>
            <button class="btn btn--ghost btn--block" data-action="schedule">${icon('clock', 16)} Hẹn giờ đăng</button>
            ${level!.status === 'published' ? `<button class="btn btn--ghost btn--block" data-action="unpublish">${icon('lock', 16)} Gỡ xuống (về Nháp)</button>` : ''}
            <hr/>
            <button class="btn btn--ghost btn--block" data-action="history">${icon('clock', 16)} Lịch sử chỉnh sửa</button>
            ${level!.status !== 'archived' ? `<button class="btn btn--ghost btn--block adm-danger-text" data-action="delete">${icon('x', 16)} ${locked ? 'Lưu trữ (ẩn)' : 'Xóa level'}</button>` : ''}
          ` : ''}
          ${chapter && !isNew && level!.status === 'published' ? '<p class="adm-note">Level đang hiện: thay đổi sẽ áp dụng ngay khi lưu.</p>' : ''}
        </aside>
      </div>`;
    renderForm();
  };

  const currentSpec = (): GameSpec | null => {
    if (kind === 'mystery') return null;
    if (jsonMode) {
      const text = root.querySelector<HTMLTextAreaElement>('[data-json]')!.value;
      draft = toFormDraft(JSON.parse(text) as GameSpec);
    }
    return fromFormDraft(draft);
  };

  const save = async (): Promise<boolean> => {
    let spec: GameSpec | null;
    try {
      spec = currentSpec();
    } catch {
      toast('JSON không hợp lệ, kiểm tra lại dấu ngoặc/dấu phẩy', 'x');
      return false;
    }
    const body = { chapterId, kind, spec };
    const saved = await run(
      () => (isNew ? apiPost<AdminLevel>('/admin/levels', body) : api<AdminLevel>('PUT', `/admin/levels/${encodeURIComponent(level!.id)}`, body)),
      isNew ? 'Đã tạo level' : 'Đã lưu',
    );
    if (!saved) return false;
    dirty = false;
    if (isNew) {
      if (storyId) await run(() => api('PATCH', `/admin/stories/${storyId}`, { status: 'used', levelId: saved.id }));
      ctx.go(`#/level/${saved.id}`);
      return true;
    }
    level = saved;
    render();
    return true;
  };

  const publish = async (publishAt: string | null) => {
    if (dirty && !(await save())) return;
    const saved = await run(
      () => apiPost<AdminLevel>(`/admin/levels/${encodeURIComponent(level!.id)}/publish`, { publishAt }),
      publishAt ? `Đã hẹn giờ mở lúc ${fmtDateTime(publishAt)}` : 'Đã đăng, người chơi đã thấy level',
    );
    if (saved) {
      level = saved;
      render();
    }
  };

  const showHistory = async () => {
    const revs = await run(() => apiGet<LevelRevision[]>(`/admin/levels/${encodeURIComponent(level!.id)}/revisions`));
    if (!revs) return;
    openModal(
      revs.length
        ? `<table class="adm-table"><thead><tr><th>Thời điểm</th><th>Người sửa</th><th>Tiêu đề lúc đó</th><th></th></tr></thead><tbody>
          ${revs.map((r) => `<tr><td>${esc(fmtDateTime(r.createdAt))}</td><td>${esc(r.editedBy ?? '')}</td><td>${esc(r.spec?.title ?? '')}</td>
            <td><button class="btn btn--ghost btn--sm" data-restore="${r.id}">Khôi phục</button></td></tr>`).join('')}
          </tbody></table>`
        : '<p>Chưa có lịch sử.</p>',
      {
        title: 'LỊCH SỬ CHỈNH SỬA',
        className: 'adm-modal adm-modal--wide',
        onMount: (el, close) =>
          el.addEventListener('click', async (e) => {
            const id = (e.target as HTMLElement).closest<HTMLElement>('[data-restore]')?.dataset.restore;
            if (!id || !(await confirmDialog('Khôi phục nội dung của phiên bản này? Nội dung hiện tại vẫn được lưu trong lịch sử.'))) return;
            const restored = await run(() => apiPost<AdminLevel>(`/admin/levels/${encodeURIComponent(level!.id)}/revisions/${id}/restore`), 'Đã khôi phục');
            if (restored) {
              close();
              load(restored);
            }
          }),
      },
    );
  };

  const load = (l: AdminLevel) => {
    level = l;
    chapterId = l.chapterId;
    kind = l.kind;
    draft = toFormDraft(l.spec ?? newSpec(l.kind === 'boss' ? 'boss' : 'choice'));
    dirty = false;
    render();
  };

  const init = async () => {
    root.innerHTML = LOADING_HTML;
    const data = await run(() => apiGet<AdminChapter[]>('/admin/content'));
    if (!data) return;
    chapters = data;
    if (!chapterId) chapterId = chapters[0]?.id ?? '';
    if (isNew) {
      if (storyId) {
        const stories = await run(() => apiGet<{ id: number; situation: string; handling: string; lesson: string }[]>('/admin/stories'));
        const s = stories?.find((x) => String(x.id) === storyId);
        if (s) draft = toFormDraft(fromStory(s));
      }
      render();
    } else {
      const l = await run(() => apiGet<AdminLevel>(`/admin/levels/${encodeURIComponent(params.id!)}`));
      if (l) load(l);
    }
  };
  void init();

  const onChange = async (e: Event) => {
    const t = e.target as HTMLSelectElement;
    if (t.matches('[data-chapter]')) {
      chapterId = t.value;
      markDirty();
    } else if (t.matches('[data-kind]')) {
      const next = t.value as LevelKind;
      if (next === 'boss') draft = toFormDraft(draft.type === 'boss' ? fromFormDraft(draft) : newSpec('boss'));
      else if (next === 'normal' && draft.type === 'boss') draft = toFormDraft(newSpec('choice'));
      kind = next;
      markDirty();
      render();
    } else if (t.matches('[data-type]')) {
      const next = t.value as GameType;
      if (!(await confirmDialog('Đổi dạng trò chơi sẽ xóa nội dung đang soạn. Tiếp tục?', 'Đổi dạng', true))) {
        t.value = String(draft.type);
        return;
      }
      draft = toFormDraft(newSpec(next));
      markDirty();
      render();
    }
  };
  root.addEventListener('change', onChange);

  const stop = onAction(root, {
    save: () => void save(),
    json: () => {
      if (jsonMode) {
        try {
          currentSpec();
        } catch {
          toast('JSON không hợp lệ, kiểm tra lại dấu ngoặc/dấu phẩy', 'x');
          return;
        }
      }
      jsonMode = !jsonMode;
      render();
    },
    preview: async () => {
      if (dirty && !(await save())) return;
      window.open(`index.html?preview=${encodeURIComponent(level!.id)}`, '_blank', 'noopener');
    },
    publish: () => void publish(null),
    schedule: () => {
      const v = root.querySelector<HTMLInputElement>('[data-at]')!.value;
      if (!v) return toast('Chọn ngày giờ mở trước', 'clock');
      const at = new Date(v);
      if (at <= new Date()) return toast('Thời điểm mở phải ở tương lai', 'clock');
      void publish(at.toISOString());
    },
    unpublish: async () => {
      if (!(await confirmDialog('Gỡ level này xuống? Người chơi sẽ không thấy nữa (tiến độ đã có vẫn được giữ).', 'Gỡ xuống'))) return;
      const saved = await run(() => apiPost<AdminLevel>(`/admin/levels/${encodeURIComponent(level!.id)}/unpublish`), 'Đã gỡ xuống');
      if (saved) load(saved);
    },
    history: () => void showHistory(),
    delete: async () => {
      const msg = level!.locked
        ? 'Level đã phát hành nên sẽ được LƯU TRỮ (ẩn khỏi game, giữ tiến độ người chơi). Tiếp tục?'
        : 'Xóa hẳn level nháp này?';
      if (!(await confirmDialog(msg, level!.locked ? 'Lưu trữ' : 'Xóa', true))) return;
      const ok = await run(() => api('DELETE', `/admin/levels/${encodeURIComponent(level!.id)}`), level!.locked ? 'Đã lưu trữ' : 'Đã xóa');
      if (ok) ctx.go('#/content');
    },
  });

  const beforeUnload = (e: BeforeUnloadEvent) => {
    if (dirty) e.preventDefault();
  };
  window.addEventListener('beforeunload', beforeUnload);

  return () => {
    unbind?.();
    stop();
    root.removeEventListener('change', onChange);
    window.removeEventListener('beforeunload', beforeUnload);
  };
};
