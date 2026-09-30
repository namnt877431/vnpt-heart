import type Phaser from 'phaser';
import type { WorldRect } from '../config/layout';
import type { ViewRect } from './events';

/**
 * The canvas is rendered at device-pixel resolution (game size = CSS size × DPR,
 * scale.zoom = 1/DPR) so text and SVG art stay sharp on HiDPI screens.
 * Scenes therefore work in device pixels; DOM rects must be multiplied by DPR.
 */
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

/**
 * Point `camera` so the world rectangle `view` fits inside `rect` (CSS px, or
 * the whole canvas when null), centred, with optional padding.
 */
export const fitWorldToRect = (
  camera: Phaser.Cameras.Scene2D.Camera,
  canvasW: number,
  canvasH: number,
  view: WorldRect,
  rect: ViewRect | null | undefined,
  padding = 8,
): void => {
  const r = rect
    ? { x: rect.x * DPR, y: rect.y * DPR, width: rect.width * DPR, height: rect.height * DPR }
    : { x: 0, y: 0, width: canvasW, height: canvasH };
  const pad = padding * DPR;
  const zoom = Math.max(0.1, Math.min((r.width - pad * 2) / view.width, (r.height - pad * 2) / view.height));
  camera.setZoom(zoom);
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  camera.centerOn(
    view.x + view.width / 2 - (cx - canvasW / 2) / zoom,
    view.y + view.height / 2 - (cy - canvasH / 2) / zoom,
  );
};
