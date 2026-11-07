// Agri-Climate Rural Environment Scheme. Whether it is taking new entrants is not something we verified, and
// payments depend on actions and field scores, so this is always "check" with no euro total.
import type { FarmProfile, GrantMatch } from '@app/shared';
import { acresFacts, officialUrls } from '../../schemes/facts';
import { formatEur } from './format';

export function evaluateAcres(profile: FarmProfile): GrantMatch | null {
  if (profile.enterprise === 'other') return null;

  const reasons = [
    `ACRES pays for farming that helps nature, climate and water: up to ${formatEur(acresFacts.generalMaxPerYearEur)} a year in ACRES General, or up to ${formatEur(acresFacts.cooperationMaxPerYearEur)} in the priority areas (Co-operation). You enter one, not both.`,
  ];
  if (profile.nearWatercourse) {
    reasons.push(
      'Your land borders a watercourse, and ACRES includes riparian buffer zone actions.',
    );
  }
  reasons.push(
    'We could not confirm whether ACRES is taking new applicants. The amount depends on the actions you choose and your field scores.',
  );

  return {
    schemeId: 'acres',
    name: 'Agri-Climate Rural Environment Scheme',
    shortName: 'ACRES',
    eligible: 'check',
    reasons,
    status: 'unknown',
    nextStep: 'Ask an approved ACRES adviser or your Teagasc office whether you can join now.',
    url: officialUrls.acres,
  };
}
