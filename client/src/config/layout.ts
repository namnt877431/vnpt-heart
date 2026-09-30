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
  // wide & short: zig-zag left → right (one island per chapter, keyed by Chapter.order)
  landscape: {
    view: { x: 0, y: 0, width: 1820, height: 720 },
    positions: {
      1: { x: 170, y: 470 },
      2: { x: 470, y: 250 },
      3: { x: 770, y: 470 },
      4: { x: 1070, y: 250 },
      5: { x: 1370, y: 470 },
      6: { x: 1660, y: 250 },
    },
    labelScale: 1,
  },
  // tall & narrow (phones): zig-zag bottom → top
  portrait: {
    view: { x: 0, y: -60, width: 720, height: 1660 },
    positions: {
      1: { x: 210, y: 1350 },
      2: { x: 510, y: 1120 },
      3: { x: 210, y: 890 },
      4: { x: 510, y: 660 },
      5: { x: 210, y: 430 },
      6: { x: 510, y: 200 },
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
