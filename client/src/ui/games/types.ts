import type { SceneKey } from '../../core/screens';
import type { GameResult } from '../../core/scoring';
import type { GameSpec } from '../../data/game-types';
import type { RobotMood } from '../components/robot';

/** What a mini-game can ask of the level screen that hosts it. */
export interface GameApi {
  /** End the game. The host measures time and computes stars/points. */
  finish: (result: Omit<GameResult, 'timeMs'>) => void;
  /** Make the robot guide say something. */
  robot: (text: string, mood?: RobotMood) => void;
  /** Leave the level without finishing (e.g. "Rời trận"). */
  exit: () => void;
}

export interface GameHandle {
  destroy: () => void;
  /** Called when the level timer runs out; return the partial result. */
  timeout?: () => Omit<GameResult, 'timeMs'>;
}

/**
 * Contract for one mini-game type. To add a type: extend GameSpec in
 * data/game-types.ts, create ui/games/<type>.ts exporting a GameModule, and
 * register it in ui/games/index.ts.
 */
export interface GameModule<T extends GameSpec = GameSpec> {
  type: T['type'];
  /** Phaser scene behind the game (default 'Map', dimmed). */
  scene?: SceneKey;
  /** Hide the robot guide column (the game shows its own HUD). */
  fullScreen?: boolean;
  mount: (root: HTMLElement, spec: T, api: GameApi) => GameHandle;
}

/** Fisher–Yates shuffle that never returns the input order (when length > 1). */
export const shuffled = <T>(items: T[]): T[] => {
  if (items.length < 2) return [...items];
  let out: T[];
  do {
    out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
  } while (out.every((v, i) => v === items[i]));
  return out;
};
