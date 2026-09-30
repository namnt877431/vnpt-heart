/** Chunky game-style progress bar. `variant` maps to .bar--<variant> in components.css. */
export const progressBar = (
  value: number,
  max: number,
  variant: 'xp' | 'gold' | 'hp' | 'boss' | 'time' = 'xp',
): string => {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return `<div class="bar bar--${variant}" role="progressbar" aria-valuenow="${value}" aria-valuemax="${max}"><span style="width:${pct.toFixed(1)}%"></span></div>`;
};

/** Row of 5-point stars, e.g. stage rating. */
export const starRow = (earned: number, total: number): string =>
  Array.from({ length: total }, (_, i) =>
    `<svg class="star ${i < earned ? 'is-on' : ''}" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/></svg>`,
  ).join('');
