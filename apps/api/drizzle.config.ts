// Only for `npx drizzle-kit studio` (browse the local DB). Schema changes: `npm run db:reset`.
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'turso',
  schema: './src/features/*/schema.ts',
  dbCredentials: { url: `file:${process.env.DB_FILE ?? './data/app.db'}` },
});
