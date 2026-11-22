import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { and, asc, desc, eq, inArray, like, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AdminChapter, AdminLevel, AdminLevelSummary, LevelRevision } from '../../../../shared/api-types';
import type { GameSpec } from '../../../../shared/game-types';
import type { Db } from '../../db/client';
import { chapters, levelRevisions, levels, uploads, users } from '../../db/schema';
import { HttpError, requireRole } from '../../http';
import { audit } from '../../services/audit';
import { parseSpec } from '../../services/spec-schema';

type LevelRow = typeof levels.$inferSelect;

const summary = (l: LevelRow): AdminLevelSummary => ({
  id: l.id,
  position: l.position,
  kind: l.kind,
  type: l.spec?.type ?? null,
  title: l.spec?.title ?? (l.kind === 'mystery' ? 'Vòng bí ẩn' : '(chưa có tiêu đề)'),
  status: l.status,
  publishAt: l.publishAt?.toISOString() ?? null,
  locked: l.locked,
  updatedAt: l.updatedAt.toISOString(),
});

const full = (l: LevelRow): AdminLevel => ({ ...summary(l), chapterId: l.chapterId, spec: l.spec ?? null });

const levelBody = z.object({
  chapterId: z.string().min(1),
  kind: z.enum(['normal', 'mystery', 'boss']),
  spec: z.unknown().nullable(),
});

/** Validate kind/spec together: mystery has no spec, boss levels need a boss game. */
const checkSpec = (kind: 'normal' | 'mystery' | 'boss', raw: unknown): GameSpec | null => {
  if (kind === 'mystery') return null;
  if (raw == null) throw new HttpError(400, 'Level cần có nội dung trò chơi');
  const spec = parseSpec(raw);
  if (kind === 'boss' && spec.type !== 'boss') throw new HttpError(400, 'Level Boss phải dùng dạng "Boss Challenge"');
  if (kind === 'normal' && spec.type === 'boss') throw new HttpError(400, 'Dạng "Boss Challenge" chỉ dùng cho level Boss');
  return spec;
};

const getLevel = async (db: Db, id: string) => {
  const [l] = await db.select().from(levels).where(eq(levels.id, id)).limit(1);
  if (!l) throw new HttpError(404, 'Không tìm thấy level');
  return l;
};

const snapshot = (db: Db, l: LevelRow, userId: string) =>
  db.insert(levelRevisions).values({ levelId: l.id, kind: l.kind, spec: l.spec ?? null, status: l.status, editedBy: userId });

/** Next free id "<chapter>-<n>" (ids are progress keys and never reused). */
const nextLevelId = async (db: Db, chapterId: string) => {
  const rows = await db.select({ id: levels.id }).from(levels).where(like(levels.id, `${chapterId}-%`));
  const used = new Set(rows.map((r) => r.id));
  let n = rows.length + 1;
  while (used.has(`${chapterId}-${n}`)) n++;
  return `${chapterId}-${n}`;
};

const ALLOWED_UPLOADS: Record<string, string> = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };

