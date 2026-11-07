import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPreviewLead, listPreviewLeads } from './previewLeads';
import type { CreateLeadInput, GrantMatch } from './types';

/** Pre-contract cache key. D1-07 switches it to the leads endpoint's contract ID. */
const LEADS_KEY = ['preview', 'leads'];

/** Schemes a registered forester can help with. The IDs follow the contract draft; recheck them in D1-07. */
const FORESTRY_SCHEME_IDS = new Set(['ntas']);

export function forestryMatches(matches: GrantMatch[]): GrantMatch[] {
  return matches.filter((match) => FORESTRY_SCHEME_IDS.has(match.schemeId));
}

/** The forester's inbox, newest first. */
export function useLeads() {
  return useQuery({ queryKey: LEADS_KEY, queryFn: listPreviewLeads });
}

/** Sends a farmer's result to a forester and refreshes the inbox. */
export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, matches }: { input: CreateLeadInput; matches: GrantMatch[] }) =>
      createPreviewLead(input, matches),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}
