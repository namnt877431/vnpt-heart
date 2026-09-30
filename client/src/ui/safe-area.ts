import { bus } from '../core/events';

/**
 * Publishes the bounds of `el` as `layout:safe-area` whenever it changes, so
 * the active Phaser scene can fit its world into the part of the screen the
 * HUD leaves free. Returns a cleanup that resets the area to full screen.
 */
export const watchSafeArea = (el: HTMLElement): (() => void) => {
  const publish = () => {
    const r = el.getBoundingClientRect();
    bus.emit('layout:safe-area', { x: r.left, y: r.top, width: r.width, height: r.height });
  };
  const ro = new ResizeObserver(publish);
  ro.observe(el);
  window.addEventListener('resize', publish);
  publish();
  return () => {
    ro.disconnect();
    window.removeEventListener('resize', publish);
    bus.emit('layout:safe-area', null);
  };
};
