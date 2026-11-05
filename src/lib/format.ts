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

export function formatCurrency(amount: number) {
  return currency.format(amount);
}

export function formatDateTime(date: Date) {
  return dateTime.format(date);
}

export function formatBillNumber(id: number) {
  return `INV-${String(id).padStart(5, "0")}`;
}

/** Rounds to 2 decimals to keep money math free of float drift. */
export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
