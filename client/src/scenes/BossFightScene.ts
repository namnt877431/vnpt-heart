import Phaser from 'phaser';
import { ASSETS } from '../config/assets';
import { BOSS_BLEED, BOSS_VIEW } from '../config/layout';
import { COLORS, outlinedText } from '../config/theme';
import { fitWorldToRect } from '../core/display';
import { bus } from '../core/events';

/** Gunny-style artillery tuning. power (0-100) × POWER_TO_SPEED = launch speed in world px/s. */
const GRAVITY = 600;
const POWER_TO_SPEED = 11;
const WIND_ACCEL = 18; // px/s² per wind unit

const PLAYER_X = 300;
const BOSS_X = 1250;

/**
 * Boss Challenge arena. Presentation only — the turn/answer logic lives in
 * the HUD (src/ui/games/boss.ts). Listens: boss:aim, boss:fire, boss:attack,
 * boss:defeated. Emits: boss:shot-landed.
 */
export class BossFightScene extends Phaser.Scene {
  private cannon!: Phaser.GameObjects.Container;
  private aimGfx!: Phaser.GameObjects.Graphics;
  private bossImg!: Phaser.GameObjects.Image;
  private robot!: Phaser.GameObjects.Image;
  private angle = 45;
  private power = 70;
  private wind = 0;
  private damage = 0;
  private shot: { img: Phaser.GameObjects.Image; vx: number; vy: number } | null = null;

  constructor() {
    super('BossFight');
  }

