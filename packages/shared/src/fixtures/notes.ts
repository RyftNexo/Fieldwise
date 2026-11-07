import type { Note } from '../contracts/notes';

/**
 * Typed sample data. Used as web mock data (VITE mock mode) AND as API seed data,
 * so the demo looks the same in both modes. Keep fixtures realistic for the demo.
 */
export const noteFixtures: Note[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Welcome to the hackathon skeleton',
    body: 'This example resource shows the full pattern: contract → API → DB → web.',
    createdAt: '2026-11-01T09:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    title: 'Replace me',
    body: 'Delete the example once your first real feature exists.',
    createdAt: '2026-11-01T08:30:00.000Z',
  },
];
