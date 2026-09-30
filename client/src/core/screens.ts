/** Screen ids used by the router, the nav bar and body[data-screen] CSS hooks. */
export type ScreenId = 'home' | 'play' | 'leaderboard' | 'badges' | 'group' | 'boss';

/** Which Phaser scene renders behind each screen. */
export type SceneKey = 'Map' | 'BossFight';
