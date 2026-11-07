import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// `npm run dev`      → live mode: /api is proxied to the API (default http://localhost:8787)
// `npm run dev:mock` → mock mode: no API needed, responses come from src/mocks/handlers.ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:8787' },
  },
  test: {
    environment: 'node',
  },
});
