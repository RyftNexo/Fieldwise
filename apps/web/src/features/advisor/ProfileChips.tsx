import type { FarmProfile } from '@app/shared';
import { Check, CircleQuestionMark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { profileToChips } from './summary';

/** "What we understood": the extracted profile as tags, with dashed tags for what's missing. */
export function ProfileChips({ profile }: { profile: FarmProfile }) {
  const chips = profileToChips(profile);
  return (
    <section aria-labelledby="understood-heading">
      <h2
        id="understood-heading"
        className="font-sans text-sm font-bold tracking-wider text-brand-600 uppercase"
      >
        What we understood
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li
            key={chip.key}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.95rem]',
              chip.missing
                ? 'border border-dashed border-soil-300 text-soil-600'
                : 'bg-white font-semibold text-brand-900 shadow-card ring-1 ring-brand-100',
            )}
          >
            {chip.missing ? (
              <CircleQuestionMark className="size-4 text-soil-400" aria-hidden />
            ) : (
              <Check className="size-4 text-brand-600" aria-hidden />
            )}
            {chip.missing && <span className="sr-only">You didn't say: </span>}
            {chip.label}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-soil-600">
        Something wrong? Change your description above and check again.
      </p>
    </section>
  );
}
