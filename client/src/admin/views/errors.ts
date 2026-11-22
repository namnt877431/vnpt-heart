import type { AdminErrorEvent, AdminErrorList, AdminErrorReport, ErrorCategory } from '../../../../shared/api-types';
import { api, apiGet } from '../../data/api';
import { LOADING_HTML } from '../../ui/components/async';
import { esc, onAction } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { fmtDateTime, pageHead, run, type AdminView } from '../ui';

const CATS: Record<ErrorCategory, { label: string; hint: string }> = {
  network: {
    label: 'Mạng',
    hint: 'Do đường truyền của người chơi: mất wifi/4G, mạng yếu, hoặc proxy/tường lửa chặn. Nhiều tài khoản cùng đơn vị gặp cùng lúc thì kiểm tra mạng của đơn vị đó.',
  },
  browser: {
    label: 'Trình duyệt',
    hint: 'Lỗi khi chạy game trên máy người chơi. Chỉ một loại hoặc một bản trình duyệt cũ bị thì do trình duyệt (nhắc cập nhật); trình duyệt nào cũng bị thì là lỗi game, gửi kỹ thuật.',
  },
  config: {
    label: 'Cấu hình',
    hint: 'Do cài đặt máy chủ: không kết nối được LDAP/CSDL, sai thông số trong .env, thiếu file, hoặc dịch vụ API không chạy. Gửi người quản trị máy chủ.',
  },
  server: {
    label: 'Máy chủ',
    hint: 'Lỗi trong mã chương trình máy chủ. Gửi kỹ thuật kèm phần "Chi tiết kỹ thuật".',
  },
};
const ORDER: ErrorCategory[] = ['network', 'browser', 'config', 'server'];

const browsersText = (e: AdminErrorReport) => {
  const top = e.browsers.slice(0, 4).map((b) => `${b.label} (${b.count})`);
  const rest = e.browsers.length - top.length;
  return top.join(', ') + (rest > 0 ? `, +${rest} loại khác` : '');
};

const eventsTable = (events: AdminErrorEvent[]) =>
  events.length
    ? `<table class="adm-table adm-events">
        <thead><tr><th>Lúc</th><th>Tài khoản</th><th>Trình duyệt</th><th>Chi tiết</th><th>Trang</th><th>IP</th></tr></thead>
        <tbody>${events
          .map(
            (ev) => `<tr>
              <td>${esc(fmtDateTime(ev.at))}</td>
              <td>${
                ev.user
                  ? `<button class="adm-link" data-action="by-user" data-u="${esc(ev.user.username)}" title="Chỉ xem lỗi của tài khoản này">${esc(ev.user.name)}</button>
                     <small>${esc(ev.user.username)}${ev.user.unit ? ` · ${esc(ev.user.unit)}` : ''}</small>`
                  : '<span class="adm-muted">Chưa đăng nhập</span>'
              }</td>
              <td title="${esc(ev.userAgent)}">${esc(ev.browser || '—')}</td>
              <td>${esc(ev.detail || '—')}</td>
              <td>${esc(ev.url || '—')}</td>
              <td>${esc(ev.ip || '—')}</td>
            </tr>`,
          )
          .join('')}</tbody>
      </table>`
    : '<p class="adm-muted">Không còn lần nào trong 30 ngày.</p>';

/**
 * Error log: grouped by kind (count, accounts, browsers), each with a likely
 * cause, every occurrence on demand (who, when, browser, IP, details).
 * Filter by cause and by account. "Đã xử lý" removes a kind; it comes back if it happens again.
 */
