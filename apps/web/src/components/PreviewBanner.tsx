import { TriangleExclamationPoint } from 'lucide-react';
import type { ReactNode } from 'react';

/** Amber "Preview data" notice for screens that run on local data until their API exists. */
export function PreviewBanner({ children }: { children: ReactNode }) {
  return (
    <aside className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <TriangleExclamationPoint className="mt-0.5 size-5 shrink-0" aria-hidden />
      <p>
        <strong>Preview data.</strong> {children}
      </p>
    </aside>
  );
}
