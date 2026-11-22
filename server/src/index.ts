import { buildApp } from './app';
import { config } from './config';
import { openDb } from './db/client';

const { db, close } = await openDb(config.databaseUrl, config.migrationsDir);
const app = await buildApp({ config, db });

if (config.authProvider === 'dev') {
  app.log.warn('AUTH_PROVIDER=dev: test accounts are enabled. Use AUTH_PROVIDER=ldap in production.');
}

const shutdown = async () => {
  await app.close();
  await close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ port: config.port, host: config.host });
