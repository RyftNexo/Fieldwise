import { endpoints } from '@app/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { call } from '@/api/client';
import { callView, nextPoll, shouldRetry } from './voiceCall';

interface PlacedCall {
  callSid: string;
  /** The number as the farmer typed it, to show back to them. */
  dialled: string;
}

/**
 * "We'll ring you": places the call (C-08), then polls it (C-09) every two seconds until the advice is ready or the
 * call fails. Both go through the shared API client, so mock mode and the contracts apply as everywhere else.
 * Placing a call is never retried automatically: a retry would ring the farmer's phone twice.
 */
export function useVoiceCall() {
  const [placed, setPlaced] = useState<PlacedCall | null>(null);
  // Each ring gets a number, so a slow reply to a ring the farmer has abandoned can't bring that call back.
  const latestRing = useRef(0);

  const ring = useMutation({
    mutationFn: (to: string) => call(endpoints.ringVoiceCall, { body: { to } }),
  });

  const callSid = placed?.callSid ?? null;
  const status = useQuery({
    queryKey: [endpoints.getVoiceCall.id, callSid],
    queryFn: ({ signal }) =>
      call(endpoints.getVoiceCall, { params: { callSid: callSid ?? '' }, signal }),
    enabled: callSid !== null,
    refetchInterval: (query) => nextPoll(query.state.data?.state, query.state.error !== null),
    retry: shouldRetry,
  });

  const current = callSid ? status.data : undefined;
  const checkError = callSid ? status.error : null;
  const view = callView(callSid, current, checkError);

  return {
    view,
    callSid,
    call: current,
    dialled: placed?.dialled,
    advice: view === 'done' ? current?.advice : undefined,
    placing: ring.isPending,
    ringError: ring.error,
    checkError,
    /** From "Call me" until the call is done, has failed or can't be checked. */
    inProgress: ring.isPending || view === 'ringing' || view === 'pending',
    /** The last call stays on screen until the new one is placed, so a refused number doesn't wipe the results. */
    ring(to: string) {
      latestRing.current += 1;
      const thisRing = latestRing.current;
      ring.mutate(to, {
        onSuccess: (result) => {
          if (latestRing.current === thisRing) setPlaced({ callSid: result.callSid, dialled: to });
        },
      });
    },
    /** Stops following the call. There is no hang-up endpoint, so the phone call itself carries on. */
    reset() {
      latestRing.current += 1;
      ring.reset();
      setPlaced(null);
    },
    checkAgain() {
      void status.refetch();
    },
  };
}
