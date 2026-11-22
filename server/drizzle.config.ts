import { defineConfig } from 'drizzle-kit';

// `npm run db:generate` writes SQL migrations to ./drizzle after schema.ts changes.
// Commit them; the server applies pending migrations on start.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
