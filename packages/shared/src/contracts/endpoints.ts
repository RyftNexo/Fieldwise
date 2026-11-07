import { defineEndpoint } from './endpoint';
import { HealthStatus } from './health';
import { CreateNoteInput, Note, NoteList } from './notes';

/**
 * The endpoint registry — the single list of everything web and API agree on.
 * Rules (docs/API_CONTRACTS.md): an endpoint must be here before anyone implements or calls it;
 * IDs never change or get reused; additive changes are cheap, breaking changes need all three devs.
 */
export const endpoints = {
  health: defineEndpoint({
    id: 'C-00',
    method: 'GET',
    path: '/api/health',
    auth: false,
    summary: 'Liveness and database check',
    response: HealthStatus,
  }),

  // ── EXAMPLE (remove when real resources exist) ─────────────────────────────
  listNotes: defineEndpoint({
    id: 'C-01',
    method: 'GET',
    path: '/api/notes',
    auth: false,
    summary: 'EXAMPLE: list notes, newest first',
    response: NoteList,
  }),
  createNote: defineEndpoint({
    id: 'C-02',
    method: 'POST',
    path: '/api/notes',
    auth: false,
    summary: 'EXAMPLE: create a note',
    request: CreateNoteInput,
    response: Note,
  }),
} as const;

export type Endpoints = typeof endpoints;
export type EndpointName = keyof Endpoints;
