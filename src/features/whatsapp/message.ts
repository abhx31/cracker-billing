import type { BillWithItems } from "@/db/schema";
import { billRoundOff } from "@/features/bills/calc";
import { formatBillNumber, formatCurrency, formatDateTime, formatSignedCurrency } from "@/lib/format";

/**
 * Plain-text bill using WhatsApp's *bold* markup. With a PDF link the message
 * stays short (the PDF has the items); without one it lists every item.
 */
export function buildBillMessage(bill: BillWithItems, shopName: string, pdfUrl?: string | null) {
  const lines = [
    `*${shopName}*`,
    `Bill: ${formatBillNumber(bill.id)}`,
    `Date: ${formatDateTime(bill.createdAt)}`,
    `Customer: ${bill.customerName}`,
    "",
  ];

  if (pdfUrl) {
    const count = bill.items.length;
    lines.push(
      `${count} ${count === 1 ? "item" : "items"} · *Total: ${formatCurrency(bill.total)}*`,
      "",
      "📄 Your bill (PDF):",
      pdfUrl,
    );
  } else {
    lines.push(
      "*Items*",
      ...bill.items.map(
        (item, i) =>
          `${i + 1}. ${item.productName} (${item.unit}) × ${item.quantity} = ${formatCurrency(item.lineTotal)}`,
      ),
      "",
      `Subtotal: ${formatCurrency(bill.subtotal)}`,
    );
    if (bill.discountAmount > 0) {
      lines.push(`Discount (${bill.discountPercent}%): -${formatCurrency(bill.discountAmount)}`);
    }
    const roundOff = billRoundOff(bill);
    if (roundOff !== 0) {
      lines.push(`Round off: ${formatSignedCurrency(roundOff)}`);
    }
    lines.push(`*Total: ${formatCurrency(bill.total)}*`);
  }

  lines.push(
    "",
    `Billed by: ${bill.billedBy}`,
    "Thank you for your purchase! Celebrate safely 🎆",
  );

  return lines.join("\n");
}
