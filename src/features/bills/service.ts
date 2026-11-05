import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db, type Transaction } from "@/db";
import { billItems, bills, products, type BillWithItems, type WhatsappStatus } from "@/db/schema";
import { sellUnit, type SellAs } from "@/features/products/pack";
import { roundMoney } from "@/lib/format";
import { computeTotals } from "./calc";
import type { CreateBillInput } from "./schemas";

/** Errors whose message is safe and useful to show the biller. */
export class BillError extends Error {}

/** Combines duplicate lines: one entry per product + piece/pack. */
function mergeLines(items: CreateBillInput["items"]) {
  const merged = new Map<string, { productId: number; sellAs: SellAs; quantity: number }>();
  for (const { productId, sellAs, quantity } of items) {
    const key = `${productId}:${sellAs}`;
    const existing = merged.get(key);
    if (existing) existing.quantity += quantity;
    else merged.set(key, { productId, sellAs, quantity });
  }
  return [...merged.values()];
}

type BillInput = Omit<CreateBillInput, "customerPhone"> & { customerPhone: string };

/** Turns requested lines into priced bill items. Prices always come from the database. */
async function priceLines(tx: Transaction, items: CreateBillInput["items"]) {
  const requested = mergeLines(items);
  const rows = await tx
    .select()
    .from(products)
    .where(inArray(products.id, [...new Set(requested.map((l) => l.productId))]));
  const byId = new Map(rows.map((p) => [p.id, p]));

  return requested.map(({ productId, sellAs, quantity }) => {
    const product = byId.get(productId);
    if (!product || !product.isActive) {
      throw new BillError("One of the items is no longer available. Refresh and try again.");
    }
    if (sellAs === "pack" && (product.packSize === null || product.packPrice === null)) {
      throw new BillError(`${product.name} is not sold by the pack. Refresh and try again.`);
    }
    const { unitPrice, piecesPerUnit, unit } = sellUnit(product, sellAs);
    return {
      productId,
      productName: product.name,
      unit,
      unitPrice,
      quantity,
      piecesPerUnit,
      lineTotal: roundMoney(unitPrice * quantity),
    };
  });
}

/** Saves the bill and its items in one transaction. Stock isn't tracked. */
export async function createBill(input: BillInput): Promise<BillWithItems> {
  return db.transaction(async (tx) => {
    const lines = await priceLines(tx, input.items);
    const { subtotal, discountAmount, total } = computeTotals(lines, input.discountPercent);

    const [bill] = await tx
      .insert(bills)
      .values({
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        billedBy: input.billedBy,
        discountPercent: input.discountPercent,
        subtotal,
        discountAmount,
        total,
      })
      .returning();

    const items = await tx
      .insert(billItems)
      .values(lines.map((line) => ({ ...line, billId: bill.id })))
      .returning();

    return { ...bill, items };
  });
}

/**
 * Replaces a bill's details and items, keeping its number, date and PDF link.
 * The customer hasn't seen the new version yet, so WhatsApp goes back to pending.
 */
export async function updateBill(billId: number, input: BillInput): Promise<BillWithItems> {
  return db.transaction(async (tx) => {
    // Lock the bill so a concurrent edit or delete waits for this one.
    const [existing] = await tx
      .select({ id: bills.id })
      .from(bills)
      .where(eq(bills.id, billId))
      .for("update");
    if (!existing) throw new BillError("Bill not found. It may have been deleted.");

    const lines = await priceLines(tx, input.items);
    const { subtotal, discountAmount, total } = computeTotals(lines, input.discountPercent);

    const [bill] = await tx
      .update(bills)
      .set({
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        billedBy: input.billedBy,
        discountPercent: input.discountPercent,
        subtotal,
        discountAmount,
        total,
        whatsappStatus: "pending",
        whatsappError: null,
        editedAt: new Date(),
      })
      .where(eq(bills.id, billId))
      .returning();

    await tx.delete(billItems).where(eq(billItems.billId, billId));
    const items = await tx
      .insert(billItems)
      .values(lines.map((line) => ({ ...line, billId })))
      .returning();

    return { ...bill, items };
  });
}

/** Deletes a bill; its items go with it (cascade). */
export async function deleteBill(billId: number) {
  const [deleted] = await db
    .delete(bills)
    .where(eq(bills.id, billId))
    .returning({ id: bills.id });
  if (!deleted) throw new BillError("Bill not found. It may already be deleted.");
}

export async function setWhatsappStatus(
  billId: number,
  status: WhatsappStatus,
  error: string | null = null,
) {
  await db
    .update(bills)
    .set({ whatsappStatus: status, whatsappError: error })
    .where(eq(bills.id, billId));
}
