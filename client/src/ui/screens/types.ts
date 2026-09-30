import type { SceneKey, ScreenId } from '../../core/screens';

export interface ScreenParams {
  stageId?: number;
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
  /** Phaser scene rendered behind this screen. */
  scene: SceneKey;
  /** Render into `root`; return a cleanup function (remove listeners, timers). */
  mount: (root: HTMLElement, ctx: ScreenContext) => () => void;
}
