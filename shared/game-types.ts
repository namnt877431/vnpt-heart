/**
 * Mini-game specs. A level is "content + one of these game types"; the UI
 * module for each type lives in src/ui/games/<type>.ts.
 *
 * Mapping to the script (docs/game-design.md):
 *   choice       – "Nếu là bạn?", "Ai xử lý đúng?", "Chọn bước tiếp theo", "Prompt Master"
 *   dialogue     – "Chọn cách nói" (branching conversation, mood meter)
 *   spot-errors  – "Soi lỗi" on an email / chat / AI output / procedure
 *   match        – "Kéo – thả / Ghép đúng" (pairs)
 *   order        – "Sắp xếp đúng quy trình", "Time Attack" (with timeLimitSec)
 *   binary       – "Đúng hay sai?", "AI hay làm thủ công?" (two bins)
 *   hazard       – "Tìm mối nguy" / "5S Detective" (click hotspots on a picture)
 *   investigate  – "Điều tra sự cố" (read clues, pick root cause)
 *   escape       – "Escape Room" (each right answer opens one lock)
 *   boss         – "Boss Challenge" (multi-step case; right answer = one shot)
 *
 * NOTE: answers ship to the browser in this demo. With a backend, the server
 * must hold `correct` / `answer` and grade submissions.
 */

export interface ChoiceQuestion {
  text: string;
  options: string[];
  correct: number;
  explain: string;
}

interface BaseSpec {
  /** Short title shown in the level header, e.g. "Nếu là bạn?" */
  title: string;
  /** Robot's opening line for this level. */
  intro: string;
  /** Optional countdown; finishing faster than `parTimeSec` is needed for 3 stars. */
  timeLimitSec?: number;
  parTimeSec?: number;
}

export interface ChoiceSpec extends BaseSpec {
  type: 'choice';
  questions: ChoiceQuestion[];
}

export interface DialogueSpec extends BaseSpec {
  type: 'dialogue';
  persona: { name: string; role: string };
  turns: {
    line: string;
    options: { text: string; /** 2 = best, 1 = ok, 0 = bad */ score: 0 | 1 | 2; reaction: string }[];
  }[];
  explain: string;
}

export type SpotPart = string | { bad: string; why: string };

export interface SpotErrorsSpec extends BaseSpec {
  type: 'spot-errors';
  format: 'email' | 'chat' | 'doc';
  header?: { from?: string; to?: string; subject?: string };
  /** Each line is a list of plain text and error parts. */
  lines: SpotPart[][];
}

export interface MatchSpec extends BaseSpec {
  type: 'match';
  leftLabel: string;
  rightLabel: string;
  pairs: { a: string; b: string; explain?: string }[];
}

export interface OrderSpec extends BaseSpec {
  type: 'order';
  /** Steps in the correct order (shuffled for play). */
  steps: string[];
  explain: string;
}

export interface BinarySpec extends BaseSpec {
  type: 'binary';
  /** Button labels, index 0 = left, 1 = right. */
  labels: [string, string];
  items: { text: string; answer: 0 | 1; explain: string }[];
}

export interface HazardSpec extends BaseSpec {
  type: 'hazard';
  /** Picture id in src/ui/games/hazard-scenes.ts */
  scene: 'workplace';
  hazards: { id: string; x: number; y: number; r: number; label: string; explain: string }[];
}

export interface InvestigateSpec extends BaseSpec {
  type: 'investigate';
  incident: string;
  clues: { kind: 'email' | 'chat' | 'data' | 'log'; title: string; body: string }[];
  /** How many clues must be opened before answering. */
  minClues: number;
  question: ChoiceQuestion;
}

export interface EscapeSpec extends BaseSpec {
  type: 'escape';
  locks: ChoiceQuestion[];
}

export interface BossSpec extends BaseSpec {
  type: 'boss';
  bossName: string;
  /** Each step = one stage of the big case, e.g. "Xác định vấn đề". */
  steps: (ChoiceQuestion & { label: string })[];
}

export type GameSpec =
  | ChoiceSpec
  | DialogueSpec
  | SpotErrorsSpec
  | MatchSpec
  | OrderSpec
  | BinarySpec
  | HazardSpec
  | InvestigateSpec
  | EscapeSpec
  | BossSpec;

export type GameType = GameSpec['type'];

/** Human names for game types (gallery, level header chips). */
export const GAME_TYPE_INFO: Record<GameType, { name: string; icon: string; blurb: string }> = {
  choice: { name: 'Nếu là bạn?', icon: 'bulb', blurb: 'Chọn cách xử lý đúng trong tình huống thực tế.' },
  dialogue: { name: 'Chọn cách nói', icon: 'chat', blurb: 'Hội thoại tương tác: mỗi câu trả lời thay đổi thái độ khách hàng.' },
  'spot-errors': { name: 'Soi lỗi', icon: 'search', blurb: 'Tìm càng nhiều lỗi càng tốt trong email, tin nhắn, văn bản.' },
  match: { name: 'Ghép đúng', icon: 'link', blurb: 'Ghép chuẩn mực với hành vi, quy định với tình huống.' },
  order: { name: 'Sắp xếp quy trình', icon: 'list', blurb: 'Kéo các bước về đúng thứ tự, có chế độ tính giờ.' },
  binary: { name: 'Đúng hay sai?', icon: 'check', blurb: 'Phân loại nhanh từng thẻ vào hai nhóm.' },
  hazard: { name: 'Tìm mối nguy', icon: 'shield', blurb: 'Tìm các nguy cơ mất an toàn trong hình ảnh.' },
  investigate: { name: 'Điều tra sự cố', icon: 'search', blurb: 'Thu thập manh mối, tìm nguyên nhân thật sự.' },
  escape: { name: 'Escape Room', icon: 'lock', blurb: 'Mỗi đáp án đúng mở một ổ khóa để thoát phòng.' },
  boss: { name: 'Boss Challenge', icon: 'target', blurb: 'Tình huống lớn nhiều bước, trả lời đúng để bắn Boss.' },
};
