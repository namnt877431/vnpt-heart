import { asc, eq, ilike, or, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AdminGroup, AdminUser } from '../../../../shared/api-types';
import { deleteUserSessions } from '../../auth/session';
import { groups, users } from '../../db/schema';
import { HttpError, requireRole } from '../../http';
import { audit } from '../../services/audit';

type UserRow = typeof users.$inferSelect;

const adminUser = (u: UserRow): AdminUser => ({
  id: u.id,
  username: u.username,
  name: u.name,
  title: u.title,
  unit: u.unit,
  role: u.role,
  groupId: u.groupId,
  active: u.active,
  lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
});

/** "Nhóm Kinh doanh" -> "nhom-kinh-doanh" */
export const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'nhom';

/** Parse "a,b,c" CSV lines (no quoted commas needed for this data). Skips a header row. */
const parseCsv = (csv: string) =>
  csv
    .split(/\r?\n/)
    .map((l) => l.split(/[,;\t]/).map((c) => c.trim()))
    .filter((cols) => cols[0] && !/^(username|tai khoan|tài khoản)$/i.test(cols[0]));

export const adminPeopleRoutes = async (app: FastifyInstance) => {
  const { db } = app;

  app.get('/users', async (req): Promise<AdminUser[]> => {
    requireRole(req, 'editor');
    const { q } = z.object({ q: z.string().trim().max(100).default('') }).parse(req.query);
    const where = q ? or(ilike(users.username, `%${q}%`), ilike(users.name, `%${q}%`), ilike(users.unit, `%${q}%`)) : undefined;
    const rows = await db.select().from(users).where(where).orderBy(asc(users.name)).limit(500);
    return rows.map(adminUser);
  });

  app.patch<{ Params: { id: string } }>('/users/:id', async (req) => {
    const me = requireRole(req, 'admin');
    const body = z
      .object({
        role: z.enum(['player', 'editor', 'admin']).optional(),
        groupId: z.string().nullable().optional(),
        active: z.boolean().optional(),
        title: z.string().trim().max(120).optional(),
        unit: z.string().trim().max(200).optional(),
      })
      .parse(req.body);
    if (req.params.id === me.id && (body.role && body.role !== 'admin' || body.active === false)) {
      throw new HttpError(400, 'Không thể tự hạ quyền hoặc khóa chính tài khoản của bạn');
    }
    const [row] = await db.update(users).set(body).where(eq(users.id, req.params.id)).returning();
    if (!row) throw new HttpError(404, 'Không tìm thấy người dùng');
    if (body.active === false) await deleteUserSessions(db, row.id);
    await audit(db, me.id, 'update', 'user', row.id, body);
    return adminUser(row);
  });

  /**
   * Import a list: `username,họ tên,nhóm,chức danh,đơn vị` per line. Creates
   * users ahead of their first login (LDAP fills the rest) and missing groups.
   */
  app.post('/users/import', async (req) => {
    const me = requireRole(req, 'admin');
    const { csv } = z.object({ csv: z.string().max(2_000_000) }).parse(req.body);
    const rows = parseCsv(csv);
    if (!rows.length) throw new HttpError(400, 'Không có dòng dữ liệu nào');
    const groupRows = await db.select().from(groups);
    const groupByName = new Map(groupRows.flatMap((g) => [[g.name.toLowerCase(), g.id], [g.id, g.id]] as [string, string][]));
    let created = 0;
    let updated = 0;
    let newGroups = 0;
    for (const [rawUsername, name, groupName, title, unit] of rows) {
      const username = rawUsername.toLowerCase();
      let groupId: string | null | undefined;
      if (groupName) {
        groupId = groupByName.get(groupName.toLowerCase());
        if (!groupId) {
          groupId = slug(groupName);
          await db.insert(groups).values({ id: groupId, name: groupName }).onConflictDoNothing();
          groupByName.set(groupName.toLowerCase(), groupId);
          newGroups++;
        }
      }
      const patch = {
        ...(name ? { name } : {}),
        ...(groupId ? { groupId } : {}),
        ...(title ? { title } : {}),
        ...(unit ? { unit } : {}),
      };
      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
      if (existing) {
        if (Object.keys(patch).length) await db.update(users).set(patch).where(eq(users.id, existing.id));
        updated++;
      } else {
        await db.insert(users).values({ username, name: name || username, ...patch });
        created++;
      }
    }
    await audit(db, me.id, 'import', 'users', '', { created, updated, newGroups });
    return { created, updated, newGroups };
  });

  // ------------------------------------------------------------------ groups

  app.get('/groups', async (req): Promise<AdminGroup[]> => {
    requireRole(req, 'editor');
    const rows = await db
      .select({ g: groups, members: sql<number>`(select count(*)::int from users u where u.group_id = "groups"."id" and u.active)` })
      .from(groups)
      .orderBy(asc(groups.name));
    return rows.map(({ g, members }) => ({ id: g.id, name: g.name, leaderId: g.leaderId, members: Number(members) }));
  });

  const groupBody = z.object({ name: z.string().trim().min(1).max(80), leaderId: z.uuid().nullable().optional() });

  app.post('/groups', async (req) => {
    const me = requireRole(req, 'admin');
    const body = groupBody.parse(req.body);
    const [row] = await db.insert(groups).values({ id: slug(body.name), name: body.name, leaderId: body.leaderId ?? null }).onConflictDoNothing().returning();
    if (!row) throw new HttpError(409, 'Nhóm đã tồn tại');
    await audit(db, me.id, 'create', 'group', row.id, body);
    return row;
  });

  app.put<{ Params: { id: string } }>('/groups/:id', async (req) => {
    const me = requireRole(req, 'admin');
    const body = groupBody.parse(req.body);
    const [row] = await db.update(groups).set({ name: body.name, leaderId: body.leaderId ?? null }).where(eq(groups.id, req.params.id)).returning();
    if (!row) throw new HttpError(404, 'Không tìm thấy nhóm');
    await audit(db, me.id, 'update', 'group', row.id, body);
    return row;
  });

  app.delete<{ Params: { id: string } }>('/groups/:id', async (req) => {
    const me = requireRole(req, 'admin');
    await db.delete(groups).where(eq(groups.id, req.params.id));
    await audit(db, me.id, 'delete', 'group', req.params.id);
    return { ok: true };
  });
};
