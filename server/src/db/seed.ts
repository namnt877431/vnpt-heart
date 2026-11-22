import { CHAPTERS } from '../../../client/src/data/content';
import { badges as mockBadges, monthlyGroups } from '../../../client/src/data/mock';
import { hashPassword } from '../auth/password';
import type { Db } from './client';
import { badges, chapters, groups, levels, seasons, users } from './schema';
import { vnDate } from '../services/time';

/** Password of every dev/test account. */
export const DEV_PASSWORD = 'vnpt@123';

/** Test accounts (AUTH_PROVIDER=dev only). */
const DEV_USERS = [
  { username: 'admin', name: 'Quản trị hệ thống', title: 'Quản trị', role: 'admin', groupId: null },
  { username: 'btc', name: 'Ban Tổ Chức', title: 'BTC Văn hóa', role: 'editor', groupId: null },
  { username: 'lan', name: 'Nguyễn Thị Lan', title: 'NV Kinh doanh', role: 'player', groupId: 'g-kd' },
  { username: 'dung', name: 'Lê Văn Dũng', title: 'NV Kỹ thuật', role: 'player', groupId: 'g-kt' },
  { username: 'hoang', name: 'Trần Minh Hoàng', title: 'NV Hạ tầng', role: 'player', groupId: 'g-ht' },
  { username: 'mai', name: 'Phạm Thị Mai', title: 'NV CSKH', role: 'player', groupId: 'g-cskh' },
  { username: 'anh', name: 'Hoàng Đức Anh', title: 'NV Văn phòng', role: 'player', groupId: 'g-vp' },
] as const;

/**
 * Initial data, safe to run again (existing rows are kept, never overwritten):
 * the 6 sample chapters from client/src/data/content (published), groups,
 * badges, a current season, and optionally the dev accounts.
 */
export const seed = async (db: Db, opts: { devUsers: boolean }) => {
  await db.insert(groups).values(monthlyGroups.map((g) => ({ id: g.groupId, name: g.name }))).onConflictDoNothing();

  await db
    .insert(badges)
    .values(mockBadges.map((b, i) => ({ id: b.id, name: b.name, description: b.description, icon: b.icon, order: i + 1 })))
    .onConflictDoNothing();

  for (const c of CHAPTERS) {
    await db
      .insert(chapters)
      .values({ id: c.id, order: c.order, title: c.title, subtitle: c.subtitle, building: c.building, intro: c.intro })
      .onConflictDoNothing();
    await db
      .insert(levels)
      .values(
        c.levels.map((l, i) => ({
          id: l.id,
          chapterId: c.id,
          position: i + 1,
          kind: l.kind,
          spec: l.spec ?? null,
          status: 'published' as const,
          locked: true,
        })),
      )
      .onConflictDoNothing();
  }

  const existingSeasons = await db.select().from(seasons).limit(1);
  if (!existingSeasons.length) {
    const start = new Date();
    const end = new Date(start.getTime() + 90 * 86_400_000);
    await db.insert(seasons).values({ name: 'Mùa 1', startsAt: vnDate(start), endsAt: vnDate(end) });
  }

  if (opts.devUsers) {
    const passwordHash = await hashPassword(DEV_PASSWORD);
    await db
      .insert(users)
      .values(DEV_USERS.map((u) => ({ ...u, passwordHash, unit: 'VNPT Đắk Lắk' })))
      .onConflictDoNothing();
  }
};
