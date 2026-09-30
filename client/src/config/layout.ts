/**
 * World-space layout for Phaser scenes. Each scene's camera zooms so its VIEW
 * rectangle fits the screen's safe area (see core/display.ts fitWorldToRect).
 * Anything outside the view may still be drawn (clouds, terrain) as bleed.
 */
export interface WorldRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapLayout {
  view: WorldRect;
  /** Island centres (top surface), keyed by stage id. */
  positions: Record<number, { x: number; y: number }>;
  /** Scale applied to island name plates (bigger when the map is zoomed far out). */
  labelScale: number;
}

/**
 * Two world-map layouts; MapScene picks one from the safe area's aspect ratio
 * and restarts itself when it flips (e.g. phone rotated).
 */
export const MAP_LAYOUTS: Record<'landscape' | 'portrait', MapLayout> = {
  // wide & short: zig-zag left → right
  landscape: {
    view: { x: 0, y: 0, width: 1600, height: 720 },
    positions: {
      1: { x: 220, y: 470 },
      2: { x: 520, y: 250 },
      3: { x: 810, y: 470 },
      4: { x: 1100, y: 250 },
      5: { x: 1390, y: 450 },
    },
    labelScale: 1,
  },
  // tall & narrow (phones): zig-zag bottom → top
  portrait: {
    view: { x: 0, y: -40, width: 720, height: 1360 },
    positions: {
      1: { x: 210, y: 1110 },
      2: { x: 510, y: 880 },
      3: { x: 210, y: 650 },
      4: { x: 510, y: 420 },
      5: { x: 230, y: 210 },
    },
    labelScale: 1.35,
  },
};

export type MapLayoutMode = keyof typeof MAP_LAYOUTS;

/** Landscape unless the area is clearly taller than wide. */
export const mapLayoutFor = (width: number, height: number): MapLayoutMode =>
  width / Math.max(1, height) < 0.9 ? 'portrait' : 'landscape';

/** Boss arena: player on the left, boss on the right, ground at y≈700. */
export const BOSS_VIEW: WorldRect = { x: 110, y: 190, width: 1380, height: 680 };
/** How far terrain/backdrop are drawn beyond the view so wide screens never see an edge. */
export const BOSS_BLEED = 1600;
