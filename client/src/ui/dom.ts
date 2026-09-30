/**
 * Minimal DOM helpers. UI is rendered from template strings; every dynamic
 * value MUST go through `esc()` (or be a trusted snippet from icons/components).
 */
export const esc = (value: unknown): string =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Vietnamese number format: 1250 -> "1.250". */
export const fmt = (n: number): string => n.toLocaleString('vi-VN');

export const $ = <T extends Element = HTMLElement>(root: ParentNode, sel: string): T => {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Missing element: ${sel}`);
  return el;
};

export const $$ = <T extends Element = HTMLElement>(root: ParentNode, sel: string): T[] =>
  Array.from(root.querySelectorAll<T>(sel));

/**
 * Delegated click handling: `onAction(root, { 'go-home': () => ... })` fires for
 * any descendant with `data-action="go-home"`. Returns an unsubscribe function.
 */
export const onAction = (
  root: HTMLElement,
  handlers: Record<string, (el: HTMLElement, ev: MouseEvent) => void>,
): (() => void) => {
  const listener = (ev: MouseEvent) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!el || !root.contains(el)) return;
    handlers[el.dataset.action!]?.(el, ev);
  };
  root.addEventListener('click', listener);
  return () => root.removeEventListener('click', listener);
};
