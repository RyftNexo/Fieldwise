import type { VoiceCall } from '@app/shared';
import {
  CircleCheck,
  Keyboard,
  LoaderCircle,
  type LucideIcon,
  PhoneCall,
  PhoneOff,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react';
import type { Ref } from 'react';
import { Button } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { type CallView, failureText, isNotFound } from './voiceCall';

type ActiveView = Exclude<CallView, 'idle'>;

const TITLES: Record<ActiveView, string> = {
  ringing: 'Ringing. Answer, then describe the farm.',
  pending: 'Checking the schemes…',
  done: 'Call finished',
  failed: "The call didn't work",
  lost: 'We lost track of the call',
};

const ICONS: Record<ActiveView, LucideIcon> = {
  ringing: PhoneCall,
  pending: LoaderCircle,
  done: CircleCheck,
  failed: PhoneOff,
  lost: TriangleAlert,
};

interface CallStatusProps {
  view: ActiveView;
  call?: VoiceCall;
  /** The number as the farmer typed it. */
  dialled?: string;
  /** Why we can't check on the call (C-09 failed). */
  checkError?: Error | null;
  /** Focus moves here when the call is placed, because the phone box above locks. */
  headingRef: Ref<HTMLHeadingElement>;
  onStartAgain: () => void;
  onCheckAgain: () => void;
  onTypeInstead: () => void;
}

/** Where the call has got to, under the phone box. When it's done, the results render below this card. */
export function CallStatus({
  view,
  call,
  dialled,
  checkError,
  headingRef,
  onStartAgain,
  onCheckAgain,
  onTypeInstead,
}: CallStatusProps) {
  const problem = view === 'failed' || view === 'lost';
  return (
    <section
      aria-labelledby="call-status-heading"
      className={cardClasses(
        'surface',
        cn(
          'p-5 motion-safe:animate-rise sm:p-6',
          problem && 'border-red-200 bg-red-50 shadow-none',
        ),
      )}
    >
      <div className="flex items-start gap-4">
        <StatusIcon view={view} />
        <div className="min-w-0 flex-1">
          <h2
            id="call-status-heading"
            ref={headingRef}
            tabIndex={-1}
            className={cn(
              'pt-2 text-xl font-semibold focus:outline-none',
              problem ? 'text-red-900' : 'text-brand-900',
            )}
          >
            {TITLES[view]}
          </h2>

          {view === 'ringing' && (
            <>
              {dialled && (
                <p className="mt-1 text-soil-600">
                  Calling{' '}
                  <span className="font-semibold text-soil-800 tabular-nums">{dialled}</span>
                </p>
              )}
              <p className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-[0.95rem] text-brand-900">
                On the call, say how much land you farm, what you farm, which county, and any land
                that's too wet or too poor to use.
              </p>
            </>
          )}

          {view === 'pending' &&
            (call?.checking ? (
              <p className="mt-1 text-soil-600">The check below is running on what you said.</p>
            ) : call?.transcript ? (
              <Transcript label="What you said" text={call.transcript} />
            ) : (
              <p className="mt-1 text-soil-600">Your results will show here in a moment.</p>
            ))}

          {view === 'done' && (
            <>
              <p className="mt-1 text-soil-600">Your results are below.</p>
              {call?.transcript && (
                <Transcript label="What you said on the call" text={call.transcript} />
              )}
            </>
          )}

          {view === 'failed' && <p className="mt-1 text-red-900">{failureText(call)}</p>}

          {view === 'lost' && (
            <p className="mt-1 text-red-900">
              {checkError?.message || "We couldn't check on the call."}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {view === 'lost' && !isNotFound(checkError) && (
          <Button variant="secondary" onClick={onCheckAgain}>
            <RefreshCw className="size-4" aria-hidden />
            Check again
          </Button>
        )}
        <Button variant="secondary" onClick={onStartAgain}>
          <RotateCcw className="size-4" aria-hidden />
          Start again
        </Button>
        {problem && (
          <Button variant="ghost" onClick={onTypeInstead}>
            <Keyboard className="size-4" aria-hidden />
            Type it instead
          </Button>
        )}
      </div>
    </section>
  );
}

function StatusIcon({ view }: { view: ActiveView }) {
  const Icon = ICONS[view];
  const problem = view === 'failed' || view === 'lost';
  return (
    <span
      className={cn(
        'relative grid size-12 shrink-0 place-items-center rounded-full',
        problem ? 'bg-red-100 text-red-700' : 'bg-brand-100 text-brand-800',
      )}
    >
      {view === 'ringing' && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-brand-200/70 motion-safe:animate-ping"
        />
      )}
      <Icon
        aria-hidden
        className={cn('relative size-6', view === 'pending' && 'motion-safe:animate-spin')}
      />
    </span>
  );
}

function Transcript({ label, text }: { label: string; text: string }) {
  return (
    <figure className="mt-3 rounded-xl bg-cream-100 px-4 py-3">
      <figcaption className="text-sm font-semibold text-soil-600">{label}</figcaption>
      <blockquote className="mt-1 text-soil-800">“{text}”</blockquote>
    </figure>
  );
}
