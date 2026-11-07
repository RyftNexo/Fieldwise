// Demo leads for the forester's list: the three example farms, with matches worked out by the rules engine.
// Contact details are synthetic (example.test emails, 000 phone numbers); never seed real farmers' details.
import { farmProfileFixtures, type Lead } from '@app/shared';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { evaluateProfile, totalEstimatedEur } from '../advice/rules';
import { leads } from './schema';

const hoursAgo = (hours: number): string =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

type DemoLead = Pick<Lead, 'id' | 'name' | 'phone' | 'email' | 'profile'> & { hoursAgo: number };

const demoLeads: DemoLead[] = [
  {
    id: '5a1f7c3e-0d6b-4e52-9a43-1b7e6c2d8f01',
    name: 'Declan Murphy',
    phone: '+353 87 000 0101',
    profile: farmProfileFixtures.declan,
    hoursAgo: 2,
  },
  {
    id: '8c2e4b9a-3f71-4d08-b6a5-7e1d9c0f3a02',
    name: 'Aoife Ryan',
    email: 'aoife.ryan@example.test',
    profile: farmProfileFixtures.aoife,
    hoursAgo: 26,
  },
  {
    id: 'e47d1a60-92c5-4b3f-8d17-5a0b6e9c4d03',
    name: 'Mary Walsh',
    phone: '+353 86 000 0303',
    email: 'mary.walsh@example.test',
    profile: farmProfileFixtures.mary,
    hoursAgo: 50,
  },
];

export async function seed(db: LibSQLDatabase) {
  await db.insert(leads).values(
    demoLeads.map(({ hoursAgo: age, phone, email, ...lead }) => {
      const matches = evaluateProfile(lead.profile);
      return {
        ...lead,
        phone: phone ?? null,
        email: email ?? null,
        createdAt: hoursAgo(age),
        matches,
        estimatedTotalEur: totalEstimatedEur(matches),
      };
    }),
  );
}
