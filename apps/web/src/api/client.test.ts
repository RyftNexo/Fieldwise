import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  adviceFixtures,
  createLeadFixture,
  endpoints,
  ringVoiceInputFixture,
  schemeFixtures,
} from '@app/shared';
import { describe, expect, it } from 'vitest';
import { mockHandlers } from '@/mocks/handlers';

const SRC = fileURLToPath(new URL('..', import.meta.url));

/** Names of endpoints referenced as `endpoints.<name>` anywhere in the web source (outside mocks/tests). */
function endpointsUsedByWeb(): string[] {
  const used = new Set<string>();
  for (const file of readdirSync(SRC, { recursive: true }) as string[]) {
    if (!/\.(ts|tsx)$/.test(file) || file.includes('mocks') || file.includes('.test.')) continue;
    for (const match of readFileSync(join(SRC, file), 'utf8').matchAll(/endpoints\.(\w+)/g)) {
      if (match[1]) used.add(match[1]);
    }
  }
  return [...used].sort();
}

describe('mock handlers', () => {
  it('exist for every endpoint the web app calls', () => {
    for (const name of endpointsUsedByWeb()) {
      const endpoint = endpoints[name as keyof typeof endpoints];
      expect(endpoint, `endpoints.${name} is not in the contract registry`).toBeDefined();
      expect(mockHandlers[endpoint.id], `missing mock for ${endpoint.id} (${name})`).toBeTypeOf(
        'function',
      );
    }
  });

  it('only exist for endpoints that are in the registry', () => {
    const ids = new Set(Object.values(endpoints).map((e) => e.id));
    for (const id of Object.keys(mockHandlers)) expect(ids.has(id), id).toBe(true);
  });

  it('return data that matches the contracts', async () => {
    const empty = { params: {}, query: {}, body: undefined };
    const health = await mockHandlers[endpoints.health.id]?.(empty);
    expect(() => endpoints.health.response.parse(health)).not.toThrow();

    const advice = await mockHandlers[endpoints.advice.id]?.({
      ...empty,
      body: { text: 'I want solar panels on the parlour roof' },
    });
    expect(endpoints.advice.response.parse(advice)).toEqual(adviceFixtures.aoife);

    const evaluated = await mockHandlers[endpoints.evaluateAdvice.id]?.({
      ...empty,
      body: { profile: adviceFixtures.declan.profile },
    });
    expect(endpoints.evaluateAdvice.response.parse(evaluated).profile).toEqual(
      adviceFixtures.declan.profile,
    );

    const schemes = await mockHandlers[endpoints.listSchemes.id]?.(empty);
    expect(endpoints.listSchemes.response.parse(schemes)).toHaveLength(schemeFixtures.length);

    const lead = endpoints.createLead.response.parse(
      await mockHandlers[endpoints.createLead.id]?.({ ...empty, body: createLeadFixture }),
    );
    expect(lead.matches.map((match) => match.schemeId)).toEqual(['ntas']);

    const leads = endpoints.listLeads.response.parse(
      await mockHandlers[endpoints.listLeads.id]?.(empty),
    );
    expect(leads[0]?.id).toBe(lead.id);
  });

  it('play a phone call through ringing, talking and the advice', async () => {
    const empty = { params: {}, query: {}, body: undefined };
    const placed = endpoints.ringVoiceCall.response.parse(
      await mockHandlers[endpoints.ringVoiceCall.id]?.({
        ...empty,
        body: ringVoiceInputFixture,
      }),
    );
    expect(placed.to).toBe(ringVoiceInputFixture.to);

    const poll = async () =>
      endpoints.getVoiceCall.response.parse(
        await mockHandlers[endpoints.getVoiceCall.id]?.({
          ...empty,
          params: { callSid: placed.callSid },
        }),
      );
    const states = [];
    for (let i = 0; i < 5; i += 1) states.push((await poll()).state);
    expect(states).toEqual(['ringing', 'ringing', 'pending', 'done', 'done']);

    const finished = await poll();
    expect(finished.callSid).toBe(placed.callSid);
    expect(finished.advice).toEqual(adviceFixtures.declan);
  });
});
