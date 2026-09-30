import { esc } from '../dom';

/** Placeholder avatar: given-name initial on a colour derived from the name. Replace with photo URLs later. */
const HUES = [210, 195, 265, 330, 20, 150, 45];

export const avatar = (name: string, size = 40): string => {
  const words = name.trim().split(/\s+/);
  const initial = (words[words.length - 1] ?? '?').charAt(0).toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = HUES[hash % HUES.length];
  return `<span class="avatar" style="--size:${size}px;--hue:${hue}" title="${esc(name)}">${esc(initial)}</span>`;
};
