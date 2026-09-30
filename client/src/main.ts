import Phaser from 'phaser';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';
import './styles/games.css';
import { DPR } from './core/display';
import { bus } from './core/events';
import { BootScene } from './scenes/BootScene';
import { BossFightScene } from './scenes/BossFightScene';
import { MapScene } from './scenes/MapScene';
import { PreloaderScene } from './scenes/PreloaderScene';
import { createRouter } from './ui/router';
import { bindShell, mountShell } from './ui/shell';

/**
 * Two layers share the viewport:
 *   #game-container — Phaser canvas (world map, boss arena), full screen, behind
 *   #ui             — DOM HUD/screens on top (pointer-events pass through empty areas)
 * They talk only through `bus` (src/core/events.ts).
 */
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  transparent: true,
  width: window.innerWidth * DPR,
  height: window.innerHeight * DPR,
  scale: { mode: Phaser.Scale.NONE, zoom: 1 / DPR },
  scene: [BootScene, PreloaderScene, MapScene, BossFightScene],
});

window.addEventListener('resize', () => game.scale.resize(window.innerWidth * DPR, window.innerHeight * DPR));

bus.on('game:ready', () => {
  const ui = document.getElementById('ui')!;
  const screenRoot = mountShell(ui);
  const router = createRouter(game, screenRoot);
  bindShell(ui, router);
  bus.on('chapter:select', ({ chapterId }) => {
    // islands are only clickable on the home screen (elsewhere the map is a dimmed backdrop)
    if (router.current() === 'home') router.go('chapter', { chapterId });
  });
  router.go('home');
  document.body.classList.add('is-ready');
});

// Exposed for playtesting/debugging in dev builds only.
if (import.meta.env.DEV) Object.assign(window, { __PHASER_GAME__: game, __BUS__: bus });
