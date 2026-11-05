import "server-only";
import { and, asc, desc, eq, lte, sql } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";

// Stock changes with every bill, so these reads always hit the database
// (`connection()` opts them out of prerendering).

export async function listProducts() {
  await connection();
  return db.select().from(products).orderBy(desc(products.isActive), asc(products.name));
}

export async function listBillableProducts() {
  await connection();
  return db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      unit: products.unit,
      price: products.price,
      stock: products.stock,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.name));
}

export type BillableProduct = Awaited<ReturnType<typeof listBillableProducts>>[number];

export async function listLowStockProducts(limit = 8) {
  await connection();
  return db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), lte(products.stock, products.lowStockThreshold)))
    .orderBy(asc(products.stock), asc(products.name))
    .limit(limit);
}

export async function getStockSummary() {
  await connection();
  const [row] = await db
    .select({
      productCount: sql<number>`count(*)::int`,
      totalUnits: sql<number>`coalesce(sum(${products.stock}), 0)::int`,
      stockValue: sql<number>`coalesce(sum(${products.stock} * ${products.price}), 0)::float`,
      lowStockCount: sql<number>`count(*) filter (where ${products.stock} <= ${products.lowStockThreshold})::int`,
    })
    .from(products)
    .where(eq(products.isActive, true));
  return row;
}
