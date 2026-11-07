import type { AdviceResponse, GrantMatch } from '@app/shared';
import { AppError } from '../../lib/http';

const closingLine = 'Thank you for your time. Call me back if you need anything else.';

/** What the caller hears: the grants that fit, in at most three sentences, then goodbye. */
export function scriptFromAdvice(advice: AdviceResponse): string {
  return `${grantSentences(advice.matches)} ${closingLine}`;
}

function grantSentences(matches: GrantMatch[]): string {
  const names = matches
    .filter((match) => match.eligible === 'yes' || match.eligible === 'likely')
    .map((match) => match.shortName);
  if (names.length === 0) {
    return 'I could not see a grant that clearly fits from what you told me.';
  }
  return `The grants that look available are ${joinNames(names)}.`;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
}

export function spokenFailure(error: unknown): string {
  if (error instanceof AppError && error.message.includes('three example farms')) {
    return (
      'The offline demo only knows three example farms. ' +
      'Please describe the West Cork suckler farm, ' +
      'the Tipperary dairy farm, or the Kerry sheep farm.'
    );
  }
  if (error instanceof AppError) return error.message;
  return 'Something went wrong checking the schemes. Please call again in a moment.';
}
