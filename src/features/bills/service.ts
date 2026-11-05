import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
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

/**
 * Creates the bill and deducts stock atomically. Product rows are locked so two
 * billers selling the last box at the same time can't both succeed.
 */
export async function createBill(
  input: Omit<CreateBillInput, "customerPhone"> & { customerPhone: string },
): Promise<BillWithItems> {
  const requested = mergeLines(input.items);

  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(products)
      .where(inArray(products.id, [...new Set(requested.map((l) => l.productId))]))
      .for("update");
    const byId = new Map(rows.map((p) => [p.id, p]));

    const lines = requested.map(({ productId, sellAs, quantity }) => {
      const product = byId.get(productId);
      if (!product || !product.isActive) {
        throw new BillError("One of the items is no longer available. Refresh and try again.");
      }
      if (sellAs === "pack" && (product.packSize === null || product.packPrice === null)) {
        throw new BillError(`${product.name} is not sold by the pack. Refresh and try again.`);
      }
      // Price always comes from the database, never from the client.
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

    // Stock is in pieces; a product may appear as both pieces and packs.
    const piecesNeeded = new Map<number, number>();
    for (const line of lines) {
      piecesNeeded.set(
        line.productId,
        (piecesNeeded.get(line.productId) ?? 0) + line.quantity * line.piecesPerUnit,
      );
    }
    for (const [productId, pieces] of piecesNeeded) {
      const product = byId.get(productId)!;
      if (product.stock < pieces) {
        throw new BillError(
          product.stock === 0
            ? `${product.name} is out of stock`
            : `Only ${product.stock} ${product.unit} of ${product.name} left`,
        );
      }
    }

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

    for (const [productId, pieces] of piecesNeeded) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${pieces}` })
        .where(eq(products.id, productId));
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
      .select({
        productId: billItems.productId,
        quantity: billItems.quantity,
        piecesPerUnit: billItems.piecesPerUnit,
      })
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
        .set({ stock: sql`${products.stock} + ${item.quantity * item.piecesPerUnit}` })
        .where(eq(products.id, item.productId));
    }

    return {
      restoredPieces: items.reduce((sum, item) => sum + item.quantity * item.piecesPerUnit, 0),
    };
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
