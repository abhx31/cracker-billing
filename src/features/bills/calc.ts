import { roundMoney } from "@/lib/format";

export type LineInput = { unitPrice: number; quantity: number };

export type BillTotals = {
  subtotal: number;
  discountAmount: number;
  total: number;
};

/** Pure so the bill form preview and the server always agree on totals. */
export function computeTotals(lines: LineInput[], discountPercent: number): BillTotals {
  const subtotal = roundMoney(
    lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
  );
  const discountAmount = roundMoney((subtotal * discountPercent) / 100);
  return { subtotal, discountAmount, total: roundMoney(subtotal - discountAmount) };
}
