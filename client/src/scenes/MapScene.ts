import Phaser from 'phaser';
import { ASSETS } from '../config/assets';
import { MAP_LAYOUTS, mapLayoutFor, type MapLayout, type MapLayoutMode } from '../config/layout';
import { COLORS, FONT_BODY, outlinedText } from '../config/theme';
import { fitWorldToRect } from '../core/display';
import { bus } from '../core/events';
import { stages } from '../data/mock';
import type { Stage } from '../data/types';

interface PathSegment {
  from: Phaser.Math.Vector2;
  ctrl: Phaser.Math.Vector2;
  to: Phaser.Math.Vector2;
  active: boolean;
}

interface Drifter {
  img: Phaser.GameObjects.Image;
  speed: number;
}

/** Island scale: the island texture is rendered at 2x (800×600), so 0.36 ≈ 288px wide in world units. */
const ISLAND_SCALE = 0.36;

/**
 * World map: floating islands (one per stage) linked by light bridges, drifting
 * clouds and the player's robot on the current stage. Pure presentation — it
 * only emits `stage:select`; the UI decides what to open.
 */
export class MapScene extends Phaser.Scene {
  private pathGfx!: Phaser.GameObjects.Graphics;
  private segments: PathSegment[] = [];
  private drifters: Drifter[] = [];
  private phase = 0;
  private mode: MapLayoutMode = 'landscape';
  private layout: MapLayout = MAP_LAYOUTS.landscape;

  constructor() {
    super('Map');
  }

