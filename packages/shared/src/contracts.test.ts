import { describe, expect, it } from 'vitest';
import { buildPath, endpoints } from './index';

describe('endpoint registry', () => {
  const all = Object.values(endpoints);

  it('has unique contract IDs', () => {
    const ids = all.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses C-NN IDs and /api paths', () => {
    for (const e of all) {
      expect(e.id).toMatch(/^C-\d{2,3}$/);
      expect(e.path.startsWith('/api')).toBe(true);
    }
  });

  it('has unique method + path pairs', () => {
    const keys = all.map((e) => `${e.method} ${e.path}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('buildPath', () => {
  it('substitutes and encodes params', () => {
    expect(buildPath('/api/items/:id', { id: 'a b' })).toBe('/api/items/a%20b');
  });
  it('throws on a missing param', () => {
    expect(() => buildPath('/api/items/:id')).toThrow(/Missing path param/);
  });
});
