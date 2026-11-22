import type { AdminGroup, AdminUser, Role } from '../../../../shared/api-types';
import { api, apiGet, apiPost } from '../../data/api';
import { LOADING_HTML } from '../../ui/components/async';
import { esc, onAction } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { confirmDialog, field, fmtDateTime, formDialog, isAdmin, pageHead, run, type AdminView } from '../ui';

const ROLE_LABEL: Record<Role, string> = { player: 'Người chơi', editor: 'BTC (soạn nội dung)', admin: 'Quản trị' };

/** Users (role, group, lock), CSV import and competition groups. */
export const peopleView: AdminView = (root, ctx) => {
  const admin = isAdmin(ctx);
  let users: AdminUser[] = [];
  let groups: AdminGroup[] = [];
  let q = '';

  const groupOptions = (selected: string | null) =>
    `<option value="">— Chưa có nhóm —</option>${groups.map((g) => `<option value="${esc(g.id)}" ${g.id === selected ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}`;

  const render = () => {
    root.innerHTML = `
      ${pageHead('Người chơi & nhóm', '', admin ? 'Người dùng được tạo tự động khi đăng nhập lần đầu (SSO/LDAP). Import danh sách để xếp nhóm trước.' : 'Chỉ quản trị viên được đổi quyền, nhóm và khóa tài khoản.')}
      <section class="adm-card">
        <header class="adm-card__head"><h2>Nhóm thi đua</h2>
          ${admin ? `<button class="btn btn--blue btn--sm" data-action="new-group">${icon('plusHeart', 14)} Thêm nhóm</button>` : ''}</header>
        <table class="adm-table"><thead><tr><th>Nhóm</th><th>Mã</th><th>Thành viên</th><th>Trưởng nhóm</th><th></th></tr></thead><tbody>
          ${groups.map((g) => `<tr><td><b>${esc(g.name)}</b></td><td><small>${esc(g.id)}</small></td><td>${g.members}</td>
            <td>${esc(users.find((u) => u.id === g.leaderId)?.name ?? '—')}</td>
            <td class="adm-row-actions">${admin ? `<button class="btn btn--ghost btn--sm" data-action="edit-group" data-id="${esc(g.id)}">${icon('pencil', 14)} Sửa</button>
              <button class="f-icon f-icon--danger" data-action="delete-group" data-id="${esc(g.id)}" title="Xóa">${icon('x', 14)}</button>` : ''}</td></tr>`).join('')}
        </tbody></table>
      </section>

      ${admin ? `
      <section class="adm-card">
        <header class="adm-card__head"><h2>Import danh sách</h2></header>
        <p class="adm-muted">Mỗi dòng: <code>tên đăng nhập, họ tên, nhóm, chức danh, đơn vị</code> (có thể dán từ Excel). Nhóm chưa có sẽ được tạo.</p>
        <textarea class="f-mono adm-import" rows="5" data-csv placeholder="namnt.dlc, Nguyễn Thành Nam, Nhóm Kỹ thuật, Chuyên viên, Phòng CNTT"></textarea>
        <button class="btn btn--blue btn--sm" data-action="import">${icon('arrowUp', 14)} Import</button>
      </section>` : ''}

      <section class="adm-card">
        <header class="adm-card__head"><h2>Người dùng <small>(${users.length})</small></h2>
          <input class="adm-search" type="search" placeholder="Tìm tên, tài khoản, đơn vị…" value="${esc(q)}" data-search /></header>
        <table class="adm-table"><thead><tr><th>Người dùng</th><th>Đơn vị / chức danh</th><th>Nhóm</th><th>Quyền</th><th>Trạng thái</th><th>Đăng nhập gần nhất</th></tr></thead><tbody>
          ${users.map((u) => `<tr data-user="${esc(u.id)}">
            <td><b>${esc(u.name)}</b><br/><small class="adm-muted">${esc(u.username)}</small></td>
            <td><small>${esc(u.unit)}<br/>${esc(u.title)}</small></td>
            <td>${admin ? `<select data-field="groupId">${groupOptions(u.groupId)}</select>` : esc(groups.find((g) => g.id === u.groupId)?.name ?? '—')}</td>
            <td>${admin ? `<select data-field="role">${(Object.keys(ROLE_LABEL) as Role[]).map((r) => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${ROLE_LABEL[r]}</option>`).join('')}</select>` : ROLE_LABEL[u.role]}</td>
            <td>${admin ? `<label class="adm-check"><input type="checkbox" data-field="active" ${u.active ? 'checked' : ''}/> Hoạt động</label>` : u.active ? 'Hoạt động' : 'Đã khóa'}</td>
            <td><small>${esc(fmtDateTime(u.lastLoginAt) || 'Chưa đăng nhập')}</small></td>
          </tr>`).join('')}
        </tbody></table>
      </section>`;
  };

  const load = async () => {
    const [u, g] = await Promise.all([
      run(() => apiGet<AdminUser[]>(`/admin/users?q=${encodeURIComponent(q)}`)),
      run(() => apiGet<AdminGroup[]>('/admin/groups')),
    ]);
    if (u && g) {
      users = u;
      groups = g;
      render();
      const s = root.querySelector<HTMLInputElement>('[data-search]');
      if (s && q) {
        s.focus();
        s.setSelectionRange(q.length, q.length);
      }
    }
  };
  root.innerHTML = LOADING_HTML;
  void load();

  let searchTimer = 0;
  const onInput = (e: Event) => {
    const t = e.target as HTMLInputElement;
    if (!t.matches('[data-search]')) return;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      q = t.value.trim();
      void load();
    }, 350);
  };
  const onChange = async (e: Event) => {
    const t = e.target as HTMLInputElement | HTMLSelectElement;
    const row = t.closest<HTMLElement>('[data-user]');
    if (!row || !t.dataset.field) return;
    const value = t.dataset.field === 'active' ? (t as HTMLInputElement).checked : t.dataset.field === 'groupId' ? t.value || null : t.value;
    const ok = await run(() => api('PATCH', `/admin/users/${row.dataset.user}`, { [t.dataset.field!]: value }), 'Đã cập nhật');
    if (!ok) void load();
  };
  root.addEventListener('input', onInput);
  root.addEventListener('change', onChange);

  const groupDialog = (g?: AdminGroup) =>
    formDialog(
      g ? 'SỬA NHÓM' : 'NHÓM MỚI',
      field('Tên nhóm', `<input name="name" value="${esc(g?.name ?? '')}" required maxlength="80" />`) +
        field('Trưởng nhóm', `<select name="leaderId"><option value="">—</option>${users
          .filter((u) => !g || u.groupId === g.id)
          .map((u) => `<option value="${esc(u.id)}" ${u.id === g?.leaderId ? 'selected' : ''}>${esc(u.name)} (${esc(u.username)})</option>`)
          .join('')}</select>`),
    );

  const stop = onAction(root, {
    'new-group': async () => {
      const fd = await groupDialog();
      if (fd && (await run(() => apiPost('/admin/groups', { name: fd.get('name'), leaderId: fd.get('leaderId') || null }), 'Đã thêm nhóm'))) void load();
    },
    'edit-group': async (el) => {
      const g = groups.find((x) => x.id === el.dataset.id)!;
      const fd = await groupDialog(g);
      if (fd && (await run(() => api('PUT', `/admin/groups/${encodeURIComponent(g.id)}`, { name: fd.get('name'), leaderId: fd.get('leaderId') || null }), 'Đã lưu'))) void load();
    },
    'delete-group': async (el) => {
      if (!(await confirmDialog('Xóa nhóm này? Thành viên sẽ về trạng thái chưa có nhóm.', 'Xóa', true))) return;
      if (await run(() => api('DELETE', `/admin/groups/${encodeURIComponent(el.dataset.id!)}`), 'Đã xóa nhóm')) void load();
    },
    import: async () => {
      const csv = root.querySelector<HTMLTextAreaElement>('[data-csv]')!.value;
      if (!csv.trim()) return;
      const res = await run(() => apiPost<{ created: number; updated: number; newGroups: number }>('/admin/users/import', { csv }));
      if (res) {
        await run(async () => undefined, `Import xong: ${res.created} mới, ${res.updated} cập nhật, ${res.newGroups} nhóm mới`);
        void load();
      }
    },
  });

  return () => {
    stop();
    root.removeEventListener('input', onInput);
    root.removeEventListener('change', onChange);
  };
};
