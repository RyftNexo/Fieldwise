import { cardClasses } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { EXAMPLE_PROMPTS, type ExamplePrompt } from './examples';

const AVATAR_TONES = [
  'bg-harvest-100 text-harvest-800',
  'bg-brand-100 text-brand-800',
  'bg-cream-200 text-soil-700',
];

/** One click fills the box with a persona's description and runs it (no typing on stage). */
export function ExamplePrompts({ onPick }: { onPick: (prompt: ExamplePrompt) => void }) {
  return (
    <section aria-labelledby="examples-heading" className="mt-8">
      <h2
        id="examples-heading"
        className="text-center font-sans text-sm font-semibold tracking-wide text-soil-600"
      >
        Or try one of these farmers
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {EXAMPLE_PROMPTS.map((prompt, index) => (
          <li key={prompt.id}>
            <button
              type="button"
              onClick={() => onPick(prompt)}
              className={cardClasses(
                'surface',
                'focus-ring group flex h-full w-full cursor-pointer items-start gap-3 rounded-2xl p-4 text-left transition duration-200 ease-out hover:border-brand-200 hover:shadow-raised motion-safe:hover:-translate-y-0.5',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-full font-display font-semibold',
                  AVATAR_TONES[index % AVATAR_TONES.length],
                )}
              >
                {prompt.name.charAt(0)}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-soil-900 group-hover:text-brand-800">
                  {prompt.name}
                </span>
                <span className="block text-sm leading-snug text-soil-600">{prompt.label}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
