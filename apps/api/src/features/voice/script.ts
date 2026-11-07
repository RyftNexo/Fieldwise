import type { AdviceResponse } from '@app/shared';
import { AppError } from '../../lib/http';

/** What the caller hears. The summary already comes from the rules, so this adds no new figures. */
export function scriptFromAdvice(advice: AdviceResponse): string {
  const step = advice.nextSteps[0];
  const followUp = step ? ` Next step: ${step}` : '';
  return (
    `${advice.summary}${followUp} This is a guide, not a decision. ` +
    'The Department of Agriculture makes the final call.'
  );
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
