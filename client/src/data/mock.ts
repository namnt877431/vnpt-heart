import type { Badge, GroupRank, Honor, Mission, Player, RankEntry, RankPeriod } from './types';

/**
 * Mock data for the demo. Replace with API calls (keep names/return types)
 * when the backend exists. Content marked TODO(content) is placeholder text
 * that the culture/HR team must replace with official VNPT material.
 * Live values (my points, my rank) are merged in data/selectors.ts.
 */

export const me: Player = {
  id: 'u-lan',
  name: 'Nguyễn Thị Lan',
  role: 'NV Kinh doanh',
  groupId: 'g-kd',
  basePoints: 1250,
  baseXp: 720,
};

const P = (rank: number, playerId: string, name: string, role: string, score: number): RankEntry => ({ rank, playerId, name, role, score });

/** Leaderboards per period (my own score is replaced with the live value). */
export const players: Record<RankPeriod, RankEntry[]> = {
  week: [
    P(1, 'u-dung', 'Lê Văn Dũng', 'NV Kỹ thuật', 2450),
    P(2, 'u-lan', 'Nguyễn Thị Lan', 'NV Kinh doanh', 2320),
    P(3, 'u-hoang', 'Trần Minh Hoàng', 'NV Hạ tầng', 2180),
    P(4, 'u-mai', 'Phạm Thị Mai', 'NV CSKH', 1950),
    P(5, 'u-anh', 'Hoàng Đức Anh', 'NV Văn phòng', 1820),
    P(6, 'u-thu', 'Đỗ Thị Thu', 'NV Kinh doanh', 1760),
    P(7, 'u-nam', 'Vũ Hải Nam', 'NV Kỹ thuật', 1690),
    P(8, 'u-ha', 'Ngô Thanh Hà', 'NV CSKH', 1610),
    P(9, 'u-son', 'Bùi Văn Sơn', 'NV Hạ tầng', 1540),
    P(10, 'u-linh', 'Mai Khánh Linh', 'NV Văn phòng', 1480),
  ],
  month: [
    P(1, 'u-mai', 'Phạm Thị Mai', 'NV CSKH', 9120),
    P(2, 'u-dung', 'Lê Văn Dũng', 'NV Kỹ thuật', 8870),
    P(3, 'u-lan', 'Nguyễn Thị Lan', 'NV Kinh doanh', 8410),
    P(4, 'u-hoang', 'Trần Minh Hoàng', 'NV Hạ tầng', 8020),
    P(5, 'u-nam', 'Vũ Hải Nam', 'NV Kỹ thuật', 7650),
    P(6, 'u-anh', 'Hoàng Đức Anh', 'NV Văn phòng', 7310),
    P(7, 'u-ha', 'Ngô Thanh Hà', 'NV CSKH', 6980),
    P(8, 'u-thu', 'Đỗ Thị Thu', 'NV Kinh doanh', 6540),
  ],
  season: [
    P(1, 'u-dung', 'Lê Văn Dũng', 'NV Kỹ thuật', 24300),
    P(2, 'u-mai', 'Phạm Thị Mai', 'NV CSKH', 23850),
    P(3, 'u-hoang', 'Trần Minh Hoàng', 'NV Hạ tầng', 22100),
    P(4, 'u-lan', 'Nguyễn Thị Lan', 'NV Kinh doanh', 21760),
    P(5, 'u-son', 'Bùi Văn Sơn', 'NV Hạ tầng', 19980),
    P(6, 'u-anh', 'Hoàng Đức Anh', 'NV Văn phòng', 18440),
  ],
};

export const monthlyGroups: GroupRank[] = [
  { rank: 1, groupId: 'g-kd', name: 'Nhóm Kinh doanh', avgScore: 1980, members: 24, participation: 92, periodBonus: 300 },
  { rank: 2, groupId: 'g-kt', name: 'Nhóm Kỹ thuật', avgScore: 1870, members: 31, participation: 84, periodBonus: 450 },
  { rank: 3, groupId: 'g-ht', name: 'Nhóm Hạ tầng', avgScore: 1760, members: 18, participation: 89, periodBonus: 150 },
  { rank: 4, groupId: 'g-vp', name: 'Nhóm Văn phòng', avgScore: 1680, members: 15, participation: 100, periodBonus: 0 },
  { rank: 5, groupId: 'g-cskh', name: 'Nhóm CSKH', avgScore: 1520, members: 22, participation: 73, periodBonus: 200 },
];

/** "Ngoài điểm số" honours (script IV.3). The 3-star one is filled live. */
export const honors: Honor[] = [
  { title: 'Tích cực nhất', icon: 'bolt', playerId: 'u-mai', name: 'Phạm Thị Mai', value: '42 lượt chơi' },
  { title: 'Tiến bộ nhất', icon: 'arrowUp', playerId: 'u-anh', name: 'Hoàng Đức Anh', value: 'Tăng 18 hạng' },
  { title: 'Nhiều thử thách nhất', icon: 'flag', playerId: 'u-dung', name: 'Lê Văn Dũng', value: '36 level' },
  { title: 'Nhiều 3 sao nhất', icon: 'star', playerId: 'u-hoang', name: 'Trần Minh Hoàng', value: '21 level ★★★' },
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
  id: 'm-daily-1', title: 'Hoàn thành 1 level bất kỳ hôm nay', progress: 0, target: 1, rewardStars: 50,
};

export const myGroup = {
  ...monthlyGroups[0],
  leader: 'Trần Văn Bình',
  weeklyGoal: { progress: 18, target: 24, label: 'thành viên hoàn thành Chặng 1' },
  roster: [
    { rank: 1, playerId: 'u-lan', name: 'Nguyễn Thị Lan', role: 'NV Kinh doanh', score: 2320 },
    { rank: 2, playerId: 'u-thu', name: 'Đỗ Thị Thu', role: 'NV Kinh doanh', score: 1760 },
    { rank: 3, playerId: 'u-binh', name: 'Trần Văn Bình', role: 'Trưởng nhóm', score: 1705 },
    { rank: 4, playerId: 'u-quan', name: 'Lý Minh Quân', role: 'NV Kinh doanh', score: 1490 },
    { rank: 5, playerId: 'u-yen', name: 'Phan Hải Yến', role: 'NV Kinh doanh', score: 1320 },
  ] satisfies RankEntry[],
};
