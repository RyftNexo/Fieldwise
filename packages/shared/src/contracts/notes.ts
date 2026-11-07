import { z } from 'zod';
import { Id, Timestamp } from './common';

/**
 * EXAMPLE RESOURCE — a reference pattern, not a product feature.
 * Copy its shape for real resources; remove it once the real ones exist
 * (order: web → api → shared, see docs/tasks/*.md).
 */
export const Note = z.object({
  id: Id,
  title: z.string().min(1).max(120),
  body: z.string().max(2000),
  createdAt: Timestamp,
});
export type Note = z.infer<typeof Note>;

export const NoteList = z.array(Note);
export type NoteList = z.infer<typeof NoteList>;

export const CreateNoteInput = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  body: z.string().max(2000).default(''),
});
export type CreateNoteInput = z.input<typeof CreateNoteInput>;
