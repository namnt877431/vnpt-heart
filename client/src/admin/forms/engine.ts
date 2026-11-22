import type { SpotPart } from '../../data/game-types';
import { esc } from '../../ui/dom';
import { icon } from '../../ui/icons';

/**
 * Tiny declarative form engine for level specs. A spec is edited as a plain
 * object (`draft`); fields address it by dotted path ("questions.0.text").
 * Typing updates the draft in place; adding/removing/moving list items
 * mutates it and the form is re-rendered.
 */

export type Field =
  | { kind: 'text'; key: string; label: string; hint?: string; placeholder?: string }
  | { kind: 'textarea'; key: string; label: string; hint?: string; rows?: number }
  | { kind: 'number'; key: string; label: string; hint?: string; optional?: boolean; min?: number; max?: number }
  | { kind: 'select'; key: string; label: string; options: { value: string | number; label: string }[]; numeric?: boolean }
  /** List of answer strings + radio for the correct index (ChoiceQuestion). */
  | { kind: 'options'; key: string; correctKey: string; label: string }
  /** Nested object. */
  | { kind: 'group'; key: string; label: string; fields: Field[] }
  /** Repeated items: objects (`fields`) or plain strings (`text: true`). */
  | { kind: 'list'; key: string; label: string; itemLabel: string; fields?: Field[]; text?: boolean; min?: number; template: () => unknown; hint?: string }
  /** Two strings, e.g. the two bins of "Đúng hay sai?". */
  | { kind: 'pair'; key: string; labels: [string, string]; label: string }
  /** Spot-errors lines written with [[wrong text|why]] markers. */
  | { kind: 'spot'; key: string; label: string }
  /** Hazard hot-spots placed by clicking on the scene picture. */
  | { kind: 'hazards'; key: string; label: string };

type Obj = Record<string, unknown>;

export const getPath = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((o, k) => (o == null ? undefined : (o as Obj)[k]), obj);

export const setPath = (obj: unknown, path: string, value: unknown): void => {
  const keys = path.split('.');
  let o = obj as Obj;
  for (const k of keys.slice(0, -1)) {
    if (o[k] == null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(k) ? [] : {};
    o = o[k] as Obj;
  }
  const last = keys[keys.length - 1];
  if (value === undefined) delete o[last];
  else o[last] = value;
};

const join = (base: string, key: string) => (base ? `${base}.${key}` : key);

// ---------------------------------------------------------------- spot-errors markup

/** SpotPart[][] -> "text [[bad|why]] text" per line. */
export const spotToText = (lines: SpotPart[][] | undefined): string =>
  (lines ?? []).map((line) => line.map((p) => (typeof p === 'string' ? p : `[[${p.bad}|${p.why}]]`)).join('')).join('\n');

/** Inverse of spotToText. */
export const textToSpot = (text: string): SpotPart[][] =>
  text.split('\n').map((line) => {
    const parts: SpotPart[] = [];
    const re = /\[\[([^|\]]+)\|([^\]]*)\]\]/g;
    let last = 0;
    for (let m = re.exec(line); m; m = re.exec(line)) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      parts.push({ bad: m[1].trim(), why: m[2].trim() });
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts.length ? parts : [''];
  });

// ---------------------------------------------------------------- render

const hint = (h?: string) => (h ? `<small class="f-hint">${esc(h)}</small>` : '');

const listButtons = (listPath: string, i: number, n: number, min: number) => `
  <span class="f-item__btns">
    <button type="button" class="f-icon" data-f="up" data-list="${esc(listPath)}" data-i="${i}" ${i === 0 ? 'disabled' : ''} title="Lên">${icon('arrowUp', 14)}</button>
    <button type="button" class="f-icon" data-f="down" data-list="${esc(listPath)}" data-i="${i}" ${i === n - 1 ? 'disabled' : ''} title="Xuống">${icon('arrowDown', 14)}</button>
    <button type="button" class="f-icon f-icon--danger" data-f="remove" data-list="${esc(listPath)}" data-i="${i}" ${n <= min ? 'disabled' : ''} title="Xóa">${icon('x', 14)}</button>
  </span>`;

export const renderFields = (fields: Field[], draft: unknown, base = '', extra: { hazardScene?: string } = {}): string =>
  fields.map((f) => renderField(f, draft, base, extra)).join('');

