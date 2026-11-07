import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Every test file gets its own fresh in-memory database (created from the schema + seeded).
    env: { DB_FILE: ':memory:', DEMO_MODE: 'off' },
  },
});
