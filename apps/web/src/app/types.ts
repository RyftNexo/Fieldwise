import type { RouteObject } from 'react-router';

export interface NavItem {
  label: string;
  to: string;
  /** Lower comes first. Home uses 0. */
  order?: number;
}

/**
 * What every src/features/<name>/index.tsx exports. Features are discovered automatically
 * (see ./features.ts) — adding one never requires editing a shared router or menu.
 */
export interface FeatureModule {
  /** Child routes of the app layout, with paths relative to "/" (e.g. "notes", or index: true). */
  routes: RouteObject[];
  nav?: NavItem[];
}
