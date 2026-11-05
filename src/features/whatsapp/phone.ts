/**
 * Normalizes a phone number to the digits-only international format WhatsApp
 * expects (e.g. "98765 43210" -> "919876543210").
 */
export function normalizePhone(raw: string, defaultCountryCode = "91") {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = defaultCountryCode + digits;
  return digits;
}

export function isValidPhone(normalized: string) {
  return /^\d{11,15}$/.test(normalized);
}
