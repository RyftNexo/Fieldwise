import {
  Calculator,
  Eye,
  type LucideIcon,
  MessageSquareText,
  Scale,
  ScanText,
  ShieldCheck,
} from 'lucide-react';

const STEPS: { title: string; body: string; Icon: LucideIcon; card: string; icon: string }[] = [
  {
    title: 'Understand',
    body: 'The AI reads your farm details — hectares, what you farm, where, and the land you can’t use.',
    Icon: ScanText,
    card: 'border-brand-200 bg-brand-50',
    icon: 'bg-brand-600 text-white',
  },
  {
    title: 'Check the rules',
    body: 'The code checks those details against each scheme’s criteria and does the maths. The AI isn’t involved.',
    Icon: Scale,
    card: 'border-harvest-200 bg-harvest-50',
    icon: 'bg-harvest-400 text-harvest-900',
  },
  {
    title: 'Explain',
    body: 'The AI writes a short summary of the results only. It can’t add a scheme or change a number.',
    Icon: MessageSquareText,
    card: 'border-brand-300 bg-cream-100',
    icon: 'bg-brand-800 text-cream-50',
  },
];

const PROMISES: { title: string; body: string; Icon: LucideIcon; card: string; icon: string }[] = [
  {
    title: 'Code decides, AI only talks',
    body: 'Whether you qualify, and how much, comes from rules built on Department of Agriculture scheme criteria, not from a chatbot’s guess.',
    Icon: ShieldCheck,
    card: 'border-brand-200 bg-white',
    icon: 'bg-brand-100 text-brand-800',
  },
  {
    title: 'Every answer shows its working',
    body: 'Each grant lists the rule that matched, how any figure was worked out, and a link to the official scheme page.',
    Icon: Calculator,
    card: 'border-harvest-200 bg-harvest-50',
    icon: 'bg-harvest-100 text-harvest-800',
  },
  {
    title: 'Honest about its limits',
    body: 'We can’t check herd numbers, land parcels, nitrates or soil tests, so some answers say “likely” or “check first” and point you to an official adviser.',
    Icon: Eye,
    card: 'border-brand-200 bg-brand-50',
    icon: 'bg-brand-700 text-cream-50',
  },
];

/** The sections under the hero that explain the product to a first-time visitor (and the judges). */
export function Landing() {
  return (
    <>
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="min-h-[calc(100svh-4.5rem)] scroll-mt-[4.5rem] bg-cream-100 py-20 sm:py-24 md:min-h-[calc(100svh-6.75rem)] md:scroll-mt-[6.75rem] md:py-28"
      >
        <div className="mx-auto max-w-[91rem] px-5 sm:px-8 md:px-20">
          <div className="md:pl-5">
            <p className="text-base font-bold tracking-[0.1em] text-brand-600 uppercase sm:text-lg">
              How it works
            </p>
            <h2
              id="how-heading"
              className="mt-5 text-[clamp(2.6rem,4.15vw,3.65rem)] leading-[1.08] font-bold tracking-[-0.04em] text-[#171d1b]"
            >
              Code decides. AI only talks.
            </h2>
            <p className="mt-6 max-w-[48rem] text-xl leading-relaxed text-soil-700 sm:text-[1.65rem]">
              Three simple steps. Only the middle one decides anything.
              <span className="block">You can open each step’s details after a check.</span>
            </p>
          </div>

          <ol className="mt-20 grid gap-7 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className={`min-h-[21.5rem] rounded-[1.5rem] border p-8 shadow-card sm:px-9 sm:py-8 ${step.card}`}
              >
                <span
                  className={`grid size-[4.65rem] place-items-center rounded-[1.5rem] ${step.icon}`}
                >
                  <step.Icon className="size-8" strokeWidth={2.1} aria-hidden />
                </span>
                <h3 className="mt-7 text-[1.7rem] leading-tight font-semibold tracking-[-0.025em] text-[#171d1b]">
                  {index + 1}. {step.title}
                </h3>
                <p className="mt-5 text-lg leading-[1.65] text-soil-700 sm:text-[1.3rem]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="about"
        aria-labelledby="trust-heading"
        className="min-h-[calc(100svh-4.5rem)] scroll-mt-[4.5rem] border-t border-brand-100 bg-gradient-to-b from-white to-brand-50 py-20 sm:py-24 md:min-h-[calc(100svh-6.75rem)] md:scroll-mt-[6.75rem] md:py-28"
      >
        <div className="mx-auto max-w-[91rem] px-5 sm:px-8 md:px-20">
          <header className="md:pl-5">
            <p className="text-base font-bold tracking-[0.1em] text-brand-600 uppercase sm:text-lg">
              Why you can trust it
            </p>
            <h2
              id="trust-heading"
              className="mt-5 max-w-[56rem] text-[clamp(2.6rem,4.15vw,3.65rem)] leading-[1.08] font-bold tracking-[-0.04em] text-[#171d1b]"
            >
              A guide you can check, not a black box
            </h2>
          </header>

          <ul className="mt-16 grid gap-7 md:mt-20 md:grid-cols-3">
            {PROMISES.map((promise) => (
              <li
                key={promise.title}
                className={`min-h-[20rem] rounded-[1.5rem] border p-8 shadow-card sm:px-9 sm:py-8 ${promise.card}`}
              >
                <span
                  className={`grid size-[4.65rem] place-items-center rounded-[1.5rem] ${promise.icon}`}
                >
                  <promise.Icon className="size-8" strokeWidth={2.1} aria-hidden />
                </span>
                <h3 className="mt-7 text-[1.7rem] leading-tight font-semibold tracking-[-0.025em] text-[#171d1b]">
                  {promise.title}
                </h3>
                <p className="mt-5 text-lg leading-[1.65] text-soil-700 sm:text-[1.3rem]">
                  {promise.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
