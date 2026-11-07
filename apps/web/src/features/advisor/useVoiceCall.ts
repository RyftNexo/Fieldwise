import { endpoints, type VoiceCall } from '@app/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { call } from '@/api/client';

const POLL_MS = 2000;

export function isFinished(state?: VoiceCall['state']): boolean {
  return state === 'done' || state === 'failed';
}

/**
 * "We'll ring you": places the call (C-08), then polls it (C-09) every two seconds until the advice is ready or the
 * call fails. Both go through the shared API client, so mock mode and the contracts apply as everywhere else.
 * Placing a call is never retried automatically: a retry would ring the farmer's phone twice.
 */
export function useVoiceCall() {
  const [callSid, setCallSid] = useState<string | null>(null);

  const ring = useMutation({
    mutationFn: (to: string) => call(endpoints.ringVoiceCall, { body: { to } }),
    onSuccess: (placed) => setCallSid(placed.callSid),
  });

  const status = useQuery({
    queryKey: [endpoints.getVoiceCall.id, callSid],
    queryFn: () => call(endpoints.getVoiceCall, { params: { callSid: callSid ?? '' } }),
    enabled: callSid !== null,
    refetchInterval: (query) =>
      query.state.error || isFinished(query.state.data?.state) ? false : POLL_MS,
    retry: 2,
  });

  const current = callSid ? status.data : undefined;
  const error = ring.error ?? (callSid ? status.error : null);

  return {
    ring(to: string) {
      setCallSid(null);
      ring.mutate(to);
    },
    call: current,
    error,
    /** True from "Ring me" until the call is done, has failed or can't be checked. */
    active: ring.isPending || (callSid !== null && !error && !isFinished(current?.state)),
  };
}