export const errorsView: AdminView = (root) => {
  let data: AdminErrorList | null = null;
  let category: ErrorCategory | '' = '';
  let q = '';
  const events = new Map<number, AdminErrorEvent[]>();

  const card = (e: AdminErrorReport) => `
    <article class="adm-card adm-error">
      <header class="adm-card__head">
        <div>
          <h2><span class="adm-chip adm-chip--${e.category}">${CATS[e.category].label}</span> ${esc(e.message)}</h2>
          <p>${e.count} lần · ${e.users} tài khoản · gần nhất ${esc(fmtDateTime(e.lastSeen))} · lần đầu ${esc(fmtDateTime(e.firstSeen))}</p>
        </div>
        <button class="btn btn--ghost btn--sm" data-action="resolve" data-id="${e.id}">${icon('check', 14)} Đã xử lý</button>
      </header>
      <p class="adm-error__hint">${esc(CATS[e.category].hint)}</p>
      <dl class="adm-dl">
        ${e.url ? `<dt>Ở đâu</dt><dd>${esc(e.url)}</dd>` : ''}
        ${e.browsers.length ? `<dt>Trình duyệt</dt><dd>${esc(browsersText(e))}</dd>` : ''}
        ${e.lastUser ? `<dt>Gặp gần nhất</dt><dd>${esc(e.lastUser)}</dd>` : ''}
        ${e.release ? `<dt>Bản build</dt><dd>${esc(e.release)}</dd>` : ''}
      </dl>
      <details data-events="${e.id}">
        <summary>Từng lần gặp${q ? ` của “${esc(q)}”` : ''}</summary>
        <div class="adm-events-wrap">${events.has(e.id) ? eventsTable(events.get(e.id)!) : LOADING_HTML}</div>
      </details>
      ${e.stack ? `<details><summary>Chi tiết kỹ thuật</summary><pre class="adm-stack">${esc(e.stack)}</pre></details>` : ''}
    </article>`;

  const render = () => {
    if (!data) return;
    const total = ORDER.reduce((n, c) => n + data!.counts[c], 0);
    root.innerHTML = `
      ${pageHead(
        'Lỗi hệ thống',
        `<button class="btn btn--ghost btn--sm" data-action="reload">${icon('arrowUp', 14)} Tải lại</button>`,
        'Lỗi trên máy người chơi và trên máy chủ, gom theo loại và chia theo nguyên nhân. Mở “Từng lần gặp” để xem tài khoản, giờ, trình duyệt, IP. Giữ 30 ngày.',
      )}
      <div class="adm-error-tools">
        <div class="seg adm-seg">
          <button class="seg__btn ${category === '' ? 'is-active' : ''}" data-action="cat" data-cat="">Tất cả (${total})</button>
          ${ORDER.map((c) => `<button class="seg__btn ${category === c ? 'is-active' : ''}" data-action="cat" data-cat="${c}">${CATS[c].label} (${data!.counts[c]})</button>`).join('')}
        </div>
        <input class="adm-search" type="search" placeholder="Lọc theo tài khoản (tên hoặc mã)…" value="${esc(q)}" data-search />
      </div>
      ${
        data.reports.length
          ? data.reports.map(card).join('')
          : `<section class="adm-card"><p class="adm-empty">${icon('check', 18)} ${q || category ? 'Không có lỗi nào khớp bộ lọc.' : 'Chưa ghi nhận lỗi nào.'}</p></section>`
      }`;
  };

  const load = async (keepFocus = false) => {
    if (!keepFocus) root.innerHTML = LOADING_HTML;
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    const res = await run(() => apiGet<AdminErrorList>(`/admin/errors?${params}`));
    if (!res || !root.isConnected) return;
    data = res;
    events.clear();
    const caret = root.querySelector<HTMLInputElement>('[data-search]')?.selectionStart ?? null;
    render();
    if (keepFocus) {
      const s = root.querySelector<HTMLInputElement>('[data-search]');
      s?.focus();
      if (s && caret !== null) s.setSelectionRange(caret, caret);
    }
  };
  void load();

  const loadEvents = async (details: HTMLDetailsElement) => {
    const id = Number(details.dataset.events);
    if (events.has(id)) return;
    const res = await run(() => apiGet<AdminErrorEvent[]>(`/admin/errors/${id}/events${q ? `?q=${encodeURIComponent(q)}` : ''}`));
    if (!res) return;
    events.set(id, res);
    const wrap = details.querySelector('.adm-events-wrap');
    if (wrap) wrap.innerHTML = eventsTable(res);
  };
  // <details> 'toggle' does not bubble: listen in the capture phase
  const onToggle = (ev: Event) => {
    const d = ev.target as HTMLElement;
    if (d instanceof HTMLDetailsElement && d.open && d.dataset.events) void loadEvents(d);
  };
  root.addEventListener('toggle', onToggle, true);

  let searchTimer = 0;
  const onInput = (ev: Event) => {
    const t = ev.target as HTMLInputElement;
    if (!t.matches('[data-search]')) return;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      q = t.value.trim();
      void load(true);
    }, 350);
  };
  root.addEventListener('input', onInput);

  const off = onAction(root, {
    reload: () => void load(),
    cat: (el) => {
      category = (el.dataset.cat ?? '') as ErrorCategory | '';
      void load();
    },
    'by-user': (el) => {
      q = el.dataset.u ?? '';
      void load();
    },
    resolve: async (el) => {
      if (await run(() => api('DELETE', `/admin/errors/${el.dataset.id}`), 'Đã đánh dấu xử lý')) void load();
    },
  });

  return () => {
    off();
    window.clearTimeout(searchTimer);
    root.removeEventListener('toggle', onToggle, true);
    root.removeEventListener('input', onInput);
  };
};