export const adminContentRoutes = async (app: FastifyInstance) => {
  const { db, config } = app;

  app.get('/content', async (req): Promise<AdminChapter[]> => {
    requireRole(req, 'editor');
    const [cs, ls] = await Promise.all([
      db.select().from(chapters).orderBy(asc(chapters.order)),
      db.select().from(levels).orderBy(asc(levels.position)),
    ]);
    return cs.map((c) => ({
      id: c.id,
      order: c.order,
      title: c.title,
      subtitle: c.subtitle,
      building: c.building,
      intro: c.intro,
      levels: ls.filter((l) => l.chapterId === c.id).map(summary),
    }));
  });

  app.put<{ Params: { id: string } }>('/chapters/:id', async (req) => {
    const user = requireRole(req, 'editor');
    const body = z
      .object({ title: z.string().trim().min(1).max(80), subtitle: z.string().trim().max(120), building: z.string().trim().max(40), intro: z.string().trim().max(1000) })
      .parse(req.body);
    const [row] = await db.update(chapters).set({ ...body, updatedAt: new Date() }).where(eq(chapters.id, req.params.id)).returning();
    if (!row) throw new HttpError(404, 'Không tìm thấy chặng');
    await audit(db, user.id, 'update', 'chapter', row.id, body);
    return row;
  });

  app.get<{ Params: { id: string } }>('/levels/:id', async (req) => {
    requireRole(req, 'editor');
    return full(await getLevel(db, req.params.id));
  });

  app.post('/levels', async (req) => {
    const user = requireRole(req, 'editor');
    const body = levelBody.parse(req.body);
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, body.chapterId)).limit(1);
    if (!chapter) throw new HttpError(400, 'Chặng không tồn tại');
    const spec = checkSpec(body.kind, body.spec);
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(${levels.position}), 0)::int` })
      .from(levels)
      .where(eq(levels.chapterId, chapter.id));
    const [row] = await db
      .insert(levels)
      .values({ id: await nextLevelId(db, chapter.id), chapterId: chapter.id, position: Number(max) + 1, kind: body.kind, spec, updatedBy: user.id })
      .returning();
    await audit(db, user.id, 'create', 'level', row.id);
    return full(row);
  });

  app.put<{ Params: { id: string } }>('/levels/:id', async (req) => {
    const user = requireRole(req, 'editor');
    const body = levelBody.parse(req.body);
    const l = await getLevel(db, req.params.id);
    if (l.locked && body.chapterId !== l.chapterId) throw new HttpError(400, 'Level đã phát hành, không chuyển sang chặng khác được');
    const spec = checkSpec(body.kind, body.spec);
    await snapshot(db, l, user.id);
    const moved = body.chapterId !== l.chapterId;
    let position = l.position;
    if (moved) {
      const [{ max }] = await db
        .select({ max: sql<number>`coalesce(max(${levels.position}), 0)::int` })
        .from(levels)
        .where(eq(levels.chapterId, body.chapterId));
      position = Number(max) + 1;
    }
    const [row] = await db
      .update(levels)
      .set({ chapterId: body.chapterId, position, kind: body.kind, spec, updatedBy: user.id, updatedAt: new Date() })
      .where(eq(levels.id, l.id))
      .returning();
    await audit(db, user.id, 'update', 'level', l.id);
    return full(row);
  });

  app.post<{ Params: { id: string } }>('/levels/:id/publish', async (req) => {
    const user = requireRole(req, 'editor');
    const body = z.object({ publishAt: z.iso.datetime({ offset: true }).nullable().optional() }).parse(req.body ?? {});
    const l = await getLevel(db, req.params.id);
    if (l.kind !== 'mystery' && !l.spec) throw new HttpError(400, 'Level chưa có nội dung');
    await snapshot(db, l, user.id);
    const publishAt = body.publishAt ? new Date(body.publishAt) : null;
    const [row] = await db
      .update(levels)
      .set({ status: 'published', publishAt, locked: true, updatedBy: user.id, updatedAt: new Date() })
      .where(eq(levels.id, l.id))
      .returning();
    await audit(db, user.id, 'publish', 'level', l.id, { publishAt });
    return full(row);
  });

  app.post<{ Params: { id: string } }>('/levels/:id/unpublish', async (req) => {
    const user = requireRole(req, 'editor');
    const l = await getLevel(db, req.params.id);
    await snapshot(db, l, user.id);
    const [row] = await db.update(levels).set({ status: 'draft', updatedBy: user.id, updatedAt: new Date() }).where(eq(levels.id, l.id)).returning();
    await audit(db, user.id, 'unpublish', 'level', l.id);
    return full(row);
  });

  app.delete<{ Params: { id: string } }>('/levels/:id', async (req) => {
    const user = requireRole(req, 'editor');
    const l = await getLevel(db, req.params.id);
    if (l.locked) {
      // players may have progress on it: hide instead of deleting
      await db.update(levels).set({ status: 'archived', updatedBy: user.id, updatedAt: new Date() }).where(eq(levels.id, l.id));
      await audit(db, user.id, 'archive', 'level', l.id);
      return { archived: true };
    }
    await db.delete(levels).where(eq(levels.id, l.id));
    await audit(db, user.id, 'delete', 'level', l.id);
    return { deleted: true };
  });

  app.post<{ Params: { id: string } }>('/chapters/:id/order', async (req) => {
    const user = requireRole(req, 'editor');
    const { levelIds } = z.object({ levelIds: z.array(z.string()).min(1) }).parse(req.body);
    const rows = await db.select({ id: levels.id }).from(levels).where(and(eq(levels.chapterId, req.params.id), inArray(levels.id, levelIds)));
    if (rows.length !== levelIds.length) throw new HttpError(400, 'Danh sách level không khớp với chặng');
    await db.transaction(async (tx) => {
      for (const [i, id] of levelIds.entries()) await tx.update(levels).set({ position: i + 1 }).where(eq(levels.id, id));
    });
    await audit(db, user.id, 'reorder', 'chapter', req.params.id, { levelIds });
    return { ok: true };
  });

  app.get<{ Params: { id: string } }>('/levels/:id/revisions', async (req): Promise<LevelRevision[]> => {
    requireRole(req, 'editor');
    const rows = await db
      .select({ r: levelRevisions, editor: users.name })
      .from(levelRevisions)
      .leftJoin(users, eq(users.id, levelRevisions.editedBy))
      .where(eq(levelRevisions.levelId, req.params.id))
      .orderBy(desc(levelRevisions.id))
      .limit(50);
    return rows.map(({ r, editor }) => ({ id: r.id, kind: r.kind, spec: r.spec ?? null, status: r.status, editedBy: editor, createdAt: r.createdAt.toISOString() }));
  });

  app.post<{ Params: { id: string; rev: string } }>('/levels/:id/revisions/:rev/restore', async (req) => {
    const user = requireRole(req, 'editor');
    const l = await getLevel(db, req.params.id);
    const [rev] = await db
      .select()
      .from(levelRevisions)
      .where(and(eq(levelRevisions.id, Number(req.params.rev)), eq(levelRevisions.levelId, l.id)))
      .limit(1);
    if (!rev) throw new HttpError(404, 'Không tìm thấy phiên bản');
    await snapshot(db, l, user.id);
    const [row] = await db
      .update(levels)
      .set({ kind: rev.kind, spec: rev.spec, updatedBy: user.id, updatedAt: new Date() })
      .where(eq(levels.id, l.id))
      .returning();
    await audit(db, user.id, 'restore', 'level', l.id, { revision: rev.id });
    return full(row);
  });

  // ---------------------------------------------------------------- uploads

  app.post('/uploads', async (req) => {
    const user = requireRole(req, 'editor');
    const file = await req.file();
    if (!file) throw new HttpError(400, 'Chưa chọn tệp');
    const ext = ALLOWED_UPLOADS[file.mimetype];
    if (!ext) throw new HttpError(400, 'Chỉ nhận ảnh PNG, JPEG hoặc WebP');
    await mkdir(config.uploadDir, { recursive: true });
    const fileName = `${randomUUID()}${ext}`;
    const target = join(config.uploadDir, fileName);
    await pipeline(file.file, createWriteStream(target));
    if (file.file.truncated) {
      await unlink(target).catch(() => undefined);
      throw new HttpError(413, 'Ảnh vượt quá 5 MB');
    }
    const size = file.file.bytesRead;
    const [row] = await db.insert(uploads).values({ fileName, originalName: file.filename.slice(0, 200), mime: file.mimetype, size, uploadedBy: user.id }).returning();
    await audit(db, user.id, 'upload', 'upload', row.id, { name: row.originalName });
    return { id: row.id, url: `/uploads/${fileName}`, name: row.originalName, size };
  });

  app.get('/uploads', async (req) => {
    requireRole(req, 'editor');
    const rows = await db.select().from(uploads).orderBy(desc(uploads.createdAt)).limit(200);
    return rows.map((r) => ({ id: r.id, url: `/uploads/${r.fileName}`, name: r.originalName, size: r.size, createdAt: r.createdAt.toISOString() }));
  });
};
