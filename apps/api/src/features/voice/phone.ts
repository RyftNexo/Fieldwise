/**
 * A number Twilio can dial. Irish mobiles are written 08… locally;
 * the leading 0 is dropped once the +353 country code is added.
 */
export function toE164(phone: string): string | undefined {
  const compact = phone.replace(/[^\d+]/gu, '');
  if (compact.startsWith('+3530')) return toE164(`+353${compact.slice(5)}`);
  if (compact.startsWith('+')) {
    const digits = compact.slice(1);
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : undefined;
  }
  if (compact.startsWith('00')) return toE164(`+${compact.slice(2)}`);
  if (compact.startsWith('0')) return toE164(`+353${compact.slice(1)}`);
  return undefined;
}
