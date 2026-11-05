import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { billItems, bills, products, type BillWithItems, type WhatsappStatus } from "@/db/schema";
import { roundMoney } from "@/lib/format";
import { computeTotals } from "./calc";
import type { CreateBillInput } from "./schemas";

/** Errors whose message is safe and useful to show the biller. */
export class BillError extends Error {}

function mergeQuantities(items: CreateBillInput["items"]) {
  const merged = new Map<number, number>();
  for (const { productId, quantity } of items) {
    merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  }
  return merged;
}

/**
 * Creates the bill and deducts stock atomically. Product rows are locked so two
 * billers selling the last box at the same time can't both succeed.
 */
export async function createBill(
  input: Omit<CreateBillInput, "customerPhone"> & { customerPhone: string },
): Promise<BillWithItems> {
  const quantities = mergeQuantities(input.items);

  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(products)
      .where(inArray(products.id, [...quantities.keys()]))
      .for("update");
    const byId = new Map(rows.map((p) => [p.id, p]));

    const lines = [...quantities].map(([productId, quantity]) => {
      const product = byId.get(productId);
      if (!product || !product.isActive) {
        throw new BillError("One of the items is no longer available. Refresh and try again.");
      }
      if (product.stock < quantity) {
        throw new BillError(
          product.stock === 0
            ? `${product.name} is out of stock`
            : `Only ${product.stock} ${product.unit} of ${product.name} left`,
        );
      }
      return {
        productId,
        productName: product.name,
        unit: product.unit,
        // Price always comes from the database, never from the client.
        unitPrice: product.price,
        quantity,
        lineTotal: roundMoney(product.price * quantity),
      };
    });

    const totals = computeTotals(lines, input.discountPercent);

    const [bill] = await tx
      .insert(bills)
      .values({
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        billedBy: input.billedBy,
        discountPercent: input.discountPercent,
        ...totals,
      })
      .returning();

    const items = await tx
      .insert(billItems)
      .values(lines.map((line) => ({ ...line, billId: bill.id })))
      .returning();

    for (const line of lines) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${line.quantity}` })
        .where(eq(products.id, line.productId));
    }

    return { ...bill, items };
  });
}

/**
 * Deletes a bill and puts its items back into stock. Items whose product was
 * since deleted are skipped. The delete runs first so a second concurrent
 * delete of the same bill finds nothing and rolls back without double-adding.
 */
export async function deleteBill(billId: number) {
  return db.transaction(async (tx) => {
    const items = await tx
      .select({ productId: billItems.productId, quantity: billItems.quantity })
      .from(billItems)
      .where(eq(billItems.billId, billId));

    const [deleted] = await tx
      .delete(bills)
      .where(eq(bills.id, billId))
      .returning({ id: bills.id });
    if (!deleted) throw new BillError("Bill not found. It may already be deleted.");

    for (const item of items) {
      if (item.productId === null) continue;
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }

    return { restoredUnits: items.reduce((sum, item) => sum + item.quantity, 0) };
  });
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
