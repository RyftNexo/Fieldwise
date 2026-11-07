import type { FarmProfile } from '@app/shared';
import { cn } from '@/lib/utils';
import { profileToChips } from './summary';

/** "What we understood": the extracted profile as chips, with dashed chips for what's missing. */
export function ProfileChips({ profile }: { profile: FarmProfile }) {
  const chips = profileToChips(profile);
  return (
    <section aria-labelledby="understood-heading">
      <h2
        id="understood-heading"
        className="text-sm font-semibold tracking-wide text-stone-500 uppercase"
      >
        What we understood
      </h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li
            key={chip.key}
            className={cn(
              'rounded-full border px-3 py-1 text-sm',
              chip.missing
                ? 'border-dashed border-stone-300 bg-white text-stone-500'
                : 'border-brand-200 bg-brand-50 font-medium text-brand-800',
            )}
          >
            {chip.missing && <span className="sr-only">You didn't say: </span>}
            {chip.label}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-stone-500">
        Something wrong? Change your description above and check again.
      </p>
    </section>
  );
}
