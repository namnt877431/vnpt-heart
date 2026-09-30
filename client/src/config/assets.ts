/**
 * Asset manifest — the ONLY place asset keys and file paths are declared.
 * PreloaderScene loads everything here; scenes and UI refer to assets by key.
 *
 * To swap placeholder art for final art (e.g. AI-generated PNG):
 *   1. Drop the file into public/assets/images/<category>/
 *   2. Change `url` (and `type` to 'image' for PNG/WebP). Keys stay the same.
 */
export type AssetType = 'svg' | 'image';

export interface AssetDef {
  key: string;
  url: string;
  type: AssetType;
  /** SVGs are rasterised at this multiple of their viewBox size for crispness. */
  svgScale?: number;
}

const svg = (key: string, url: string, svgScale = 2): AssetDef => ({ key, url, type: 'svg', svgScale });

export const ASSETS = {
  robot: svg('robot', 'assets/images/characters/robot.svg'),
  boss: svg('boss', 'assets/images/characters/boss.svg'),
  island: svg('island', 'assets/images/environment/island.svg'),
  cloud: svg('cloud', 'assets/images/environment/cloud.svg'),
  tree: svg('tree', 'assets/images/environment/tree.svg'),
  bldHeart: svg('bld-heart', 'assets/images/buildings/bld-heart.svg'),
  bldRule: svg('bld-rule', 'assets/images/buildings/bld-rule.svg'),
  bld5g: svg('bld-5g', 'assets/images/buildings/bld-5g.svg'),
  bldBoss: svg('bld-boss', 'assets/images/buildings/bld-boss.svg'),
  bldSafety: svg('bld-safety', 'assets/images/buildings/bld-safety.svg'),
  bldProcess: svg('bld-process', 'assets/images/buildings/bld-process.svg'),
  bldAi: svg('bld-ai', 'assets/images/buildings/bld-ai.svg'),
} as const satisfies Record<string, AssetDef>;

export type AssetKey = (typeof ASSETS)[keyof typeof ASSETS]['key'];

/** Public URL of an asset by key, for DOM <img> tags (same files Phaser loads). */
export const assetUrlByKey = (key: string): string =>
  (Object.values(ASSETS) as AssetDef[]).find((a) => a.key === key)?.url ?? ASSETS.island.url;
