import { cn } from '@/lib/utils';

export type CardVariant = 'surface' | 'tinted' | 'cream' | 'deep';

const VARIANTS: Record<CardVariant, string> = {
  surface: 'border border-soil-100 bg-white shadow-card',
  tinted: 'border border-brand-100 bg-brand-50',
  cream: 'border border-cream-200 bg-cream-100',
  deep: 'bg-brand-900 text-cream-50 shadow-raised',
};

/** Rounded card surface. Use on whatever element fits (section, article, li…). */
export function cardClasses(variant: CardVariant = 'surface', className?: string) {
  return cn('rounded-card', VARIANTS[variant], className);
}
