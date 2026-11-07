import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { endpoints, noteFixtures } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { mockHandlers } from '@/mocks/handlers';

const SRC = fileURLToPath(new URL('..', import.meta.url));

/** Names of endpoints referenced as `endpoints.<name>` anywhere in the web source (outside mocks/tests). */
function endpointsUsedByWeb(): string[] {
  const used = new Set<string>();
  for (const file of readdirSync(SRC, { recursive: true }) as string[]) {
    if (!/\.(ts|tsx)$/.test(file) || file.includes('mocks') || file.includes('.test.')) continue;
    for (const match of readFileSync(join(SRC, file), 'utf8').matchAll(/endpoints\.(\w+)/g)) {
      if (match[1]) used.add(match[1]);
    }
  }
  return [...used].sort();
}

describe('mock handlers', () => {
  it('exist for every endpoint the web app calls', () => {
    for (const name of endpointsUsedByWeb()) {
      const endpoint = endpoints[name as keyof typeof endpoints];
      expect(endpoint, `endpoints.${name} is not in the contract registry`).toBeDefined();
      expect(mockHandlers[endpoint.id], `missing mock for ${endpoint.id} (${name})`).toBeTypeOf(
        'function',
      );
    }
  });

  it('only exist for endpoints that are in the registry', () => {
    const ids = new Set(Object.values(endpoints).map((e) => e.id));
    for (const id of Object.keys(mockHandlers)) expect(ids.has(id), id).toBe(true);
  });

  it('return data that matches the contracts', async () => {
    const empty = { params: {}, query: {}, body: undefined };
    const health = await mockHandlers[endpoints.health.id]?.(empty);
    expect(() => endpoints.health.response.parse(health)).not.toThrow();

    const notes = await mockHandlers[endpoints.listNotes.id]?.(empty);
    expect(endpoints.listNotes.response.parse(notes)).toHaveLength(noteFixtures.length);

    const created = await mockHandlers[endpoints.createNote.id]?.({
      ...empty,
      body: { title: 'x', body: '' },
    });
    expect(() => endpoints.createNote.response.parse(created)).not.toThrow();
  });
});
