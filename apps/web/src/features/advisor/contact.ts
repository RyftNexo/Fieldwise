function withoutIrishPrefix(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('353')) return digits.slice(3);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
}

/** Returns at most the nine national-number digits shown after Ireland's +353 prefix. */
export function irishLocalDigits(input: string): string {
  return withoutIrishPrefix(input).slice(0, 9);
}

/** Irish mobile numbers contain nine national-number digits and begin with 8. */
export function isCompleteIrishMobile(input: string): boolean {
  return /^8\d{8}$/.test(withoutIrishPrefix(input));
}

/** Converts the segmented field value into the international number expected by the call API. */
export function toIrishE164(input: string): string {
  const local = irishLocalDigits(input);
  return local ? `+353${local}` : '';
}
