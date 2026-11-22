import type { GameSpec, GameType } from '../../data/game-types';
import type { Field } from './engine';

/**
 * Admin form per game type (shared/game-types.ts) + the starting content of a
 * new level of that type. Adding a game type: add its fields and template here.
 */

const BASE: Field[] = [
  { kind: 'text', key: 'title', label: 'Tiêu đề level', placeholder: 'VD: Nếu là bạn?' },
  { kind: 'textarea', key: 'intro', label: 'Lời robot mở đầu', rows: 2 },
  { kind: 'number', key: 'parTimeSec', label: 'Thời gian chuẩn (giây)', hint: 'Xong trước mốc này + đúng hết = 3 sao. Để trống nếu không xét thời gian.', optional: true, min: 1 },
  { kind: 'number', key: 'timeLimitSec', label: 'Giới hạn thời gian (giây)', hint: 'Đồng hồ đếm ngược, hết giờ là kết thúc. Để trống nếu không giới hạn.', optional: true, min: 5 },
];

const question = (): Field[] => [
  { kind: 'textarea', key: 'text', label: 'Câu hỏi / tình huống', rows: 3 },
  { kind: 'options', key: 'options', correctKey: 'correct', label: 'Phương án' },
  { kind: 'textarea', key: 'explain', label: 'Giải thích (hiện sau khi chơi)', rows: 2 },
];

const newQuestion = () => ({ text: '', options: ['', '', ''], correct: 0, explain: '' });

export const SPEC_FIELDS: Record<GameType, Field[]> = {
  choice: [...BASE, { kind: 'list', key: 'questions', label: 'Câu hỏi', itemLabel: 'Câu', fields: question(), template: newQuestion }],
  dialogue: [
    ...BASE,
    {
      kind: 'group',
      key: 'persona',
      label: 'Nhân vật khách hàng',
      fields: [
        { kind: 'text', key: 'name', label: 'Tên' },
        { kind: 'text', key: 'role', label: 'Vai trò', placeholder: 'VD: Khách hàng doanh nghiệp' },
      ],
    },
    {
      kind: 'list',
      key: 'turns',
      label: 'Lượt hội thoại',
      itemLabel: 'Lượt',
      fields: [
        { kind: 'textarea', key: 'line', label: 'Khách hàng nói', rows: 2 },
        {
          kind: 'list',
          key: 'options',
          label: 'Cách trả lời',
          itemLabel: 'Cách',
          min: 2,
          fields: [
            { kind: 'textarea', key: 'text', label: 'Câu trả lời', rows: 2 },
            { kind: 'select', key: 'score', label: 'Mức độ', numeric: true, options: [{ value: 2, label: 'Tốt nhất (2 điểm)' }, { value: 1, label: 'Tạm được (1 điểm)' }, { value: 0, label: 'Chưa phù hợp (0 điểm)' }] },
            { kind: 'text', key: 'reaction', label: 'Phản ứng của khách' },
          ],
          template: () => ({ text: '', score: 1, reaction: '' }),
        },
      ],
      template: () => ({ line: '', options: [{ text: '', score: 2, reaction: '' }, { text: '', score: 0, reaction: '' }] }),
    },
    { kind: 'textarea', key: 'explain', label: 'Bài học rút ra', rows: 2 },
  ],
  'spot-errors': [
    ...BASE,
    { kind: 'select', key: 'format', label: 'Loại văn bản', options: [{ value: 'email', label: 'Email' }, { value: 'chat', label: 'Tin nhắn' }, { value: 'doc', label: 'Văn bản' }] },
    {
      kind: 'group',
      key: 'header',
      label: 'Tiêu đề email (nếu là email)',
      fields: [
        { kind: 'text', key: 'from', label: 'Người gửi' },
        { kind: 'text', key: 'to', label: 'Người nhận' },
        { kind: 'text', key: 'subject', label: 'Tiêu đề' },
      ],
    },
    { kind: 'spot', key: 'lines', label: 'Nội dung có lỗi' },
  ],
  match: [
    ...BASE,
    { kind: 'pair', key: '__labels', labels: ['Cột trái', 'Cột phải'], label: 'Tên hai cột' },
    {
      kind: 'list',
      key: 'pairs',
      label: 'Các cặp đúng',
      itemLabel: 'Cặp',
      min: 2,
      fields: [
        { kind: 'text', key: 'a', label: 'Bên trái' },
        { kind: 'text', key: 'b', label: 'Bên phải' },
        { kind: 'text', key: 'explain', label: 'Giải thích (tùy chọn)' },
      ],
      template: () => ({ a: '', b: '', explain: '' }),
    },
  ],
  order: [
    ...BASE,
    { kind: 'list', key: 'steps', label: 'Các bước (theo thứ tự ĐÚNG, game sẽ tự xáo trộn)', itemLabel: 'Bước', text: true, min: 2, template: () => '' },
    { kind: 'textarea', key: 'explain', label: 'Giải thích', rows: 2 },
  ],
  binary: [
    ...BASE,
    { kind: 'pair', key: 'labels', labels: ['Nút trái', 'Nút phải'], label: 'Hai lựa chọn' },
    {
      kind: 'list',
      key: 'items',
      label: 'Các thẻ',
      itemLabel: 'Thẻ',
      fields: [
        { kind: 'textarea', key: 'text', label: 'Nội dung thẻ', rows: 2 },
        { kind: 'select', key: 'answer', label: 'Đáp án', numeric: true, options: [{ value: 0, label: 'Nút trái' }, { value: 1, label: 'Nút phải' }] },
        { kind: 'text', key: 'explain', label: 'Giải thích' },
      ],
      template: () => ({ text: '', answer: 0, explain: '' }),
    },
  ],
  hazard: [...BASE, { kind: 'hazards', key: 'hazards', label: 'Các mối nguy trong ảnh' }],
  investigate: [
    ...BASE,
    { kind: 'textarea', key: 'incident', label: 'Mô tả sự cố', rows: 3 },
    {
      kind: 'list',
      key: 'clues',
      label: 'Manh mối',
      itemLabel: 'Manh mối',
      fields: [
        { kind: 'select', key: 'kind', label: 'Loại', options: [{ value: 'email', label: 'Email' }, { value: 'chat', label: 'Tin nhắn' }, { value: 'data', label: 'Số liệu' }, { value: 'log', label: 'Nhật ký hệ thống' }] },
        { kind: 'text', key: 'title', label: 'Tiêu đề' },
        { kind: 'textarea', key: 'body', label: 'Nội dung', rows: 3 },
      ],
      template: () => ({ kind: 'email', title: '', body: '' }),
    },
    { kind: 'number', key: 'minClues', label: 'Số manh mối phải mở trước khi kết luận', min: 0 },
    { kind: 'group', key: 'question', label: 'Câu hỏi kết luận', fields: question() },
  ],
  escape: [...BASE, { kind: 'list', key: 'locks', label: 'Ổ khóa (mỗi ổ 1 câu hỏi)', itemLabel: 'Ổ khóa', fields: question(), template: newQuestion }],
  boss: [
    ...BASE,
    { kind: 'text', key: 'bossName', label: 'Tên Boss', placeholder: 'VD: Quái Thờ Ơ' },
    {
      kind: 'list',
      key: 'steps',
      label: 'Các bước của tình huống lớn',
      itemLabel: 'Bước',
      fields: [{ kind: 'text', key: 'label', label: 'Tên bước', placeholder: 'VD: Xác định vấn đề' }, ...question()],
      template: () => ({ label: '', ...newQuestion() }),
    },
  ],
};

