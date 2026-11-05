export const TIME_ZONE = "Asia/Kolkata";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});

// en-CA formats dates as YYYY-MM-DD, which is what the ?date= filter uses.
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TIME_ZONE,
});

const dayLabelFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

export const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Shop-local calendar day of a moment, e.g. "2026-11-05". */
export function toDayKey(date: Date) {
  return dayKeyFormat.format(date);
}

const shortDayLabelFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});

/** "2026-11-05" -> "Thu, 5 Nov 2026" (or "Thu, 5 Nov" when short) */
export function formatDayLabel(dayKey: string, { short = false } = {}) {
  // Midday IST avoids any edge-of-day rounding.
  const date = new Date(`${dayKey}T12:00:00+05:30`);
  return (short ? shortDayLabelFormat : dayLabelFormat).format(date);
}

export function formatCurrency(amount: number) {
  return currency.format(amount);
}

export function formatDateTime(date: Date) {
  return dateTime.format(date);
}

/** "+₹0.25" / "-₹0.50", for adjustments like round-off. */
export function formatSignedCurrency(amount: number) {
  return amount < 0 ? `-${formatCurrency(-amount)}` : `+${formatCurrency(amount)}`;
}

/** "3 pc" for pieces, "2 × pack of 25" for packs. */
export function formatQuantity(quantity: number, unit: string, piecesPerUnit: number) {
  return piecesPerUnit > 1 ? `${quantity} × ${unit}` : `${quantity} ${unit}`;
}

export function formatBillNumber(id: number) {
  return `INV-${String(id).padStart(5, "0")}`;
}

/** Rounds to 2 decimals to keep money math free of float drift. */
export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
