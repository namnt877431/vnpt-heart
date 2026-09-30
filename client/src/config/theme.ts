/**
 * Visual constants shared by Phaser scenes. DOM styling uses CSS tokens in
 * src/styles/tokens.css — keep the two palettes in sync.
 */
export const FONT_DISPLAY = '"Baloo 2", "Be Vietnam Pro", sans-serif';
export const FONT_BODY = '"Be Vietnam Pro", sans-serif';

export const COLORS = {
  navy900: 0x0a2266,
  navy700: 0x0e3a8c,
  blue600: 0x1b5fd6,
  blue500: 0x2f7cf6,
  cyan: 0x4ee6ff,
  gold: 0xffc629,
  goldDark: 0xe08a00,
  red: 0xe8283b,
  white: 0xffffff,
  locked: 0x7d8fb3,
} as const;

/** Phaser text style with the chunky outlined look used across the game. */
export const outlinedText = (size: number, color = '#ffffff', stroke = '#0a2266') => ({
  fontFamily: FONT_DISPLAY,
  fontSize: `${size}px`,
  fontStyle: '800',
  color,
  stroke,
  strokeThickness: Math.max(3, Math.round(size / 5)),
  resolution: 2,
});
