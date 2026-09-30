import Phaser from 'phaser';
import { ASSETS } from '../config/assets';
import { COLORS, outlinedText } from '../config/theme';
import { bus } from '../core/events';

/** Loads every asset in the manifest, generates small procedural textures, then signals the UI. */
export class PreloaderScene extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload(): void {
    const { width, height } = this.scale;
    const barW = Math.min(420, width * 0.7);
    const x = (width - barW) / 2;
    const y = height / 2;

    this.add.text(width / 2, y - 48, 'VNPT HEART', outlinedText(40)).setOrigin(0.5);
    const frame = this.add.graphics();
    frame.fillStyle(COLORS.navy900, 0.6).fillRoundedRect(x - 4, y - 4, barW + 8, 26, 13);
    const bar = this.add.graphics();
    this.load.on('progress', (p: number) => {
      bar.clear().fillStyle(COLORS.gold, 1).fillRoundedRect(x, y, Math.max(18, barW * p), 18, 9);
    });

    for (const def of Object.values(ASSETS)) {
      if (def.type === 'svg') this.load.svg(def.key, def.url, { scale: def.svgScale ?? 1 });
      else this.load.image(def.key, def.url);
    }
  }

  create(): void {
    this.makeTextures();
    this.scene.start('Map');
    bus.emit('game:ready');
  }

  /** Tiny textures that are cheaper to draw than to ship as files. */
  private makeTextures(): void {
    const g = this.add.graphics();

    // 4-point sparkle
    g.fillStyle(0xffffff, 1);
    const star = [[16, 0], [20, 12], [32, 16], [20, 20], [16, 32], [12, 20], [0, 16], [12, 12]];
    g.fillPoints(star.map(([x, y]) => new Phaser.Math.Vector2(x, y)), true);
    g.generateTexture('sparkle', 32, 32);
    g.clear();

    // round particle
    g.fillStyle(0xffffff, 1).fillCircle(8, 8, 8);
    g.generateTexture('dot', 16, 16);
    g.clear();

    // projectile: glowing heart orb
    g.fillStyle(COLORS.gold, 0.35).fillCircle(20, 20, 20);
    g.fillStyle(COLORS.red, 1).fillCircle(20, 20, 12);
    g.fillStyle(0xffffff, 0.8).fillCircle(16, 16, 4);
    g.generateTexture('shot', 40, 40);

    g.destroy();
  }
}
