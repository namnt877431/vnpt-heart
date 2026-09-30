import type { BossInfo, Badge, GroupRank, Mission, Player, QuizQuestion, RankEntry, Stage } from './types';

/**
 * MVP mock data. Replace with API calls (keep names/return types) when the
 * backend exists. Content marked TODO(content) is placeholder text that the
 * culture/HR team must replace with official VNPT material.
 */

export const me: Player = {
  id: 'u-lan',
  name: 'Nguyễn Thị Lan',
  role: 'NV Kinh doanh',
  groupId: 'g-kd',
  level: 3,
  xp: 320,
  xpNext: 600,
  stars: 1250,
  weeklyRank: 2,
};

export const stages: Stage[] = [
  {
    id: 1, title: 'VNPT HEART', subtitle: '8 chuẩn mực hành vi',
    description: 'Làm quen với 8 chuẩn mực hành vi của người VNPT qua các câu hỏi ngắn.',
    building: 'bld-heart', status: 'current', starsEarned: 2, maxStars: 3,
    questionCount: 10, rewardXp: 120, mode: 'quiz',
  },
  {
    id: 2, title: 'VNPT RULE', subtitle: 'Quy tắc ứng xử',
    description: 'Quy tắc ứng xử với khách hàng, đồng nghiệp và đối tác.',
    building: 'bld-rule', status: 'locked', starsEarned: 0, maxStars: 3,
    questionCount: 12, rewardXp: 150, mode: 'quiz',
  },
  {
    id: 3, title: 'THỰC CHIẾN', subtitle: 'Tình huống thực tế',
    description: 'Xử lý các tình huống thực tế tại quầy giao dịch và hiện trường kỹ thuật.',
    building: 'bld-5g', status: 'locked', starsEarned: 0, maxStars: 3,
    questionCount: 12, rewardXp: 180, mode: 'quiz',
  },
  {
    id: 4, title: 'BOSS FIGHT', subtitle: 'Thử thách nâng cao',
    description: 'Trả lời đúng để giành lượt bắn, hạ gục Quái Thờ Ơ theo phong cách bắn góc.',
    building: 'bld-boss', status: 'locked', starsEarned: 0, maxStars: 3,
    questionCount: 8, rewardXp: 250, mode: 'boss',
  },
  {
    id: 5, title: 'VNPT MASTER', subtitle: 'Chinh phục toàn diện',
    description: 'Tổng hợp toàn bộ kiến thức, trở thành Đại sứ văn hóa VNPT Đắk Lắk.',
    building: 'bld-master', status: 'locked', starsEarned: 0, maxStars: 3,
    questionCount: 15, rewardXp: 400, mode: 'quiz',
  },
];

export const weeklyPlayers: RankEntry[] = [
  { rank: 1, playerId: 'u-dung', name: 'Lê Văn Dũng', role: 'NV Kỹ thuật', score: 2450 },
  { rank: 2, playerId: 'u-lan', name: 'Nguyễn Thị Lan', role: 'NV Kinh doanh', score: 2320 },
  { rank: 3, playerId: 'u-hoang', name: 'Trần Minh Hoàng', role: 'NV Hạ tầng', score: 2180 },
  { rank: 4, playerId: 'u-mai', name: 'Phạm Thị Mai', role: 'NV CSKH', score: 1950 },
  { rank: 5, playerId: 'u-anh', name: 'Hoàng Đức Anh', role: 'NV Văn phòng', score: 1820 },
  { rank: 6, playerId: 'u-thu', name: 'Đỗ Thị Thu', role: 'NV Kinh doanh', score: 1760 },
  { rank: 7, playerId: 'u-nam', name: 'Vũ Hải Nam', role: 'NV Kỹ thuật', score: 1690 },
  { rank: 8, playerId: 'u-ha', name: 'Ngô Thanh Hà', role: 'NV CSKH', score: 1610 },
  { rank: 9, playerId: 'u-son', name: 'Bùi Văn Sơn', role: 'NV Hạ tầng', score: 1540 },
  { rank: 10, playerId: 'u-linh', name: 'Mai Khánh Linh', role: 'NV Văn phòng', score: 1480 },
];

export const monthlyGroups: GroupRank[] = [
  { rank: 1, groupId: 'g-kd', name: 'Nhóm Kinh doanh', avgScore: 1980, members: 24 },
  { rank: 2, groupId: 'g-kt', name: 'Nhóm Kỹ thuật', avgScore: 1870, members: 31 },
  { rank: 3, groupId: 'g-ht', name: 'Nhóm Hạ tầng', avgScore: 1760, members: 18 },
  { rank: 4, groupId: 'g-vp', name: 'Nhóm Văn phòng', avgScore: 1680, members: 15 },
  { rank: 5, groupId: 'g-cskh', name: 'Nhóm CSKH', avgScore: 1520, members: 22 },
];

