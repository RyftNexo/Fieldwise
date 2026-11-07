import type { FeatureModule, NavItem } from './types';

// Every folder in src/features/ with an index.tsx is a feature. Folders starting with "_" are skipped.
const modules = import.meta.glob<FeatureModule>(
  ['../features/*/index.tsx', '!../features/_*/index.tsx'],
  {
    eager: true,
  },
);

export const features = Object.entries(modules).map(([path, mod]) => ({
  name: path.split('/').at(-2) ?? path,
  ...mod,
}));

export const featureRoutes = features.flatMap((feature) => feature.routes);

export const navItems: NavItem[] = features
  .flatMap((feature) => feature.nav ?? [])
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
