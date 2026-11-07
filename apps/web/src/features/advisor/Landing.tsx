import {
  ArrowRight,
  Calculator,
  Eye,
  type LucideIcon,
  MessageSquareText,
  Scale,
  ScanText,
  ShieldCheck,
  Trees,
} from 'lucide-react';
import { Link } from 'react-router';
import { Pill } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { HillsArt } from '@/components/ui/HillsArt';
import { SectionHeading } from '@/components/ui/SectionHeading';

const STEPS: { title: string; body: string; Icon: LucideIcon; ai: boolean }[] = [
  {
    title: 'Understand',
    body: 'The AI turns what you said into farm details: hectares, what you farm, where, and the land you can’t use.',
    Icon: ScanText,
    ai: true,
  },
  {
    title: 'Check the rules',
    body: 'Plain code checks those details against each scheme’s criteria and does the euro maths. The AI isn’t involved.',
    Icon: Scale,
    ai: false,
  },
  {
    title: 'Explain',
    body: 'The AI writes a short summary of those results only. It can’t add a scheme or change a number.',
    Icon: MessageSquareText,
    ai: true,
  },
];

const PROMISES: { title: string; body: string; Icon: LucideIcon }[] = [
  {
    title: 'Code decides, AI only talks',
    body: 'Whether you qualify, and how much, comes from rules built on Department of Agriculture scheme criteria, not from a chatbot’s guess.',
    Icon: ShieldCheck,
  },
  {
    title: 'Every answer shows its working',
    body: 'Each grant lists the rule that matched, how any figure was worked out, and a link to the official scheme page.',
    Icon: Calculator,
  },
  {
    title: 'Honest about its limits',
    body: 'We can’t check herd numbers, land parcels, nitrates or soil tests, so some answers say “likely” or “check first” and point you to Teagasc or a registered forester.',
    Icon: Eye,
  },
];

/** The sections under the hero that explain the product to a first-time visitor (and the judges). */
export function Landing() {
  return (
    <>
      <section aria-labelledby="how-heading" className="bg-cream-100 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            id="how-heading"
            eyebrow="How it works"
            title="Code decides. AI only talks."
            lead="Three steps, and only the middle one decides anything. You can open each step's data after a check."
          />
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className={cardClasses('surface', 'p-6')}>
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                    <step.Icon className="size-6" aria-hidden />
                  </span>
                  <Pill tone={step.ai ? 'ai' : 'code'}>{step.ai ? 'AI' : 'No AI'}</Pill>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-brand-900">
                  <span className="text-soil-400">{index + 1}. </span>
                  {step.title}
                </h3>
                <p className="mt-2 text-soil-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="trust-heading" className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            id="trust-heading"
            eyebrow="Why you can trust it"
            title="A guide you can check, not a black box"
          />
          <ul className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
            {PROMISES.map((promise) => (
              <li key={promise.title}>
                <span className="grid size-11 place-items-center rounded-full bg-harvest-100 text-harvest-800">
                  <promise.Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-brand-900">{promise.title}</h3>
                <p className="mt-1.5 text-soil-600">{promise.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="forester-pitch-heading" className="px-4 sm:px-6">
        <div
          className={cardClasses(
            'deep',
            'relative mx-auto max-w-6xl overflow-hidden px-6 py-10 sm:px-12 sm:py-14',
          )}
        >
          <HillsArt className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full text-brand-300" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div className="max-w-xl">
              <p className="flex items-center gap-2 text-sm font-bold tracking-wider text-harvest-300 uppercase">
                <Trees className="size-4" aria-hidden />
                For registered foresters
              </p>
              <h2
                id="forester-pitch-heading"
                className="mt-3 text-3xl font-semibold tracking-tight text-cream-50 sm:text-4xl"
              >
                Pre-qualified leads, free for farmers
              </h2>
              <p className="mt-3 text-lg text-cream-100/85">
                Farmers with land that suits native woodland can send their results to a forester in
                their area. Foresters pay per lead, so every call is to someone likely to qualify.
              </p>
            </div>
            <Link
              to="/forester"
              className={buttonClasses({ variant: 'accent', size: 'lg', className: 'self-start' })}
            >
              Open the forester inbox
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