// TODO(content): badge names are placeholders; replace with the official 8 behaviour standards.
export const badges: Badge[] = [
  { id: 'b1', name: 'Tận tâm', description: 'Hoàn thành chuẩn mực 1', icon: 'heart', earned: true, progress: 1 },
  { id: 'b2', name: 'Chính trực', description: 'Hoàn thành chuẩn mực 2', icon: 'shield', earned: true, progress: 1 },
  { id: 'b3', name: 'Hợp tác', description: 'Hoàn thành chuẩn mực 3', icon: 'users', earned: true, progress: 1 },
  { id: 'b4', name: 'Sáng tạo', description: 'Hoàn thành chuẩn mực 4', icon: 'bulb', earned: false, progress: 0.6 },
  { id: 'b5', name: 'Chuyên nghiệp', description: 'Hoàn thành chuẩn mực 5', icon: 'medal', earned: false, progress: 0.3 },
  { id: 'b6', name: 'Trách nhiệm', description: 'Hoàn thành chuẩn mực 6', icon: 'flag', earned: false, progress: 0 },
  { id: 'b7', name: 'Tôn trọng', description: 'Hoàn thành chuẩn mực 7', icon: 'smile', earned: false, progress: 0 },
  { id: 'b8', name: 'Vì khách hàng', description: 'Hoàn thành chuẩn mực 8', icon: 'star', earned: false, progress: 0 },
  { id: 'b9', name: 'Chuỗi 7 ngày', description: 'Đăng nhập 7 ngày liên tiếp', icon: 'bolt', earned: true, progress: 1 },
  { id: 'b10', name: 'Diệt Boss', description: 'Hạ gục Quái Thờ Ơ', icon: 'target', earned: false, progress: 0 },
  { id: 'b11', name: 'Top tuần', description: 'Lọt top 3 BXH tuần', icon: 'trophy', earned: true, progress: 1 },
  { id: 'b12', name: 'VNPT Master', description: 'Chinh phục cả 5 ải', icon: 'crown', earned: false, progress: 0.2 },
];

export const todayMission: Mission = {
  id: 'm-daily-1', title: 'Hoàn thành 1 thử thách Ải 02', progress: 0, target: 1, rewardStars: 50,
};

// TODO(content): sample question; replace with the official question bank.
export const sampleQuestion: QuizQuestion = {
  id: 'q-1-3', stageId: 1, index: 3, total: 10, timeLimitSec: 30,
  text: 'Khách hàng đến quầy phàn nàn gay gắt vì mạng bị gián đoạn nhiều ngày. Bạn nên làm gì đầu tiên?',
  options: [
    'Giải thích ngay rằng lỗi do bộ phận kỹ thuật, không phải do mình',
    'Lắng nghe, xin lỗi và ghi nhận đầy đủ thông tin sự cố của khách hàng',
    'Đề nghị khách hàng tự gọi tổng đài để được hỗ trợ',
    'Hẹn khách quay lại hôm khác khi có cán bộ kỹ thuật',
  ],
  hint: 'Hãy đặt mình vào vị trí khách hàng: điều họ cần trước tiên là được lắng nghe.',
};

export const boss: BossInfo = { name: 'Quái Thờ Ơ', hp: 780, hpMax: 1000 };

export const myGroup = {
  ...monthlyGroups[0],
  leader: 'Trần Văn Bình',
  weeklyGoal: { progress: 18, target: 24, label: 'thành viên hoàn thành Ải 01' },
  roster: [
    { rank: 1, playerId: 'u-lan', name: 'Nguyễn Thị Lan', role: 'NV Kinh doanh', score: 2320 },
    { rank: 2, playerId: 'u-thu', name: 'Đỗ Thị Thu', role: 'NV Kinh doanh', score: 1760 },
    { rank: 3, playerId: 'u-binh', name: 'Trần Văn Bình', role: 'Trưởng nhóm', score: 1705 },
    { rank: 4, playerId: 'u-quan', name: 'Lý Minh Quân', role: 'NV Kinh doanh', score: 1490 },
    { rank: 5, playerId: 'u-yen', name: 'Phan Hải Yến', role: 'NV Kinh doanh', score: 1320 },
  ] satisfies RankEntry[],
};
