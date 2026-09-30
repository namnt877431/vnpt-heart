import type { SceneKey, ScreenId } from '../../core/screens';
import type { GameSpec, GameType } from '../../data/game-types';

export interface ScreenParams {
  chapterId?: string;
  levelId?: string;
  /** Gallery "Chơi thử": play the sample level of this type without saving progress. */
  sample?: GameType | 'mystery';
  /** Explicit spec (a Mystery Level outcome); recorded under `levelId` if present. */
  spec?: GameSpec;
}

export interface ScreenContext {
  go: (id: ScreenId, params?: ScreenParams) => void;
  params: ScreenParams;
}

/**
 * Contract every screen module implements. To add a screen:
 *   1. Add its id to ScreenId in core/screens.ts
 *   2. Create src/ui/screens/<name>.ts exporting a ScreenModule
 *   3. Register it in src/ui/screens/index.ts (and the nav in shell.ts if needed)
 */
export interface ScreenModule {
  id: ScreenId;
  /** Phaser scene rendered behind this screen (may depend on params, e.g. boss levels). */
  scene: SceneKey | ((params: ScreenParams) => SceneKey);
  /** Render into `root`; return a cleanup function (remove listeners, timers). */
  mount: (root: HTMLElement, ctx: ScreenContext) => () => void;
}