/** Starting content of a new level. */
export const newSpec = (type: GameType): GameSpec => {
  const base = { title: '', intro: '' };
  switch (type) {
    case 'choice': return { ...base, type, questions: [newQuestion()] };
    case 'dialogue': return { ...base, type, persona: { name: '', role: '' }, turns: [{ line: '', options: [{ text: '', score: 2, reaction: '' }, { text: '', score: 0, reaction: '' }] }], explain: '' };
    case 'spot-errors': return { ...base, type, format: 'email', header: { from: '', to: '', subject: '' }, lines: [['Viết nội dung ở đây, đánh dấu ', { bad: 'chỗ sai', why: 'giải thích' }]] };
    case 'match': return { ...base, type, leftLabel: '', rightLabel: '', pairs: [{ a: '', b: '' }, { a: '', b: '' }] };
    case 'order': return { ...base, type, steps: ['', '', ''], explain: '' };
    case 'binary': return { ...base, type, labels: ['Đúng', 'Sai'], items: [{ text: '', answer: 0, explain: '' }] };
    case 'hazard': return { ...base, type, scene: 'workplace', hazards: [{ id: 'h1', x: 400, y: 225, r: 40, label: '', explain: '' }] };
    case 'investigate': return { ...base, type, incident: '', clues: [{ kind: 'email', title: '', body: '' }], minClues: 1, question: newQuestion() };
    case 'escape': return { ...base, type, locks: [newQuestion()] };
    case 'boss': return { ...base, type, bossName: '', steps: [{ label: '', ...newQuestion() }] };
  }
};

/**
 * MatchSpec keeps the two column names as separate keys; the form edits them
 * as one pair (`__labels`). Convert before rendering / after editing.
 */
export const toFormDraft = (spec: GameSpec): Record<string, unknown> => {
  const d = structuredClone(spec) as unknown as Record<string, unknown>;
  if (spec.type === 'match') d.__labels = [spec.leftLabel, spec.rightLabel];
  return d;
};

export const fromFormDraft = (draft: Record<string, unknown>): GameSpec => {
  const d = structuredClone(draft);
  if (d.type === 'match') {
    const [l, r] = (d.__labels as string[] | undefined) ?? ['', ''];
    d.leftLabel = l;
    d.rightLabel = r;
  }
  delete d.__labels;
  // empty optional numbers -> absent
  for (const k of ['parTimeSec', 'timeLimitSec']) if (d[k] === undefined || d[k] === '' || Number.isNaN(d[k])) delete d[k];
  return d as unknown as GameSpec;
};
