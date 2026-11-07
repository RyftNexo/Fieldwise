import { Sprout } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { HillsArt } from '@/components/ui/HillsArt';
import { APP_NAME, APP_TAGLINE } from './config';

export function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#main"
        className="focus-ring sr-only rounded-control bg-white px-4 py-2 font-semibold text-brand-900 shadow-raised focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-20 border-b border-soil-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[4.5rem] max-w-[91rem] items-center px-5 sm:px-8 md:h-[6.75rem] md:px-20">
          <Link
            to="/"
            className="focus-ring rounded-lg font-display text-[2rem] font-bold tracking-[-0.04em] text-brand-950"
          >
            {APP_NAME}
          </Link>

          <nav aria-label="Main" className="ml-auto flex items-center gap-4 sm:gap-8 md:gap-14">
            <a
              href="#how-it-works"
              className="focus-ring hidden rounded-lg px-1 py-2 text-lg text-soil-800 transition hover:text-brand-800 sm:block"
            >
              How it works
            </a>
            <a
              href="#about"
              className="focus-ring hidden rounded-lg px-1 py-2 text-lg text-soil-800 transition hover:text-brand-800 md:block"
            >
              About
            </a>
            <a
              href="#grant-checker"
              className="focus-ring inline-flex min-h-12 items-center rounded-full bg-gradient-to-br from-brand-800 to-brand-700 px-5 text-base font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-raised sm:px-7 sm:text-lg"
            >
              Check grants
            </a>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>

      <footer className="relative mt-20 overflow-hidden bg-brand-900 text-cream-100">
        <HillsArt className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-brand-400" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1.3fr_1fr] sm:px-6">
          <div>
            <p className="flex items-center gap-2.5 font-display text-lg font-semibold text-cream-50">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-cream-50">
                <Sprout className="size-5" aria-hidden />
              </span>
              {APP_NAME}
            </p>
            <p className="mt-3 font-semibold text-cream-50">{APP_TAGLINE}</p>
            <p className="mt-3 max-w-md text-cream-100/85">
              Plain-language grant checks for Irish farmers. Code decides what you qualify for; the
              AI only reads your words and writes the summary.
            </p>
          </div>
          <ul className="space-y-1.5 text-sm text-cream-100/85">
            <li>Free for farmers, no login.</li>
            <li>A guide, not a decision: the Department of Agriculture makes the final call.</li>
            <li>Built at Corkathon 2026, Cork.</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
