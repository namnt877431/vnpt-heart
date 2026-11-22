import type { AdminBadge, AdminSeason, AdminStats, AuditEntry, Settings } from '../../../../shared/api-types';
import { api, apiGet, apiPost } from '../../data/api';
import { LOADING_HTML } from '../../ui/components/async';
import { toast } from '../../ui/components/overlay';
import { esc, fmt, onAction } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { confirmDialog, field, fmtDateTime, formDialog, isAdmin, pageHead, run, type AdminView } from '../ui';

// ---------------------------------------------------------------- seasons & badges

export const seasonsView: AdminView = (root, ctx) => {
  const admin = isAdmin(ctx);
  let seasons: AdminSeason[] = [];
  let badges: AdminBadge[] = [];

  const render = () => {
    const today = new Date().toISOString().slice(0, 10);
    root.innerHTML = `
      ${pageHead('Mùa & huy hiệu', '', 'BXH "Toàn mùa" tính điểm từ ngày bắt đầu của mùa đang diễn ra.')}
      <section class="adm-card">
        <header class="adm-card__head"><h2>Mùa chinh phục</h2>${admin ? `<button class="btn btn--blue btn--sm" data-action="new-season">${icon('plusHeart', 14)} Thêm mùa</button>` : ''}</header>
        <table class="adm-table"><thead><tr><th>Mùa</th><th>Bắt đầu</th><th>Kết thúc</th><th></th><th></th></tr></thead><tbody>
          ${seasons.map((s) => `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.startsAt)}</td><td>${esc(s.endsAt)}</td>
            <td>${s.startsAt <= today && today <= s.endsAt ? '<span class="adm-chip adm-chip--live">Đang diễn ra</span>' : ''}</td>
            <td class="adm-row-actions">${admin ? `<button class="btn btn--ghost btn--sm" data-action="edit-season" data-id="${s.id}">${icon('pencil', 14)} Sửa</button>
              <button class="f-icon f-icon--danger" data-action="delete-season" data-id="${s.id}">${icon('x', 14)}</button>` : ''}</td></tr>`).join('')}
        </tbody></table>
      </section>
      <section class="adm-card">
        <header class="adm-card__head"><h2>Huy hiệu</h2>${admin ? `<button class="btn btn--blue btn--sm" data-action="new-badge">${icon('plusHeart', 14)} Thêm huy hiệu</button>` : ''}</header>
        <table class="adm-table"><thead><tr><th></th><th>Huy hiệu</th><th>Đã trao</th><th></th></tr></thead><tbody>
          ${badges.map((b) => `<tr><td>${icon(b.icon, 22)}</td><td><b>${esc(b.name)}</b><br/><small class="adm-muted">${esc(b.description)}</small></td><td>${b.awarded}</td>
            <td class="adm-row-actions"><button class="btn btn--blue btn--sm" data-action="award" data-id="${esc(b.id)}">${icon('medal', 14)} Trao</button>
              ${admin ? `<button class="btn btn--ghost btn--sm" data-action="edit-badge" data-id="${esc(b.id)}">${icon('pencil', 14)} Sửa</button>` : ''}</td></tr>`).join('')}
        </tbody></table>
      </section>`;
  };

  const load = async () => {
    const [s, b] = await Promise.all([run(() => apiGet<AdminSeason[]>('/admin/seasons')), run(() => apiGet<AdminBadge[]>('/admin/badges'))]);
    if (s && b) {
      seasons = s;
      badges = b;
      render();
    }
  };
  root.innerHTML = LOADING_HTML;
  void load();

  const seasonDialog = (s?: AdminSeason) =>
    formDialog(
      s ? 'SỬA MÙA' : 'MÙA MỚI',
      field('Tên mùa', `<input name="name" value="${esc(s?.name ?? '')}" required maxlength="80" />`) +
        field('Ngày bắt đầu', `<input type="date" name="startsAt" value="${esc(s?.startsAt ?? '')}" required />`) +
        field('Ngày kết thúc', `<input type="date" name="endsAt" value="${esc(s?.endsAt ?? '')}" required />`),
    );
  const seasonBody = (fd: FormData) => ({ name: fd.get('name'), startsAt: fd.get('startsAt'), endsAt: fd.get('endsAt') });

  const badgeDialog = (b?: AdminBadge) =>
    formDialog(
      b ? 'SỬA HUY HIỆU' : 'HUY HIỆU MỚI',
      field('Tên', `<input name="name" value="${esc(b?.name ?? '')}" required maxlength="60" />`) +
        field('Mô tả / điều kiện', `<input name="description" value="${esc(b?.description ?? '')}" maxlength="200" />`) +
        field('Biểu tượng', `<input name="icon" value="${esc(b?.icon ?? 'medal')}" maxlength="30" />`, 'Tên icon: heart, shield, users, bulb, medal, flag, smile, star, bolt, target, trophy, crown'),
    );

  return onAction(root, {
    'new-season': async () => {
      const fd = await seasonDialog();
      if (fd && (await run(() => apiPost('/admin/seasons', seasonBody(fd)), 'Đã thêm mùa'))) void load();
    },
    'edit-season': async (el) => {
      const fd = await seasonDialog(seasons.find((s) => String(s.id) === el.dataset.id));
      if (fd && (await run(() => api('PUT', `/admin/seasons/${el.dataset.id}`, seasonBody(fd)), 'Đã lưu'))) void load();
    },
    'delete-season': async (el) => {
      if (await confirmDialog('Xóa mùa này?', 'Xóa', true)) if (await run(() => api('DELETE', `/admin/seasons/${el.dataset.id}`), 'Đã xóa')) void load();
    },
    'new-badge': async () => {
      const fd = await badgeDialog();
      if (fd && (await run(() => api('PUT', '/admin/badges', Object.fromEntries(fd)), 'Đã thêm'))) void load();
    },
    'edit-badge': async (el) => {
      const b = badges.find((x) => x.id === el.dataset.id)!;
      const fd = await badgeDialog(b);
      if (fd && (await run(() => api('PUT', '/admin/badges', { id: b.id, ...Object.fromEntries(fd) }), 'Đã lưu'))) void load();
    },
    award: async (el) => {
      const b = badges.find((x) => x.id === el.dataset.id)!;
      const fd = await formDialog(`TRAO "${b.name.toUpperCase()}"`, field('Tên đăng nhập người nhận (mỗi dòng một người)', '<textarea name="usernames" rows="6" required></textarea>'), 'Trao huy hiệu');
      if (!fd) return;
      const usernames = String(fd.get('usernames')).split(/[\s,;]+/).filter(Boolean);
      const res = await run(() => apiPost<{ awarded: number; missing: string[] }>(`/admin/badges/${encodeURIComponent(b.id)}/award`, { usernames }));
      if (res) {
        toast(`Đã trao cho ${res.awarded} người${res.missing.length ? `. Không tìm thấy: ${res.missing.join(', ')}` : ''}`, 'medal');
        void load();
      }
    },
  });
};

