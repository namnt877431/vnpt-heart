/**
 * Demo switches. The public GitHub Pages build is a showcase, so every
 * chapter is open; levels inside a chapter still unlock one by one.
 * Set `unlockAllChapters: false` for the real flow (chapter N+1 opens after
 * chapter N's boss).
 */
export const DEMO = {
  unlockAllChapters: true,
  /** Pre-fill a little progress on first visit so the map does not look empty. */
  seedProgress: true,
} as const;
