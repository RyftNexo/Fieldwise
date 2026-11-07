import type { FarmProfile, GrantMatch } from '@app/shared';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(),
  createdAt: text('createdAt').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  profile: text('profile', { mode: 'json' }).$type<FarmProfile>().notNull(),
  matches: text('matches', { mode: 'json' }).$type<GrantMatch[]>().notNull(),
  estimatedTotalEur: integer('estimatedTotalEur').notNull(),
});
