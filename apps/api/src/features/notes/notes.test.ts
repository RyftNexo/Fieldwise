// EXAMPLE FEATURE tests — the pattern for contract tests: every response must parse with its schema.
import { ApiErrorBody, endpoints, noteFixtures, successBody } from '@app/shared';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app';
import { ensureDatabase } from '../../db/client';

let app: Awaited<ReturnType<typeof createApp>>;

beforeAll(async () => {
  await ensureDatabase();
  app = await createApp();
});

describe('C-01 GET /api/notes', () => {
  it('returns the seeded notes, newest first', async () => {
    const res = await app.request(endpoints.listNotes.path);
    expect(res.status).toBe(200);
    const { data } = successBody(endpoints.listNotes.response).parse(await res.json());
    expect(data.map((n) => n.id)).toEqual(noteFixtures.map((n) => n.id));
  });
});

describe('C-02 POST /api/notes', () => {
  const post = (body: unknown) =>
    app.request(endpoints.createNote.path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('creates a note', async () => {
    const res = await post({ title: 'Ship it' });
    expect(res.status).toBe(201);
    const { data } = successBody(endpoints.createNote.response).parse(await res.json());
    expect(data.title).toBe('Ship it');
    expect(data.body).toBe('');
  });

  it('rejects invalid input with VALIDATION_ERROR', async () => {
    const res = await post({ title: '   ' });
    expect(res.status).toBe(400);
    const body = ApiErrorBody.parse(await res.json());
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
