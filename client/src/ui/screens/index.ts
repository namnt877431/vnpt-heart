import type { ScreenId } from '../../core/screens';
import { badgesScreen } from './badges';
import { chapterScreen } from './chapter';
import { gamesScreen } from './games';
import { groupScreen } from './group';
import { homeScreen } from './home';
import { leaderboardScreen } from './leaderboard';
import { levelScreen } from './level';
import { shareScreen } from './share';
import type { ScreenModule } from './types';

/** Screen registry used by the router. Every ScreenId must have an entry. */
export const SCREENS: Record<ScreenId, ScreenModule> = {
  home: homeScreen,
  chapter: chapterScreen,
  level: levelScreen,
  games: gamesScreen,
  leaderboard: leaderboardScreen,
  badges: badgesScreen,
  group: groupScreen,
  share: shareScreen,
};
