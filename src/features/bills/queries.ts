import "server-only";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
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

/**
 * A bill's calendar day in shop time, as YYYY-MM-DD. TIME_ZONE is a constant,
 * so it is inlined rather than bound: GROUP BY only matches the SELECT
 * expression when both are textually identical.
 */
const billDay = sql<string>`to_char(${bills.createdAt} at time zone ${sql.raw(`'${TIME_ZONE}'`)}, 'YYYY-MM-DD')`;

export async function listBills({
  query,
  day,
  limit = 50,
}: { query?: string; day?: string; limit?: number } = {}) {
  await connection();

  const conditions: (SQL | undefined)[] = [];
  const q = query?.trim();
  if (q) {
    const asNumber = Number(q.replace(/^INV-?/i, ""));
    conditions.push(
      or(
        ilike(bills.customerName, `%${q}%`),
        ilike(bills.customerPhone, `%${q}%`),
        ilike(bills.billedBy, `%${q}%`),
        Number.isInteger(asNumber) && asNumber > 0 ? eq(bills.id, asNumber) : undefined,
      ),
    );
  }
  if (day) conditions.push(sql`${billDay} = ${day}`);
  const where = and(...conditions);

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

/** Every day that has bills, newest first, with that day's count and sales. */
export async function listBillDays() {
  await connection();
  return db
    .select({
      day: billDay,
      billCount: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${bills.total}), 0)::float`,
    })
    .from(bills)
    .groupBy(billDay)
    .orderBy(desc(billDay));
}

export type BillDay = Awaited<ReturnType<typeof listBillDays>>[number];

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
