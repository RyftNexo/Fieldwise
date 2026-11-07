import { describe, expect, it } from 'vitest';
import { createPreviewLead, listPreviewLeads } from './previewLeads';
import type { GrantMatch } from './types';

const match = (schemeId: string, totalEur?: number): GrantMatch => ({
  schemeId,
  name: schemeId,
  shortName: schemeId.toUpperCase(),
  eligible: 'likely',
  reasons: [],
  value: totalEur === undefined ? undefined : { totalEur, basis: '' },
  status: 'unknown',
  nextStep: '',
  url: 'https://www.gov.ie',
});

describe('preview leads', () => {
  it('starts with the two examples, newest first', async () => {
    const leads = await listPreviewLeads();
    expect(leads.map((lead) => lead.name)).toEqual(['Siobhán', 'Pat']);
  });

  it('puts a new lead on top with only the chosen schemes and their total', async () => {
    const lead = await createPreviewLead(
      {
        profile: { hectares: 40, enterprise: 'suckler', missing: [] },
        schemeIds: ['ntas'],
        name: 'Declan',
        phone: '087 123 4567',
        consent: true,
      },
      [match('ntas', 44_900), match('biss')],
    );
    expect(lead.matches.map((chosen) => chosen.schemeId)).toEqual(['ntas']);
    expect(lead.estimatedTotalEur).toBe(44_900);

    const leads = await listPreviewLeads();
    expect(leads[0]?.id).toBe(lead.id);
  });
});
