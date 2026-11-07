import { EXAMPLE_PROMPTS, type ExamplePrompt } from './examples';

/** One click fills the box with a persona's description and runs it (no typing on stage). */
export function ExamplePrompts({ onPick }: { onPick: (prompt: ExamplePrompt) => void }) {
  return (
    <section aria-labelledby="examples-heading">
      <h2 id="examples-heading" className="text-center text-sm font-medium text-stone-500">
        Or try an example
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <li key={prompt.id}>
            <button
              type="button"
              onClick={() => onPick(prompt)}
              className="flex h-full w-full flex-col items-start justify-start rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <span className="font-semibold text-stone-900">{prompt.name}</span>
              <span className="mt-0.5 text-sm text-stone-600">{prompt.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
