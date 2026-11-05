import { roundMoney } from "@/lib/format";

export type LineInput = { unitPrice: number; quantity: number };

export type BillTotals = {
  subtotal: number;
  discountAmount: number;
  /** Total minus (subtotal - discount); between -0.50 and +0.49. */
  roundOff: number;
  /** Whole rupees. */
  total: number;
};

/** Whole rupees: paise above 50 round up, 50 paise or less round down. */
export function roundOffRupees(amount: number) {
  const paise = Math.round(amount * 100);
  const rupees = Math.floor(paise / 100);
  return paise - rupees * 100 > 50 ? rupees + 1 : rupees;
}

/** Pure so the bill form preview and the server always agree on totals. */
export function computeTotals(lines: LineInput[], discountPercent: number): BillTotals {
  const subtotal = roundMoney(
    lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
  );
  const discountAmount = roundMoney((subtotal * discountPercent) / 100);
  const exact = roundMoney(subtotal - discountAmount);
  const total = roundOffRupees(exact);
  return { subtotal, discountAmount, roundOff: roundMoney(total - exact), total };
}

/** Round-off of a saved bill, derived from its stored amounts. */
export function billRoundOff(bill: { subtotal: number; discountAmount: number; total: number }) {
  return roundMoney(bill.total - (bill.subtotal - bill.discountAmount));
}
