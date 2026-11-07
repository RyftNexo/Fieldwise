import { Link } from 'react-router';
import { API_MODE } from '@/api/client';
import { APP_NAME, APP_TAGLINE } from '@/app/config';

export function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="max-w-2xl text-neutral-600">{APP_TAGLINE}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card
          title="Mode"
          body={API_MODE === 'mock' ? 'Mock API (no backend needed)' : 'Live API via /api proxy'}
        />
        <Card
          title="Add a feature"
          body="Create src/features/<name>/index.tsx exporting routes + nav."
        />
        <Card title="Contracts" body="All API shapes come from @app/shared (packages/shared)." />
      </section>

      <p className="text-sm text-neutral-500">
        Reference pattern:{' '}
        <Link to="/notes" className="font-medium text-brand-600 underline-offset-4 hover:underline">
          Notes example
        </Link>{' '}
        (contract → API → DB → UI). Delete it once your first real feature exists.
      </p>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-medium text-neutral-900">{title}</h2>
      <p className="mt-1 text-sm text-neutral-600">{body}</p>
    </div>
  );
}