  create(): void {
    this.segments = [];
    this.drifters = [];
    this.mode = this.currentMode();
    this.layout = MAP_LAYOUTS[this.mode];

    this.createClouds(0, 12, { alpha: 0.55, scale: [0.45, 0.8], speed: [6, 12] });
    this.pathGfx = this.add.graphics().setDepth(2);
    this.buildPaths();
    this.createSparkles();
    stages.forEach((s) => this.createIsland(s));
    this.createCloudSea();
    this.createClouds(60, 5, { alpha: 0.85, scale: [0.6, 0.9], speed: [14, 22], edgeOnly: true });

    const offLayout = bus.on('layout:safe-area', () => this.fitCamera());
    this.scale.on(Phaser.Scale.Events.RESIZE, this.fitCamera, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offLayout();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.fitCamera, this);
    });
    this.fitCamera();
  }

  update(_time: number, delta: number): void {
    this.phase = (this.phase + delta * 0.0006) % 1;
    this.drawPaths();
    for (const d of this.drifters) {
      d.img.x += (d.speed * delta) / 1000;
      if (d.img.x > this.layout.view.x + this.layout.view.width + 1000) d.img.x = this.layout.view.x - 1000;
    }
  }

  /** Layout mode that suits the current safe area (or the whole canvas). */
  private currentMode(): MapLayoutMode {
    const r = bus.latest('layout:safe-area');
    return r ? mapLayoutFor(r.width, r.height) : mapLayoutFor(this.scale.width, this.scale.height);
  }

  private fitCamera(): void {
    if (this.currentMode() !== this.mode) {
      this.scene.restart(); // orientation flipped: rebuild islands with the other layout
      return;
    }
    fitWorldToRect(
      this.cameras.main, this.scale.width, this.scale.height,
      this.layout.view, bus.latest('layout:safe-area'),
    );
  }

  // ---------------------------------------------------------------- islands

  private createIsland(stage: Stage): void {
    const pos = this.layout.positions[stage.id];
    const locked = stage.status === 'locked';
    const c = this.add.container(pos.x, pos.y).setDepth(10 + pos.y / 100);

    const island = this.add.image(0, 0, ASSETS.island.key).setOrigin(0.5, 0.33).setScale(ISLAND_SCALE);
    const treeL = this.add.image(-105, 8, ASSETS.tree.key).setOrigin(0.5, 1).setScale(0.36);
    const treeR = this.add.image(108, 12, ASSETS.tree.key).setOrigin(0.5, 1).setScale(0.3);
    const building = this.add.image(0, 16, stage.building).setOrigin(0.5, 1).setScale(0.52);
    if (locked) building.setTint(0xc4cee4);

    c.add([island, treeL, treeR, building]);

    if (stage.status === 'current') {
      const robot = this.add.image(-70, 22, ASSETS.robot.key).setOrigin(0.5, 1).setScale(0.2);
      c.add(robot);
      this.tweens.add({ targets: robot, scaleY: 0.21, y: 20, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      c.add(this.createPin(stage.id, -building.displayHeight - 30));
    }

    c.add(this.createLabel(stage, 96).setScale(this.layout.labelScale));

    // floating bob, staggered per island
    this.tweens.add({
      targets: c, y: pos.y - 9, duration: 2100 + stage.id * 260,
      yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: stage.id * 180,
    });

    for (const hit of [island, building]) {
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.05, duration: 140 }));
      hit.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 140 }));
      hit.on('pointerup', (p: Phaser.Input.Pointer) => {
        // Phaser also reports pointerup for releases over DOM UI on top of the canvas; ignore those.
        if (p.event?.target === this.game.canvas) bus.emit('stage:select', { stageId: stage.id });
      });
    }
  }

  /** Name plate under an island: number disc, title, subtitle, lock or stars. */
  private createLabel(stage: Stage, y: number): Phaser.GameObjects.Container {
    const locked = stage.status === 'locked';
    const w = 256;
    const h = 64;
    const label = this.add.container(0, y);
    const g = this.add.graphics();

    if (stage.status === 'current') {
      g.lineStyle(8, COLORS.cyan, 0.45).strokeRoundedRect(-w / 2 - 5, -5, w + 10, h + 10, 26);
    }
    g.fillStyle(0x061640, 0.35).fillRoundedRect(-w / 2 + 3, 6, w, h, 22);
    g.fillStyle(locked ? 0x31508f : COLORS.navy700, 1).fillRoundedRect(-w / 2, 0, w, h, 22);
    g.fillStyle(0xffffff, 0.14).fillRoundedRect(-w / 2 + 5, 4, w - 10, h / 2 - 4, 18);
    g.lineStyle(3, 0xffffff, 0.95).strokeRoundedRect(-w / 2, 0, w, h, 22);

    const nx = -w / 2 + 32;
    g.fillStyle(0xffffff, 1).fillCircle(nx, h / 2, 23);
    g.lineStyle(3, COLORS.navy900, 1).strokeCircle(nx, h / 2, 23);
    label.add(g);

    label.add(this.add.text(nx, h / 2 + 1, String(stage.id), { ...outlinedText(30, '#0e3a8c'), strokeThickness: 0 }).setOrigin(0.5));
    label.add(this.add.text(nx + 34, 7, stage.title, outlinedText(22)).setOrigin(0, 0));
    label.add(this.add.text(nx + 35, 38, stage.subtitle, {
      fontFamily: FONT_BODY, fontSize: '14px', fontStyle: '600', color: '#d6eaff', resolution: 2,
    }).setOrigin(0, 0));

    if (locked) {
      const lx = w / 2 - 28;
      const ly = h / 2;
      const lock = this.add.graphics();
      lock.fillStyle(COLORS.navy900, 1).fillCircle(lx, ly, 19);
      lock.lineStyle(2, 0xffffff, 0.9).strokeCircle(lx, ly, 19);
      lock.fillStyle(0xffffff, 1).fillRoundedRect(lx - 8, ly - 2, 16, 12, 3);
      lock.lineStyle(3, 0xffffff, 1).beginPath().arc(lx, ly - 3, 5.5, Math.PI, 0).strokePath();
      label.add(lock);
    } else {
      const stars = this.add.graphics();
      for (let i = 0; i < stage.maxStars; i++) {
        const sx = -24 + i * 24;
        stars.fillStyle(i < stage.starsEarned ? COLORS.gold : 0x9fb3d9, 1);
        stars.lineStyle(2, i < stage.starsEarned ? COLORS.goldDark : 0x5a6f99, 1);
        const pts = starPoints(sx, -6, 11, 5);
        stars.fillPoints(pts, true).strokePoints(pts, true);
      }
      label.add(stars);
    }
    return label;
  }

  /** Bouncing map pin marking the player's current stage. */
  private createPin(stageId: number, y: number): Phaser.GameObjects.Container {
    const pin = this.add.container(0, y);
    const g = this.add.graphics();
    g.fillStyle(0x061640, 0.3).fillEllipse(0, 58, 26, 8);
    g.fillStyle(COLORS.blue500, 1).fillCircle(0, 0, 28);
    g.fillTriangle(-20, 18, 20, 18, 0, 46);
    g.lineStyle(4, 0xffffff, 1).strokeCircle(0, 0, 28);
    g.fillStyle(0xffffff, 0.3).fillEllipse(-8, -12, 22, 10);
    pin.add(g);
    pin.add(this.add.text(0, 1, String(stageId), outlinedText(30)).setOrigin(0.5));
    this.tweens.add({ targets: pin, y: y - 14, duration: 520, yoyo: true, repeat: -1, ease: 'Quad.out' });
    return pin;
  }

  // ------------------------------------------------------------------ paths

  private buildPaths(): void {
    for (let i = 0; i < stages.length - 1; i++) {
      const a = this.layout.positions[stages[i].id];
      const b = this.layout.positions[stages[i + 1].id];
      const from = new Phaser.Math.Vector2(a.x, a.y + 30);
      const to = new Phaser.Math.Vector2(b.x, b.y + 30);
      const mid = from.clone().lerp(to, 0.5);
      const normal = to.clone().subtract(from).normalizeRightHand().normalize();
      const ctrl = mid.add(normal.scale(i % 2 === 0 ? 70 : -70));
      // the bridge leading out of the current stage is "active" (animated, glowing)
      this.segments.push({ from, ctrl, to, active: stages[i].status !== 'locked' });
    }
  }

  private drawPaths(): void {
    const g = this.pathGfx.clear();
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(), new Phaser.Math.Vector2(), new Phaser.Math.Vector2());
    for (const s of this.segments) {
      curve.p0.copy(s.from);
      curve.p1.copy(s.ctrl);
      curve.p2.copy(s.to);
      const count = Math.floor(curve.getLength() / 26);
      for (let i = 0; i < count; i++) {
        const t = s.active ? (i / count + this.phase) % 1 : i / count;
        const p = curve.getPoint(t);
        if (s.active) {
          g.fillStyle(COLORS.cyan, 0.25).fillCircle(p.x, p.y, 10);
          g.fillStyle(0xffffff, 1).fillCircle(p.x, p.y, 5);
        } else {
          g.fillStyle(0xffffff, 0.5).fillCircle(p.x, p.y, 4);
        }
      }
    }
  }

  // ------------------------------------------------------------- ambience

  private createClouds(
    depth: number,
    count: number,
    o: { alpha: number; scale: [number, number]; speed: [number, number]; edgeOnly?: boolean },
  ): void {
    const v = this.layout.view;
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(v.x - 1000, v.x + v.width + 1000);
      const bottom = v.y + v.height;
      const y = o.edgeOnly
        ? (i % 2 === 0 ? Phaser.Math.Between(v.y - 60, v.y + 60) : Phaser.Math.Between(bottom - 40, bottom + 60))
        : Phaser.Math.Between(v.y + 40, bottom - 40);
      const img = this.add.image(x, y, ASSETS.cloud.key)
        .setScale(Phaser.Math.FloatBetween(o.scale[0], o.scale[1]))
        .setAlpha(o.alpha)
        .setDepth(depth);
      this.drifters.push({ img, speed: Phaser.Math.Between(o.speed[0], o.speed[1]) });
    }
  }

  /** A band of clouds under the islands so they read as floating in the sky. */
  private createCloudSea(): void {
    const v = this.layout.view;
    for (let x = v.x - 1200; x < v.x + v.width + 1200; x += 230) {
      const img = this.add.image(x, v.y + v.height + 110 + (Math.abs(x) % 3) * 12, ASSETS.cloud.key)
        .setScale(0.95).setAlpha(0.95).setDepth(40);
      this.tweens.add({ targets: img, y: img.y - 10, duration: 3000 + (Math.abs(x) % 5) * 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  private createSparkles(): void {
    for (let i = 0; i < 16; i++) {
      const s = this.add.image(
        Phaser.Math.Between(this.layout.view.x + 80, this.layout.view.x + this.layout.view.width - 80),
        Phaser.Math.Between(this.layout.view.y + 60, this.layout.view.y + this.layout.view.height - 60),
        'sparkle',
      ).setDepth(5).setAlpha(0).setScale(0.4).setTint(i % 3 === 0 ? COLORS.gold : 0xdff6ff);
      this.tweens.add({
        targets: s, alpha: 0.9, scale: 0.8, duration: 900, yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 4000), repeatDelay: Phaser.Math.Between(1500, 4000),
      });
    }
  }
}

/** Points of a 5-point star centred on (cx, cy). */
function starPoints(cx: number, cy: number, outer: number, points: number): Phaser.Math.Vector2[] {
  const inner = outer * 0.45;
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return pts;
}
