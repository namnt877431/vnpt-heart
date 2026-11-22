import { eq } from 'drizzle-orm';
import type { Settings } from '../../../shared/api-types';
import type { Db } from '../db/client';
import { settings } from '../db/schema';

export const DEFAULT_SETTINGS: Settings = {
  unlockAllChapters: false,
  bonusCapPerDay: 100,
  // BTC has not fixed the weights yet: rank by average score + period bonus.
  groupWeights: { avg: 1, participation: 0, bonus: 1 },
};

const KEY = 'game';

export const getSettings = async (db: Db): Promise<Settings> => {
  const [row] = await db.select().from(settings).where(eq(settings.key, KEY)).limit(1);
  const stored = (row?.value ?? {}) as Partial<Settings>;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    groupWeights: { ...DEFAULT_SETTINGS.groupWeights, ...stored.groupWeights },
  };
};

export const saveSettings = async (db: Db, value: Settings): Promise<void> => {
  await db
    .insert(settings)
    .values({ key: KEY, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
};
