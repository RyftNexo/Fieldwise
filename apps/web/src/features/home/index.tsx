import type { FeatureModule } from '@/app/types';
import { HomePage } from './HomePage';

export const routes: FeatureModule['routes'] = [{ index: true, element: <HomePage /> }];
export const nav: FeatureModule['nav'] = [{ label: 'Home', to: '/', order: 0 }];
