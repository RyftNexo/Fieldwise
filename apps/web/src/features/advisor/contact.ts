/** Loose check that a phone number has the digits a forester could ring (7 to 15 of them). */
export function isPlausiblePhone(input: string): boolean {
  const trimmed = input.trim();
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/** "087 123 4567" → "tel:0871234567". */
export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