// ---------------------------------------------------------------- stats

export const statsView: AdminView = (root) => {
  root.innerHTML = LOADING_HTML;
  void run(() => apiGet<AdminStats>('/admin/stats')).then((s) => {
    if (!s || !root.isConnected) return;
    const max = Math.max(1, ...s.daily.map((d) => d.players));
    root.innerHTML = `
      ${pageHead('Thống kê tham gia')}
      <div class="adm-kpis">
        <div class="adm-kpi"><b>${fmt(s.players)}</b><span>Người dùng</span></div>
        <div class="adm-kpi"><b>${fmt(s.activeToday)}</b><span>Chơi hôm nay</span></div>
        <div class="adm-kpi"><b>${fmt(s.activeWeek)}</b><span>Chơi tuần này</span></div>
        <div class="adm-kpi"><b>${fmt(s.playsWeek)}</b><span>Lượt chơi tuần này</span></div>
      </div>
      <section class="adm-card">
        <header class="adm-card__head"><h2>14 ngày gần đây</h2></header>
        ${s.daily.length ? `<div class="adm-bars">${s.daily.map((d) => `
          <div class="adm-bar"><span class="adm-bar__day">${esc(d.day.slice(5))}</span>
            <span class="adm-bar__track"><span class="adm-bar__fill" style="width:${(d.players / max) * 100}%"></span></span>
            <span class="adm-bar__val">${d.players} người · ${d.plays} lượt</span></div>`).join('')}</div>` : '<p class="adm-muted adm-empty">Chưa có lượt chơi nào.</p>'}
      </section>
      <section class="adm-card">
        <header class="adm-card__head"><h2>Tham gia theo nhóm (tuần này)</h2></header>
        <table class="adm-table"><thead><tr><th>Nhóm</th><th>Thành viên</th><th>Đã chơi</th><th>Tỷ lệ</th></tr></thead><tbody>
          ${s.groups.map((g) => `<tr><td>${esc(g.name)}</td><td>${g.members}</td><td>${g.activeWeek}</td><td>${g.members ? Math.round((g.activeWeek * 100) / g.members) : 0}%</td></tr>`).join('')}
        </tbody></table>
      </section>`;
  });
  return () => undefined;
};