const renderField = (f: Field, draft: unknown, base: string, extra: { hazardScene?: string }): string => {
  const path = join(base, f.key);
  const value = getPath(draft, path);
  switch (f.kind) {
    case 'text':
      return `<label class="f-field"><span>${esc(f.label)}</span><input type="text" data-path="${esc(path)}" value="${esc(value ?? '')}" placeholder="${esc(f.placeholder ?? '')}" />${hint(f.hint)}</label>`;
    case 'textarea':
      return `<label class="f-field"><span>${esc(f.label)}</span><textarea rows="${f.rows ?? 3}" data-path="${esc(path)}">${esc(value ?? '')}</textarea>${hint(f.hint)}</label>`;
    case 'number':
      return `<label class="f-field f-field--num"><span>${esc(f.label)}</span><input type="number" data-path="${esc(path)}" data-type="number" ${f.optional ? 'data-optional' : ''} value="${value ?? ''}" ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''} />${hint(f.hint)}</label>`;
    case 'select':
      return `<label class="f-field"><span>${esc(f.label)}</span><select data-path="${esc(path)}" ${f.numeric ? 'data-type="number"' : ''}>${f.options
        .map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(value) ? 'selected' : ''}>${esc(o.label)}</option>`)
        .join('')}</select></label>`;
    case 'pair': {
      const v = (value as string[] | undefined) ?? ['', ''];
      return `<div class="f-field"><span>${esc(f.label)}</span><div class="f-pair">${f.labels
        .map((l, i) => `<label><small>${esc(l)}</small><input type="text" data-path="${esc(`${path}.${i}`)}" value="${esc(v[i] ?? '')}" /></label>`)
        .join('')}</div></div>`;
    }
    case 'options': {
      const opts = (value as string[] | undefined) ?? [];
      const correct = Number(getPath(draft, join(base, f.correctKey)) ?? 0);
      return `<div class="f-field"><span>${esc(f.label)} <small class="f-hint">(chọn ô tròn ở đáp án đúng)</small></span>
        <ol class="f-options">${opts
          .map(
            (o, i) => `<li class="${i === correct ? 'is-correct' : ''}">
              <input type="radio" name="${esc(path)}" data-correct="${esc(join(base, f.correctKey))}" value="${i}" ${i === correct ? 'checked' : ''} title="Đáp án đúng" />
              <input type="text" data-path="${esc(`${path}.${i}`)}" value="${esc(o)}" placeholder="Phương án ${i + 1}" />
              ${listButtons(path, i, opts.length, 2)}
            </li>`,
          )
          .join('')}</ol>
        <button type="button" class="f-add" data-f="add-text" data-list="${esc(path)}" ${opts.length >= 6 ? 'disabled' : ''}>${icon('plusHeart', 14)} Thêm phương án</button></div>`;
    }
    case 'group':
      return `<fieldset class="f-group"><legend>${esc(f.label)}</legend>${renderFields(f.fields, draft, path, extra)}</fieldset>`;
    case 'list': {
      const items = (value as unknown[] | undefined) ?? [];
      const min = f.min ?? 1;
      return `<fieldset class="f-group f-list"><legend>${esc(f.label)} <small>(${items.length})</small></legend>${hint(f.hint)}
        ${items
          .map(
            (_, i) => `<div class="f-item">
              <header class="f-item__head"><b>${esc(f.itemLabel)} ${i + 1}</b>${listButtons(path, i, items.length, min)}</header>
              ${f.text ? `<input type="text" data-path="${esc(`${path}.${i}`)}" value="${esc(items[i] ?? '')}" />` : renderFields(f.fields ?? [], draft, `${path}.${i}`, extra)}
            </div>`,
          )
          .join('')}
        <button type="button" class="f-add" data-f="add" data-list="${esc(path)}">${icon('plusHeart', 14)} Thêm ${esc(f.itemLabel.toLowerCase())}</button>
      </fieldset>`;
    }
    case 'spot':
      return `<label class="f-field"><span>${esc(f.label)}</span>
        <textarea rows="10" class="f-mono" data-spot="${esc(path)}">${esc(spotToText(value as SpotPart[][] | undefined))}</textarea>
        <small class="f-hint">Mỗi dòng là một dòng của văn bản. Đánh dấu chỗ sai bằng <code>[[đoạn sai|vì sao sai]]</code>, ví dụ: <code>Chào [[mày|xưng hô thiếu tôn trọng]], bạn cần gì?</code></small>
      </label>`;
    case 'hazards': {
      const items = (value as { id: string; x: number; y: number; r: number; label: string; explain: string }[] | undefined) ?? [];
      return `<fieldset class="f-group"><legend>${esc(f.label)} <small>(${items.length})</small></legend>
        <small class="f-hint">Bấm "Đặt vị trí" ở một mối nguy rồi bấm vào ảnh để đặt tâm vòng tròn. Toạ độ theo ảnh 800×450.</small>
        <div class="f-scene" data-scene="${esc(path)}">${extra.hazardScene ?? ''}
          <svg class="f-scene__marks" viewBox="0 0 800 450">${items
            .map((h, i) => `<g><circle cx="${h.x}" cy="${h.y}" r="${h.r}" /><text x="${h.x}" y="${h.y + 6}" text-anchor="middle">${i + 1}</text></g>`)
            .join('')}</svg>
        </div>
        ${items
          .map(
            (h, i) => `<div class="f-item">
              <header class="f-item__head"><b>Mối nguy ${i + 1}</b>
                <button type="button" class="f-add" data-f="place" data-list="${esc(path)}" data-i="${i}">${icon('pin', 14)} Đặt vị trí</button>
                ${listButtons(path, i, items.length, 1)}</header>
              <div class="f-row">
                <label class="f-field f-field--num"><span>X</span><input type="number" data-path="${esc(`${path}.${i}.x`)}" data-type="number" value="${h.x}" /></label>
                <label class="f-field f-field--num"><span>Y</span><input type="number" data-path="${esc(`${path}.${i}.y`)}" data-type="number" value="${h.y}" /></label>
                <label class="f-field f-field--num"><span>Bán kính</span><input type="number" data-path="${esc(`${path}.${i}.r`)}" data-type="number" value="${h.r}" /></label>
              </div>
              <label class="f-field"><span>Tên mối nguy</span><input type="text" data-path="${esc(`${path}.${i}.label`)}" value="${esc(h.label)}" /></label>
              <label class="f-field"><span>Giải thích</span><textarea rows="2" data-path="${esc(`${path}.${i}.explain`)}">${esc(h.explain)}</textarea></label>
            </div>`,
          )
          .join('')}
        <button type="button" class="f-add" data-f="add-hazard" data-list="${esc(path)}">${icon('plusHeart', 14)} Thêm mối nguy</button>
      </fieldset>`;
    }
  }
};

// ---------------------------------------------------------------- binding

/** The list field a data path points at ("questions.2.options" -> options field). */
const findList = (fields: Field[], path: string): Extract<Field, { kind: 'list' }> | undefined => {
  let current: Field[] = fields;
  let found: Field | undefined;
  for (const key of path.split('.').filter((k) => !/^\d+$/.test(k))) {
    found = current.find((f) => f.key === key);
    if (!found) return undefined;
    current = found.kind === 'list' ? (found.fields ?? []) : found.kind === 'group' ? found.fields : [];
  }
  return found?.kind === 'list' ? found : undefined;
};

/**
 * Wire a rendered form: keeps `draft` in sync and calls `rerender()` after
 * structural changes. Returns an unbind function.
 */
export const bindForm = (root: HTMLElement, fields: Field[], draft: unknown, rerender: () => void, onChange: () => void): (() => void) => {
  let placing: { list: string; i: number } | null = null;

  const onInput = (e: Event) => {
    const t = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (t.dataset.path) {
      let v: unknown = t.value;
      if (t.dataset.type === 'number') v = t.value === '' ? (t.hasAttribute('data-optional') ? undefined : 0) : Number(t.value);
      setPath(draft, t.dataset.path, v);
      onChange();
    } else if (t.dataset.spot) {
      setPath(draft, t.dataset.spot, textToSpot(t.value));
      onChange();
    } else if ((t as HTMLInputElement).dataset.correct) {
      setPath(draft, (t as HTMLInputElement).dataset.correct!, Number(t.value));
      onChange();
      rerender();
    }
  };

  const onClick = (e: MouseEvent) => {
    const scene = (e.target as Element).closest<HTMLElement>('[data-scene]');
    if (scene && placing) {
      const svg = scene.querySelector('svg')!;
      const box = svg.getBoundingClientRect();
      const x = Math.round(((e.clientX - box.left) / box.width) * 800);
      const y = Math.round(((e.clientY - box.top) / box.height) * 450);
      setPath(draft, `${placing.list}.${placing.i}.x`, x);
      setPath(draft, `${placing.list}.${placing.i}.y`, y);
      placing = null;
      root.classList.remove('is-placing');
      onChange();
      rerender();
      return;
    }
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-f]');
    if (!btn) return;
    const listPath = btn.dataset.list!;
    const list = (getPath(draft, listPath) as unknown[] | undefined) ?? [];
    const i = Number(btn.dataset.i);
    switch (btn.dataset.f) {
      case 'add': {
        const def = findList(fields, listPath);
        list.push(def ? def.template() : '');
        break;
      }
      case 'add-text':
        list.push('');
        break;
      case 'add-hazard':
        list.push({ id: `h${Date.now().toString(36)}`, x: 400, y: 225, r: 40, label: '', explain: '' });
        break;
      case 'remove':
        list.splice(i, 1);
        break;
      case 'up':
        if (i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
        break;
      case 'down':
        if (i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
        break;
      case 'place':
        placing = { list: listPath, i };
        root.classList.add('is-placing');
        return;
    }
    setPath(draft, listPath, list);
    // keep "correct" pointing at a valid option after edits to an options list
    const correctInput = root.querySelector<HTMLInputElement>(`[name="${CSS.escape(listPath)}"]`);
    if (correctInput?.dataset.correct) {
      const c = Number(getPath(draft, correctInput.dataset.correct) ?? 0);
      if (c >= list.length) setPath(draft, correctInput.dataset.correct, Math.max(0, list.length - 1));
    }
    onChange();
    rerender();
  };

  root.addEventListener('input', onInput);
  root.addEventListener('click', onClick);
  return () => {
    root.removeEventListener('input', onInput);
    root.removeEventListener('click', onClick);
  };
};
