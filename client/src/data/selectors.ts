import type { BadgesResponse, GroupsResponse, HonorsResponse, LeaderboardResponse, MyGroupResponse } from '../../../shared/api-types';
import { earnedPoints, totalThreeStars } from '../core/progress';
import { API_MODE, apiGet } from './api';
import { badges, honors, monthlyGroups, myGroup as mockGroup, players } from './mock';
import { me } from './player';
import type { Badge, GroupRank, Honor, RankEntry, RankPeriod } from './types';

/**
 * Derived values for screens. Offline demo: mock data + this browser's
 * progress. API mode: fetched from the server (same types), so screens don't
 * care which one they get.
 */

export const XP_PER_LEVEL = 300;

export const playerStats = () => {
  const earned = earnedPoints();
  const xp = me.baseXp + earned;
  return {
    points: me.basePoints + earned,
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    xpInLevel: xp % XP_PER_LEVEL,
    xpNext: XP_PER_LEVEL,
  };
};

/** Demo: mock leaderboard of a period with my live score merged in and ranks recomputed. */
const mockLeaderboard = (period: RankPeriod): RankEntry[] => {
  const earned = earnedPoints();
  return players[period]
    .map((p) => (p.playerId === me.id ? { ...p, score: p.score + earned } : p))
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }));
};

export const fetchLeaderboard = async (period: RankPeriod): Promise<{ entries: RankEntry[]; me: RankEntry | null }> => {
  if (API_MODE) return apiGet<LeaderboardResponse>(`/leaderboard?period=${period}`);
  const entries = mockLeaderboard(period);
  return { entries, me: entries.find((e) => e.playerId === me.id) ?? null };
};

export const fetchGroups = async (): Promise<GroupRank[]> =>
  API_MODE ? (await apiGet<GroupsResponse>('/groups/ranking?period=month')).groups : monthlyGroups;

export const fetchMyGroup = async (): Promise<MyGroupResponse['group']> =>
  API_MODE ? (await apiGet<MyGroupResponse>('/groups/mine')).group : mockGroup;

export const fetchHonors = async (): Promise<Honor[]> => {
  if (API_MODE) return (await apiGet<HonorsResponse>('/honors')).honors;
  const mine = totalThreeStars() + 18;
  return honors.map((h) =>
    h.title === 'Nhiều 3 sao nhất' && mine > 21 ? { ...h, playerId: me.id, name: me.name, value: `${mine} level ★★★` } : h,
  );
};

export const fetchBadges = async (): Promise<Badge[]> => (API_MODE ? (await apiGet<BadgesResponse>('/badges/mine')).badges : badges);
