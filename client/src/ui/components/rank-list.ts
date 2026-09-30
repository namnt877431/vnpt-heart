import type { GroupRank, RankEntry } from '../../data/types';
import { esc, fmt } from '../dom';
import { icon } from '../icons';
import { avatar } from './avatar';

const rankBadge = (rank: number): string =>
  `<span class="rank-badge ${rank <= 3 ? `rank-badge--${rank}` : ''}">${rank}</span>`;

export const playerRankList = (entries: RankEntry[], meId?: string, opts: { showRole?: boolean } = {}): string =>
  `<ol class="rank-list">${entries
    .map(
      (e) => `
      <li class="rank-row ${e.playerId === meId ? 'is-me' : ''}">
        ${rankBadge(e.rank)}
        ${avatar(e.name, 32)}
        <span class="rank-row__name">${esc(e.name)}${opts.showRole ? `<small>${esc(e.role)}</small>` : ''}</span>
        <span class="rank-row__score">${icon('star', 16, 'c-gold')}${fmt(e.score)}</span>
      </li>`,
    )
    .join('')}</ol>`;

export const groupRankList = (groups: GroupRank[], myGroupId?: string, opts: { showMembers?: boolean } = {}): string =>
  `<ol class="rank-list">${groups
    .map(
      (g) => `
      <li class="rank-row ${g.groupId === myGroupId ? 'is-me' : ''}">
        ${rankBadge(g.rank)}
        <span class="group-icon">${icon('users', 18)}</span>
        <span class="rank-row__name">${esc(g.name)}${opts.showMembers ? `<small>${g.members} thành viên</small>` : ''}</span>
        <span class="rank-row__score">${icon('star', 16, 'c-gold')}${fmt(g.avgScore)}</span>
      </li>`,
    )
    .join('')}</ol>`;
