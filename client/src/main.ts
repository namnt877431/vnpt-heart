import Phaser from 'phaser';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';
import './styles/games.css';
import type { AdminLevel, ContentResponse, MeResponse } from '../../shared/api-types';
import { DPR } from './core/display';
import { bus } from './core/events';
import { installErrorReporting } from './core/error-report';
import { loadProgress } from './core/progress';
import { API_MODE, ApiError, apiGet, setUnauthorizedHandler } from './data/api';
import { setChapters } from './data/content';
import type { GameSpec } from './data/game-types';
import { setMe } from './data/player';
import { BootScene } from './scenes/BootScene';
import { BossFightScene } from './scenes/BossFightScene';
import { MapScene } from './scenes/MapScene';
import { PreloaderScene } from './scenes/PreloaderScene';
import { closeGate, showGateMessage, showLogin } from './ui/login';
import { createRouter } from './ui/router';
import { bindShell, mountShell } from './ui/shell';

/**
 * Two layers share the viewport:
 *   #game-container — Phaser canvas (world map, boss arena), full screen, behind
 *   #ui             — DOM HUD/screens on top (pointer-events pass through empty areas)
 * They talk only through `bus` (src/core/events.ts).
 *
 * API mode boots in this order: session (or login form) → content → progress
 * → Phaser, so scenes and screens find their data ready.
 */

/** `?preview=<levelId>` (admin "Chơi thử"): open that draft level directly, nothing saved. */
let previewSpec: GameSpec | null = null;

const loadFromServer = async (): Promise<boolean> => {
  setUnauthorizedHandler(() => location.reload());
  const me = await apiGet<MeResponse>('/me').catch((e) => {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  });
  setMe(me ?? (await showLogin()));

  const content = await apiGet<ContentResponse>('/content');
  setChapters(content.chapters);
  await loadProgress(content.unlockAllChapters);

  const previewId = new URLSearchParams(location.search).get('preview');
  if (previewId) previewSpec = (await apiGet<AdminLevel>(`/admin/levels/${encodeURIComponent(previewId)}`)).spec;

  if (!content.chapters.length && !previewSpec) {
    showGateMessage('Sắp ra mắt!', 'Ban tổ chức đang chuẩn bị các chặng chơi. Bạn quay lại sau nhé.');
    return false;
  }
  closeGate();
  return true;
};

const startGame = () => {
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
    if (previewSpec) router.go('level', { spec: previewSpec });
    else router.go('home');
    document.body.classList.add('is-ready');
  });

  // Exposed for playtesting/debugging in dev builds only.
  if (import.meta.env.DEV) Object.assign(window, { __PHASER_GAME__: game, __BUS__: bus });
};

if (API_MODE) {
  installErrorReporting();
  loadFromServer()
    .then((ok) => ok && startGame())
    .catch((e: Error) => showGateMessage('Không kết nối được máy chủ', `${e.message}. Kiểm tra mạng rồi tải lại trang.`));
} else {
  startGame();
}
