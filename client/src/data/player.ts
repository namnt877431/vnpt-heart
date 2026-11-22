import type { MeResponse, Role } from '../../../shared/api-types';
import { me as mockMe } from './mock';
import type { Player } from './types';

/**
 * The logged-in player. Offline demo: the mock player. API mode: set from
 * GET /me at boot (main.ts) before any screen renders. `me` is a live binding,
 * so importers always see the current value.
 */
export let me: Player = mockMe;
export let myRole: Role = 'player';

export const setMe = (m: MeResponse) => {
  me = { id: m.id, name: m.name, role: m.title || m.unit, groupId: m.groupId ?? '', basePoints: 0, baseXp: 0 };
  myRole = m.role;
};
