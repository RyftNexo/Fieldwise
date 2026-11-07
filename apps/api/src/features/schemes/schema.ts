import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** One row per scheme. Optional contract fields are nullable columns; the route drops the nulls. */
export const schemes = sqliteTable('schemes', {
  id: text('id').primaryKey(),
  /** Keeps the list in the order we show it: verified schemes first. */
  sortOrder: integer('sortOrder').notNull(),
  name: text('name').notNull(),
  shortName: text('shortName').notNull(),
  summary: text('summary').notNull(),
  criteria: text('criteria', { mode: 'json' }).$type<string[]>().notNull(),
  ratePerHa: real('ratePerHa'),
  maxHa: real('maxHa'),
  grantRate: real('grantRate'),
  investmentCeiling: real('investmentCeiling'),
  status: text('status', { enum: ['open', 'closed', 'rolling', 'unknown'] }).notNull(),
  deadline: text('deadline'),
  url: text('url').notNull(),
  source: text('source').notNull(),
  /** null means the facts are not verified. */
  checkedAt: text('checkedAt'),
});
