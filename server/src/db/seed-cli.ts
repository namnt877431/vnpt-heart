import { config } from '../config';
import { openDb } from './client';
import { DEV_PASSWORD, seed } from './seed';

/** `npm run db:seed` — load initial content (and dev accounts when AUTH_PROVIDER=dev). */
const { db, close } = await openDb(config.databaseUrl, config.migrationsDir);
const devUsers = config.authProvider === 'dev';
await seed(db, { devUsers });
await close();
console.log('Seed xong: 6 chặng mẫu, nhóm, huy hiệu, mùa hiện tại.');
if (devUsers) console.log(`Tài khoản dev: admin / btc / lan / dung / hoang / mai / anh — mật khẩu: ${DEV_PASSWORD}`);
