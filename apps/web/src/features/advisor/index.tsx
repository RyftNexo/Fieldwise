import type { FeatureModule } from '@/app/types';
import { AdvisorPage } from './AdvisorPage';

export const routes: FeatureModule['routes'] = [{ index: true, element: <AdvisorPage /> }];
export const nav: FeatureModule['nav'] = [{ label: 'Check grants', to: '/', order: 0 }];
