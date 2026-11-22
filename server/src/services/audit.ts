import type { Db } from '../db/client';
import { auditLog } from '../db/schema';

/** Record an admin action (who changed what). */
export const audit = async (db: Db, userId: string, action: string, entity: string, entityId = '', data?: unknown) => {
  await db.insert(auditLog).values({ userId, action, entity, entityId, data: data ?? null });
};