// ---------------------------------------------------------------- audit

const ACTIONS: Record<string, string> = {
  create: 'Tạo', update: 'Sửa', delete: 'Xóa', publish: 'Đăng', unpublish: 'Gỡ', archive: 'Lưu trữ', restore: 'Khôi phục',
  reorder: 'Sắp xếp', upload: 'Tải ảnh', import: 'Import', award: 'Trao', revoke: 'Thu hồi', save: 'Lưu',
};

export const auditView: AdminView = (root) => {
  root.innerHTML = LOADING_HTML;
  void run(() => apiGet<AuditEntry[]>('/admin/audit')).then((rows) => {
    if (!rows || !root.isConnected) return;
    root.innerHTML = `
      ${pageHead('Nhật ký thao tác', '', '300 thao tác gần nhất trên trang quản trị.')}
      <section class="adm-card"><table class="adm-table"><thead><tr><th>Thời điểm</th><th>Người thực hiện</th><th>Thao tác</th><th>Đối tượng</th></tr></thead><tbody>
        ${rows.map((a) => `<tr><td><small>${esc(fmtDateTime(a.createdAt))}</small></td><td>${esc(a.user ?? '')}</td><td>${esc(ACTIONS[a.action] ?? a.action)}</td>
          <td>${esc(a.entity)} ${a.entity === 'level' ? `<a href="#/level/${esc(a.entityId)}">${esc(a.entityId)}</a>` : `<small>${esc(a.entityId)}</small>`}</td></tr>`).join('')}
      </tbody></table></section>`;
  });
  return () => undefined;
};

// ---------------------------------------------------------------- settings

export const settingsView: AdminView = (root, ctx) => {
  const admin = isAdmin(ctx);
  root.innerHTML = LOADING_HTML;
  void run(() => apiGet<Settings>('/admin/settings')).then((s) => {
    if (!s || !root.isConnected) return;
    const dis = admin ? '' : 'disabled';
    root.innerHTML = `
      ${pageHead('Cấu hình', '', admin ? '' : 'Chỉ quản trị viên được thay đổi cấu hình.')}
      <form class="adm-card adm-form" data-settings>
        <label class="adm-check"><input type="checkbox" name="unlockAllChapters" ${s.unlockAllChapters ? 'checked' : ''} ${dis}/> Mở sẵn tất cả các chặng (không cần xong chặng trước)</label>
        ${field('Điểm thưởng tối đa mỗi ngày (quà Mystery…)', `<input type="number" name="bonusCapPerDay" min="0" value="${s.bonusCapPerDay}" ${dis}/>`)}
        <fieldset class="f-group"><legend>Trọng số điểm nhóm</legend>
          <p class="adm-muted">Điểm xếp hạng nhóm = Điểm TB × a + Tỷ lệ tham gia (%) × b + Thành tích kỳ × c. BTC chốt các hệ số này.</p>
          <div class="f-row">
            ${field('a · Điểm TB', `<input type="number" step="0.1" min="0" name="avg" value="${s.groupWeights.avg}" ${dis}/>`)}
            ${field('b · Tham gia', `<input type="number" step="0.1" min="0" name="participation" value="${s.groupWeights.participation}" ${dis}/>`)}
            ${field('c · Thành tích kỳ', `<input type="number" step="0.1" min="0" name="bonus" value="${s.groupWeights.bonus}" ${dis}/>`)}
          </div>
        </fieldset>
        ${admin ? `<button class="btn btn--gold" type="submit">${icon('check', 16)} Lưu cấu hình</button>` : ''}
      </form>`;
    root.querySelector<HTMLFormElement>('[data-settings]')!.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target as HTMLFormElement);
      void run(
        () =>
          api('PUT', '/admin/settings', {
            unlockAllChapters: fd.get('unlockAllChapters') === 'on',
            bonusCapPerDay: Number(fd.get('bonusCapPerDay')),
            groupWeights: { avg: Number(fd.get('avg')), participation: Number(fd.get('participation')), bonus: Number(fd.get('bonus')) },
          }),
        'Đã lưu cấu hình',
      );
    });
  });
  return () => undefined;
};
