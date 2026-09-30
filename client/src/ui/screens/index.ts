import type { ScreenId } from '../../core/screens';
import { badgesScreen } from './badges';
import { bossScreen } from './boss';
import { groupScreen } from './group';
import { homeScreen } from './home';
import { leaderboardScreen } from './leaderboard';
import { playScreen } from './play';
import type { ScreenModule } from './types';

/** Screen registry used by the router. Every ScreenId must have an entry. */
export const SCREENS: Record<ScreenId, ScreenModule> = {
  home: homeScreen,
  play: playScreen,
  leaderboard: leaderboardScreen,
  badges: badgesScreen,
  group: groupScreen,
  boss: bossScreen,
};
