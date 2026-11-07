import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'left' | 'center';
}

/** Eyebrow + Lexend title + lead paragraph, used by every landing section. */
export function SectionHeading({ id, eyebrow, title, lead, align = 'left' }: SectionHeadingProps) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      <p className="text-sm font-bold tracking-wider text-brand-600 uppercase">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">
        {title}
      </h2>
      {lead && <p className="mt-3 text-lg text-pretty text-soil-600">{lead}</p>}
    </div>
  );
}
