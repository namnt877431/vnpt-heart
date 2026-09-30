import type Phaser from 'phaser';
import { bus } from '../core/events';
import type { SceneKey, ScreenId } from '../core/screens';
import { SCREENS } from './screens';
import type { ScreenParams } from './screens/types';

export interface Router {
  go: (id: ScreenId, params?: ScreenParams) => void;
  current: () => ScreenId;
}

/**
 * Screen router: swaps the DOM screen inside `root` and makes sure the Phaser
 * scene that screen needs is the one running. Sets body[data-screen] for CSS.
 */
export const createRouter = (game: Phaser.Game, root: HTMLElement): Router => {
  let current: ScreenId = 'home';
  let activeScene: SceneKey = 'Map'; // PreloaderScene starts Map
  let cleanup: (() => void) | null = null;

  const go = (id: ScreenId, params: ScreenParams = {}) => {
    const screen = SCREENS[id];
    cleanup?.();
    cleanup = null;

    if (screen.scene !== activeScene) {
      game.scene.stop(activeScene);
      game.scene.start(screen.scene);
      activeScene = screen.scene;
    }

    current = id;
    document.body.dataset.screen = id;
    root.innerHTML = '';
    root.scrollTop = 0;
    cleanup = screen.mount(root, { go, params });
    bus.emit('screen:changed', { id });
  };

  return { go, current: () => current };
};
