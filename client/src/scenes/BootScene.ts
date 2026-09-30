import Phaser from 'phaser';
import { FONT_BODY, FONT_DISPLAY } from '../config/theme';

/**
 * Waits for web fonts (Phaser Text rasterises once, so fonts must be ready
 * before any text object is created), then hands off to the Preloader.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const fonts = [`800 24px ${FONT_DISPLAY}`, `600 16px ${FONT_BODY}`];
    Promise.all(fonts.map((f) => document.fonts.load(f, 'Ảải')))
      .catch(() => undefined)
      .finally(() => this.scene.start('Preloader'));
  }
}
