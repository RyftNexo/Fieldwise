// EXAMPLE FEATURE — shows the full pattern: contract path → validated input → DB → typed reply.
import { endpoints } from '@app/shared';
import { desc } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../../db/client';
import { parseBody, reply } from '../../lib/http';
import { notes } from './schema';

export const router = new Hono();

router.get(endpoints.listNotes.path, async (c) => {
  const rows = await db.select().from(notes).orderBy(desc(notes.createdAt));
  return reply(c, endpoints.listNotes, rows);
});

router.post(endpoints.createNote.path, async (c) => {
  const input = await parseBody(c, endpoints.createNote);
  const note = {
    id: crypto.randomUUID(),
    title: input.title,
    body: input.body,
    createdAt: new Date().toISOString(),
  };
  await db.insert(notes).values(note);
  return reply(c, endpoints.createNote, note, 201);
});
