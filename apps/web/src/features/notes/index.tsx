// EXAMPLE FEATURE — reference pattern. Delete this folder once your first real feature exists.
import type { FeatureModule } from '@/app/types';
import { NotesPage } from './NotesPage';

export const routes: FeatureModule['routes'] = [{ path: 'notes', element: <NotesPage /> }];
export const nav: FeatureModule['nav'] = [{ label: 'Notes (example)', to: '/notes', order: 90 }];
