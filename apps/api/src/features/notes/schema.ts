// EXAMPLE FEATURE — reference pattern for a resource. Remove once real features exist.
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  createdAt: text('created_at').notNull(),
});
