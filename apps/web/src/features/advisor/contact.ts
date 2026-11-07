/** Loose check that a phone number has enough digits for a call (7 to 15 of them). */
export function isPlausiblePhone(input: string): boolean {
  const trimmed = input.trim();
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}
