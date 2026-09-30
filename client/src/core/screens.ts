/** Screen ids used by the router, the nav bar and body[data-screen] CSS hooks. */
export type ScreenId =
  | 'home' // world map of chapters
  | 'chapter' // Candy-Crush style level path of one chapter
  | 'level' // runs one mini-game (or boss) level
  | 'games' // "Kho trò chơi": try every mini-game type
  | 'leaderboard'
  | 'badges'
  | 'group'
  | 'share'; // "Chia sẻ tình huống thực tế" form

/** Which Phaser scene renders behind a screen. */
export type SceneKey = 'Map' | 'BossFight';
