import type { Chapter } from './content-types';
import type { GameSpec } from './game-types';

/**
 * "Mystery Level": the player flips a card and gets an instant reward or a
 * surprise mini-game drawn from the published content. Rolled by the server in
 * API mode (so rewards can't be forged), by the browser in the offline demo.
 */
export type MysteryId = 'gift' | 'double' | 'speed' | 'puzzle' | 'special' | 'miniboss';

export interface MysteryOutcome {
  id: MysteryId;
  emoji: string;
  title: string;
  text: string;
  /** Present when the outcome is a game to play. */
  spec?: GameSpec;
}

/** Bonus points of the 🎁 gift outcome. */
export const MYSTERY_GIFT_POINTS = 50;

export const rollMystery = (chapters: Chapter[], rand: () => number = Math.random): MysteryOutcome => {
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const specsOf = <K extends GameSpec['type']>(type: K) =>
    chapters.flatMap((c) => c.levels.map((l) => l.spec)).filter((s): s is Extract<GameSpec, { type: K }> => s?.type === type);

  const games: MysteryId[] = (['speed', 'puzzle', 'special', 'miniboss'] as const).filter(
    (id) => specsOf(({ speed: 'binary', puzzle: 'match', special: 'choice', miniboss: 'boss' } as const)[id]).length > 0,
  );
  const roll = pick<MysteryId>(['gift', 'double', ...games]);
  switch (roll) {
    case 'gift':
      return { id: roll, emoji: '🎁', title: 'Hộp quà', text: `Bạn nhận được +${MYSTERY_GIFT_POINTS} điểm thưởng!` };
    case 'double':
      return { id: roll, emoji: '💰', title: 'Double XP', text: 'Level tiếp theo bạn hoàn thành sẽ được nhân đôi điểm!' };
    case 'speed': {
      const s = pick(specsOf('binary'));
      return { id: roll, emoji: '⚡', title: 'Thử thách tốc độ', text: '20 giây, phân loại thật nhanh!', spec: { ...s, title: 'Thử thách tốc độ', timeLimitSec: 20, parTimeSec: 15 } };
    }
    case 'puzzle':
      return { id: roll, emoji: '🧩', title: 'Puzzle', text: 'Ghép các cặp thẻ đúng với nhau.', spec: { ...pick(specsOf('match')), title: 'Puzzle bí ẩn' } };
    case 'special': {
      const s = pick(specsOf('choice'));
      return { id: roll, emoji: '🎯', title: 'Câu hỏi đặc biệt', text: 'Một câu hỏi, cơ hội ghi điểm lớn!', spec: { ...s, title: 'Câu hỏi đặc biệt', questions: [pick(s.questions)] } };
    }
    case 'miniboss': {
      const s = pick(specsOf('boss'));
      return { id: roll, emoji: '🔥', title: 'Mini Boss', text: `${s.bossName} (bản mini) xuất hiện!`, spec: { ...s, title: `Mini Boss: ${s.bossName}`, steps: s.steps.slice(0, 2) } };
    }
  }
};
