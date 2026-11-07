import type { Eligibility } from '@app/shared';
import { CircleCheck, CircleQuestionMark, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const ELIGIBILITY: Record<Eligibility, { label: string; className: string; Icon: LucideIcon }> = {
  yes: { label: 'You qualify', className: 'bg-brand-700 text-white', Icon: CircleCheck },
  likely: { label: 'Likely', className: 'bg-brand-100 text-brand-900', Icon: CircleCheck },
  check: {
    label: 'Check first',
    className: 'bg-harvest-100 text-harvest-900',
    Icon: CircleQuestionMark,
  },
};

/** "You qualify" / "Likely" / "Check first": colour plus icon plus words, never colour alone. */
export function EligibilityBadge({ eligible }: { eligible: Eligibility }) {
  const badge = ELIGIBILITY[eligible];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        badge.className,
      )}
    >
      <badge.Icon className="size-3.5" aria-hidden />
      {badge.label}
    </span>
  );
}

export type PillTone = 'ai' | 'code' | 'neutral' | 'new';

const TONES: Record<PillTone, string> = {
  ai: 'bg-harvest-100 text-harvest-900',
  code: 'bg-brand-100 text-brand-900',
  neutral: 'bg-soil-100 text-soil-700',
  new: 'bg-harvest-300 text-harvest-900',
};

/** Small label pill (AI / No AI, New, statuses). */
export function Pill({ tone = 'neutral', children }: { tone?: PillTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-bold tracking-wide uppercase',
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
