import { Sprout } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { ApiStatus } from '@/components/ApiStatus';
import { HillsArt } from '@/components/ui/HillsArt';
import { cn } from '@/lib/utils';
import { APP_NAME } from './config';
import { navItems } from './features';

export function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#main"
        className="focus-ring sr-only rounded-control bg-white px-4 py-2 font-semibold text-brand-900 shadow-raised focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-20 border-b border-soil-100/80 bg-cream-50/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <Link to="/" className="focus-ring flex shrink-0 items-center gap-2.5 rounded-control">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-700 text-cream-50 shadow-card">
              <Sprout className="size-5" aria-hidden />
            </span>
            <span className="sr-only font-display text-lg font-semibold tracking-tight text-brand-900 sm:not-sr-only">
              {APP_NAME}
            </span>
          </Link>

          <nav
            aria-label="Main"
            className="flex min-w-0 items-center gap-1 rounded-full bg-white/80 p-1 ring-1 ring-soil-100"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'focus-ring whitespace-nowrap rounded-full px-3.5 py-1.5 text-[0.95rem] font-semibold transition duration-200',
                    isActive
                      ? 'bg-brand-700 text-white shadow-card'
                      : 'text-soil-600 hover:text-brand-900',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto shrink-0">
            <ApiStatus />
          </div>
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
