// EXAMPLE FEATURE — shows loading / empty / error states and a validated form via the typed client.
import { endpoints } from '@app/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { ApiError, call } from '@/api/client';

export function NotesPage() {
  const queryClient = useQueryClient();
  const notes = useQuery({
    queryKey: [endpoints.listNotes.id],
    queryFn: () => call(endpoints.listNotes),
  });
  const [title, setTitle] = useState('');

  const create = useMutation({
    mutationFn: (newTitle: string) => call(endpoints.createNote, { body: { title: newTitle } }),
    onSuccess: () => {
      setTitle('');
      return queryClient.invalidateQueries({ queryKey: [endpoints.listNotes.id] });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    create.mutate(title);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Notes (example)</h1>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New note title"
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {create.isPending ? 'Adding…' : 'Add'}
        </button>
      </form>
      {create.error && <ErrorText error={create.error} />}

      {notes.isPending && <p className="text-sm text-neutral-500">Loading…</p>}
      {notes.error && <ErrorText error={notes.error} />}
      {notes.data?.length === 0 && <p className="text-sm text-neutral-500">No notes yet.</p>}
      <ul className="space-y-2">
        {notes.data?.map((note) => (
          <li key={note.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="font-medium">{note.title}</p>
            {note.body && <p className="mt-1 text-sm text-neutral-600">{note.body}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ErrorText({ error }: { error: Error }) {
  const details =
    error instanceof ApiError && Array.isArray(error.details)
      ? (error.details as { message?: string }[]).map((d) => d.message).filter(Boolean)
      : [];
  return (
    <p role="alert" className="text-sm text-red-600">
      {details.length ? details.join(' · ') : error.message}
    </p>
  );
}
