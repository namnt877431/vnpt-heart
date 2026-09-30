import type { GameSpec, GameType } from '../../data/game-types';
import { binaryGame } from './binary';
import { bossGame } from './boss';
import { choiceGame } from './choice';
import { dialogueGame } from './dialogue';
import { escapeGame } from './escape';
import { hazardGame } from './hazard';
import { investigateGame } from './investigate';
import { matchGame } from './match';
import { orderGame } from './order';
import { spotErrorsGame } from './spot-errors';
import type { GameModule } from './types';

/** Registry: game type -> UI module. Every GameType must be listed. */
export const GAMES: { [K in GameType]: GameModule<Extract<GameSpec, { type: K }>> } = {
  choice: choiceGame,
  dialogue: dialogueGame,
  'spot-errors': spotErrorsGame,
  match: matchGame,
  order: orderGame,
  binary: binaryGame,
  hazard: hazardGame,
  investigate: investigateGame,
  escape: escapeGame,
  boss: bossGame,
};

export const gameFor = (spec: GameSpec): GameModule => GAMES[spec.type] as unknown as GameModule;
