import { type CreateLeadInput, endpoints, type GrantMatch } from '@app/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { call } from '@/api/client';

/** Schemes a registered forester can help with. `ntas` is the id in the shared fixtures; check dev2's seed. */
const FORESTRY_SCHEME_IDS = new Set(['ntas']);

export function forestryMatches(matches: GrantMatch[]): GrantMatch[] {
  return matches.filter((match) => FORESTRY_SCHEME_IDS.has(match.schemeId));
}

/** The forester's inbox, newest first (C-07). */
export function useLeads() {
  return useQuery({
    queryKey: [endpoints.listLeads.id],
    queryFn: () => call(endpoints.listLeads),
  });
}

/** Sends a farmer's result to a forester (C-06) and refreshes the inbox. The server works out matches and totals. */
export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLeadInput) => call(endpoints.createLead, { body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [endpoints.listLeads.id] }),
  });
}
