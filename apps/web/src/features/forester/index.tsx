import type { FeatureModule } from '@/app/types';
import { ForesterInboxPage } from './ForesterInboxPage';

export const routes: FeatureModule['routes'] = [
  { path: 'forester', element: <ForesterInboxPage /> },
];
export const nav: FeatureModule['nav'] = [{ label: 'Forester inbox', to: '/forester', order: 10 }];
