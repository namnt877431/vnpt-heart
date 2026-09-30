import type { ScreenId } from './screens';

/** A rectangle in CSS pixels, relative to the viewport. */
export interface ViewRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Typed event bus — the single channel between the DOM UI layer (src/ui) and
 * Phaser scenes (src/scenes). Neither side imports the other directly.
 *
 * Add a new event: declare it in `GameEvents`, then `bus.emit` / `bus.on` it.
 */
export interface GameEvents {
  /** Preloader finished; UI may mount. */
  'game:ready': void;
  /** Router switched screens. */
  'screen:changed': { id: ScreenId };
  /** Player clicked an island on the map. */
  'stage:select': { stageId: number };
  /**
   * The current screen's free area (element with [data-safe-area]) that the
   * active scene should fit its world into; null = whole viewport.
   */
  'layout:safe-area': ViewRect | null;
  /** Boss HUD changed aim. */
  'boss:aim': { angle: number; power: number };
  /** Boss HUD pressed fire (demo only in MVP). */
  'boss:fire': { angle: number; power: number };
}

type Handler<T> = (payload: T) => void;

class EventBus {
  private handlers = new Map<keyof GameEvents, Set<Handler<never>>>();
  private last = new Map<keyof GameEvents, unknown>();

  on<K extends keyof GameEvents>(event: K, fn: Handler<GameEvents[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) this.handlers.set(event, (set = new Set()));
    set.add(fn as Handler<never>);
    return () => set!.delete(fn as Handler<never>);
  }

  emit<K extends keyof GameEvents>(event: K, ...payload: GameEvents[K] extends void ? [] : [GameEvents[K]]): void {
    this.last.set(event, payload[0]);
    this.handlers.get(event)?.forEach((fn) => (fn as Handler<GameEvents[K]>)(payload[0] as GameEvents[K]));
  }

  /** Most recent payload of an event (useful for scenes that start after it fired). */
  latest<K extends keyof GameEvents>(event: K): GameEvents[K] | undefined {
    return this.last.get(event) as GameEvents[K] | undefined;
  }
}

export const bus = new EventBus();
