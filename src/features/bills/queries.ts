import "server-only";
import { asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { billItems, bills, type BillWithItems } from "@/db/schema";
import { TIME_ZONE } from "@/lib/format";

export async function getBill(id: number): Promise<BillWithItems | undefined> {
  await connection();
  return db.query.bills.findFirst({
    where: eq(bills.id, id),
    with: { items: { orderBy: asc(billItems.id) } },
  });
}

/** Lookup for the public PDF link; the token is the only credential. */
export async function getBillByShareToken(token: string): Promise<BillWithItems | undefined> {
  await connection();
  return db.query.bills.findFirst({
    where: eq(bills.shareToken, token),
    with: { items: { orderBy: asc(billItems.id) } },
  });
}

export async function listBills({ query, limit = 50 }: { query?: string; limit?: number } = {}) {
  await connection();

  let where: SQL | undefined;
  const q = query?.trim();
  if (q) {
    const asNumber = Number(q.replace(/^INV-?/i, ""));
    where = or(
      ilike(bills.customerName, `%${q}%`),
      ilike(bills.customerPhone, `%${q}%`),
      ilike(bills.billedBy, `%${q}%`),
      Number.isInteger(asNumber) && asNumber > 0 ? eq(bills.id, asNumber) : undefined,
    );
  }

  return db
    .select({
      id: bills.id,
      customerName: bills.customerName,
      customerPhone: bills.customerPhone,
      billedBy: bills.billedBy,
      total: bills.total,
      whatsappStatus: bills.whatsappStatus,
      createdAt: bills.createdAt,
      itemCount: sql<number>`(select coalesce(sum(${billItems.quantity}), 0) from ${billItems} where ${billItems.billId} = ${bills.id})::int`,
    })
    .from(bills)
    .where(where)
    .orderBy(desc(bills.createdAt))
    .limit(limit);
}

export type BillListRow = Awaited<ReturnType<typeof listBills>>[number];

export async function getTodaySalesSummary() {
  await connection();
  const [row] = await db
    .select({
      billCount: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${bills.total}), 0)::float`,
    })
    .from(bills)
    .where(
      sql`(${bills.createdAt} at time zone ${TIME_ZONE})::date = (now() at time zone ${TIME_ZONE})::date`,
    );
  return row;
}
