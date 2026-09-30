import type { GameSpec } from '../game-types';

export type LevelKind = 'normal' | 'mystery' | 'boss';

export interface LevelDef {
  /** Globally unique, e.g. "van-hoa-3". Used as the progress key. */
  id: string;
  kind: LevelKind;
  /** Absent for mystery levels (the outcome is rolled when opened). */
  spec?: GameSpec;
}

export interface Chapter {
  id: string;
  /** 1-based order on the world map. */
  order: number;
  title: string;
  subtitle: string;
  /** Asset key of the island building (config/assets.ts). */
  building: string;
  /** Robot's introduction when the player opens the chapter. */
  intro: string;
  levels: LevelDef[];
}
