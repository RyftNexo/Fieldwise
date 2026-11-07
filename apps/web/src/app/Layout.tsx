import { Sprout } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { ApiStatus } from '@/components/ApiStatus';
import { cn } from '@/lib/utils';
import { APP_NAME } from './config';
import { navItems } from './features';

export function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:gap-6">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 rounded-lg font-semibold tracking-tight text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
              <Sprout className="size-5" aria-hidden />
            </span>
            {APP_NAME}
          </Link>
          <nav
            aria-label="Main"
            className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-md px-3 py-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900',
                    isActive && 'bg-stone-100 text-stone-900',
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
        <Outlet />
      </main>
      <footer className="border-t border-stone-200 px-4 py-6 text-center text-xs text-stone-500">
        {APP_NAME} is free for farmers. It's a guide, not a decision: the Department of Agriculture
        makes the final call.
      </footer>
    </div>
  );
}