  create(): void {
    this.shot = null;
    this.drawBackdrop();
    this.drawTerrain();
    this.createPlayer();
    this.createBoss();
    this.aimGfx = this.add.graphics().setDepth(30);
    this.drawAim();

    const offs = [
      bus.on('layout:safe-area', () => this.fitCamera()),
      bus.on('boss:aim', ({ angle, power, wind }) => {
        this.angle = angle;
        this.power = power;
        this.wind = wind;
        this.drawAim();
      }),
      bus.on('boss:fire', ({ angle, power, damage }) => this.fire(angle, power, damage)),
      bus.on('boss:attack', () => this.bossAttack()),
      bus.on('boss:defeated', () => this.bossDefeated()),
    ];
    this.scale.on(Phaser.Scale.Events.RESIZE, this.fitCamera, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offs.forEach((off) => off());
      this.scale.off(Phaser.Scale.Events.RESIZE, this.fitCamera, this);
    });
    this.fitCamera();
  }

  update(_t: number, delta: number): void {
    if (!this.shot) return;
    const dt = delta / 1000;
    const s = this.shot;
    s.vx += this.wind * WIND_ACCEL * dt;
    s.vy += GRAVITY * dt;
    s.img.x += s.vx * dt;
    s.img.y += s.vy * dt;
    s.img.rotation += dt * 8;

    if (Math.random() < 0.6) this.puff(s.img.x, s.img.y, 0xffe08a, 6, 250);

    const bossCenter = new Phaser.Math.Vector2(BOSS_X, groundY(BOSS_X) - 200);
    if (Phaser.Math.Distance.BetweenPoints(s.img, bossCenter) < 150) {
      this.explode(s.img.x, s.img.y, true);
    } else if (s.img.y >= groundY(s.img.x) || s.img.x < -200 || s.img.x > 1600 + BOSS_BLEED) {
      this.explode(s.img.x, Math.min(s.img.y, groundY(s.img.x)), false);
    }
  }

  private fitCamera(): void {
    fitWorldToRect(
      this.cameras.main, this.scale.width, this.scale.height,
      BOSS_VIEW, bus.latest('layout:safe-area'), 0,
    );
  }

  // ----------------------------------------------------------------- arena

  private drawBackdrop(): void {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0xffffff, 0.35).fillCircle(1380, 140, 90);
    g.fillStyle(0xfff6c8, 0.9).fillCircle(1380, 140, 56);

    // distant skyline silhouette (Buôn Ma Thuột vibe), then two hill layers
    g.fillStyle(0xbfe0fa, 1);
    const blocks = [[80, 90], [140, 150], [200, 110], [520, 180], [560, 120], [900, 140], [960, 200], [1020, 110], [1460, 160]];
    for (const [x, h] of blocks) g.fillRect(x, 640 - h, 50, h);
    g.fillTriangle(760, 640, 800, 380, 840, 640); // tower spire
    g.fillStyle(0xa9d3f5, 1).fillPoints(wave(620, 60, 0.004, 0), true);
    g.fillStyle(0x8cc2ee, 1).fillPoints(wave(680, 40, 0.007, 2), true);
  }

  private drawTerrain(): void {
    const top: Phaser.Math.Vector2[] = [];
    for (let x = -BOSS_BLEED; x <= 1600 + BOSS_BLEED; x += 20) top.push(new Phaser.Math.Vector2(x, groundY(x)));
    const body = [...top, new Phaser.Math.Vector2(1600 + BOSS_BLEED, 1600), new Phaser.Math.Vector2(-BOSS_BLEED, 1600)];

    const g = this.add.graphics().setDepth(10);
    g.fillStyle(0x7a5638, 1).fillPoints(body, true);
    g.lineStyle(26, 0x4fbb3f, 1).strokePoints(top.map((p) => p.clone().add(new Phaser.Math.Vector2(0, 10))));
    g.lineStyle(6, 0x2f8a2a, 1).strokePoints(top.map((p) => p.clone().add(new Phaser.Math.Vector2(0, 24))));
    g.lineStyle(4, 0xa3e36b, 1).strokePoints(top);
    // pebbles
    g.fillStyle(0x5c3f28, 1);
    for (let x = -BOSS_BLEED; x < 1600 + BOSS_BLEED; x += 70) g.fillEllipse(x + (x % 37), groundY(x) + 70 + (x % 50), 22, 12);
  }

  private createPlayer(): void {
    const y = groundY(PLAYER_X);
    this.add.ellipse(PLAYER_X, y + 4, 150, 22, 0x000000, 0.2).setDepth(19);
    const robot = this.add.image(PLAYER_X, y + 6, ASSETS.robot.key).setOrigin(0.5, 1).setScale(0.4).setDepth(20);
    this.robot = robot;
    this.tweens.add({ targets: robot, scaleY: 0.41, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.cannon = this.add.container(PLAYER_X + 40, y - 70).setDepth(21);
    const g = this.add.graphics();
    g.fillStyle(COLORS.navy900, 1).fillRoundedRect(-6, -16, 104, 32, 14);
    g.fillStyle(COLORS.gold, 1).fillRoundedRect(-2, -12, 96, 24, 11);
    g.fillStyle(0xffffff, 0.5).fillRoundedRect(4, -9, 80, 6, 3);
    g.fillStyle(COLORS.red, 1).fillRoundedRect(78, -15, 22, 30, 6);
    g.fillStyle(COLORS.navy700, 1).fillCircle(0, 0, 20);
    g.lineStyle(3, 0xffffff, 1).strokeCircle(0, 0, 20);
    this.cannon.add(g);

    this.add.text(PLAYER_X, y - 280, 'BẠN', outlinedText(24)).setOrigin(0.5).setDepth(22);
  }

  private createBoss(): void {
    const y = groundY(BOSS_X);
    this.add.ellipse(BOSS_X, y + 6, 360, 40, 0x000000, 0.22).setDepth(19);
    this.bossImg = this.add.image(BOSS_X, y + 10, ASSETS.boss.key).setOrigin(0.5, 1).setScale(0.78).setDepth(20);
    this.tweens.add({ targets: this.bossImg, scaleY: 0.81, scaleX: 0.76, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  // --------------------------------------------------------------- aiming

  private muzzle(): { x: number; y: number; vx: number; vy: number } {
    const rad = Phaser.Math.DegToRad(this.angle);
    const speed = this.power * POWER_TO_SPEED;
    return {
      x: this.cannon.x + Math.cos(rad) * 100,
      y: this.cannon.y - Math.sin(rad) * 100,
      vx: Math.cos(rad) * speed,
      vy: -Math.sin(rad) * speed,
    };
  }

  /** Short dotted preview of the arc (Gunny shows only the first part of the trajectory). */
  private drawAim(): void {
    this.cannon.rotation = -Phaser.Math.DegToRad(this.angle);
    const m = this.muzzle();
    const g = this.aimGfx.clear();
    const steps = 14;
    for (let i = 1; i <= steps; i++) {
      const t = i * 0.07;
      const x = m.x + m.vx * t + 0.5 * this.wind * WIND_ACCEL * t * t;
      const y = m.y + m.vy * t + 0.5 * GRAVITY * t * t;
      const a = 1 - i / (steps + 2);
      g.fillStyle(0xffffff, a).fillCircle(x, y, 7 - i * 0.3);
      g.lineStyle(2, COLORS.navy900, a * 0.6).strokeCircle(x, y, 7 - i * 0.3);
    }
  }

  // ---------------------------------------------------------- demo shot

  private fire(angle: number, power: number, damage: number): void {
    if (this.shot) return;
    this.angle = angle;
    this.power = power;
    this.damage = damage;
    this.drawAim();
    const m = this.muzzle();
    const img = this.add.image(m.x, m.y, 'shot').setDepth(40);
    this.shot = { img, vx: m.vx, vy: m.vy };
    this.aimGfx.setVisible(false);
    this.tweens.add({ targets: this.cannon, x: this.cannon.x - 10, duration: 70, yoyo: true });
  }

  private explode(x: number, y: number, hitBoss: boolean): void {
    this.shot?.img.destroy();
    this.shot = null;
    this.cameras.main.shake(220, 0.006);

    const colors = [COLORS.gold, 0xff8a1f, COLORS.red, 0xffffff];
    for (let i = 0; i < 22; i++) {
      const p = this.add.image(x, y, 'dot').setDepth(45).setTint(colors[i % colors.length]).setScale(Phaser.Math.FloatBetween(0.6, 1.4));
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const d = Phaser.Math.Between(40, 130);
      this.tweens.add({
        targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 0.1,
        duration: Phaser.Math.Between(350, 650), ease: 'Cubic.out', onComplete: () => p.destroy(),
      });
    }
    const ring = this.add.circle(x, y, 20, 0xffffff, 0).setStrokeStyle(6, 0xffe08a).setDepth(44);
    this.tweens.add({ targets: ring, radius: 110, alpha: 0, duration: 400, onComplete: () => ring.destroy() });

    if (hitBoss) {
      this.tweens.add({ targets: this.bossImg, alpha: 0.35, duration: 60, yoyo: true, repeat: 3 });
      this.floatText(BOSS_X, groundY(BOSS_X) - 440, `-${this.damage}`, '#ff4d5e');
    } else {
      this.floatText(x, y - 60, 'TRƯỢT!', '#ffffff');
    }
    this.time.delayedCall(700, () => {
      this.aimGfx.setVisible(true);
      bus.emit('boss:shot-landed', { hit: hitBoss });
    });
  }

  /** Wrong answer: the boss lobs a storm orb at the player. */
  private bossAttack(): void {
    const from = { x: BOSS_X - 120, y: groundY(BOSS_X) - 260 };
    const to = { x: PLAYER_X, y: groundY(PLAYER_X) - 120 };
    const orb = this.add.image(from.x, from.y, 'dot').setTint(0x7a2fd8).setScale(3).setDepth(40);
    this.tweens.add({ targets: this.bossImg, x: BOSS_X - 30, duration: 120, yoyo: true });
    this.tweens.addCounter({
      from: 0, to: 1, duration: 800, ease: 'Sine.in',
      onUpdate: (tw) => {
        const t = tw.getValue() ?? 0;
        orb.x = Phaser.Math.Linear(from.x, to.x, t);
        orb.y = Phaser.Math.Linear(from.y, to.y, t) - Math.sin(t * Math.PI) * 220;
        if (Math.random() < 0.5) this.puff(orb.x, orb.y, 0xb79bff, 7, 300);
      },
      onComplete: () => {
        orb.destroy();
        this.cameras.main.shake(260, 0.01);
        this.tweens.add({ targets: this.robot, alpha: 0.3, duration: 70, yoyo: true, repeat: 3 });
        this.floatText(to.x, to.y - 180, '-1 ♥', '#b79bff');
        for (let i = 0; i < 14; i++) {
          const p = this.add.image(to.x, to.y, 'dot').setDepth(45).setTint(i % 2 ? 0x7a2fd8 : 0xffe08a);
          const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
          this.tweens.add({ targets: p, x: to.x + Math.cos(a) * 90, y: to.y + Math.sin(a) * 90, alpha: 0, scale: 0.1, duration: 500, onComplete: () => p.destroy() });
        }
      },
    });
  }

  /** Boss HP hit 0: wobble, burst, vanish. */
  private bossDefeated(): void {
    const b = this.bossImg;
    this.tweens.killTweensOf(b);
    this.tweens.add({
      targets: b, angle: { from: -6, to: 6 }, duration: 80, yoyo: true, repeat: 6,
      onComplete: () => {
        const cx = b.x;
        const cy = b.y - b.displayHeight / 2;
        for (let i = 0; i < 40; i++) {
          const p = this.add.image(cx, cy, 'sparkle').setDepth(45).setTint([0xffe08a, 0xffffff, 0x8a5cf0][i % 3]);
          const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
          const d = Phaser.Math.Between(80, 260);
          this.tweens.add({ targets: p, x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, alpha: 0, angle: 180, duration: 900, ease: 'Cubic.out', onComplete: () => p.destroy() });
        }
        this.tweens.add({ targets: b, scale: 0, alpha: 0, duration: 450, ease: 'Back.in' });
        this.cameras.main.flash(250, 255, 255, 255);
      },
    });
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    const t = this.add.text(x, y, text, outlinedText(52, color, '#0a2266')).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: t, y: y - 90, alpha: 0, duration: 1100, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }

  private puff(x: number, y: number, tint: number, size: number, life: number): void {
    const p = this.add.image(x, y, 'dot').setDepth(39).setTint(tint).setScale(size / 8).setAlpha(0.8);
    this.tweens.add({ targets: p, alpha: 0, scale: 0.1, duration: life, onComplete: () => p.destroy() });
  }
}

/** Terrain height function: gentle hills, flattened under the player and the boss. */
function groundY(x: number): number {
  const hills = 700 + Math.sin(x / 190) * 34 + Math.sin(x / 73 + 1) * 14;
  const flat = (cx: number, halfW: number, y: number) => {
    const d = Math.abs(x - cx);
    if (d > halfW + 80) return null;
    const t = Phaser.Math.Clamp((d - halfW) / 80, 0, 1);
    return Phaser.Math.Linear(y, hills, t);
  };
  return flat(PLAYER_X, 120, 690) ?? flat(BOSS_X, 190, 700) ?? hills;
}

/** Closed polygon for a background hill band. */
function wave(baseY: number, amp: number, freq: number, phase: number): Phaser.Math.Vector2[] {
  const pts: Phaser.Math.Vector2[] = [];
  for (let x = -BOSS_BLEED; x <= 1600 + BOSS_BLEED; x += 40) {
    pts.push(new Phaser.Math.Vector2(x, baseY - Math.abs(Math.sin(x * freq + phase)) * amp - Math.sin(x * freq * 2.3) * amp * 0.3));
  }
  pts.push(new Phaser.Math.Vector2(1600 + BOSS_BLEED, 1600), new Phaser.Math.Vector2(-BOSS_BLEED, 1600));
  return pts;
}
