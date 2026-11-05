import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";

// Prices can be edited at any time, so these reads always hit the database
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
      packSize: products.packSize,
      packPrice: products.packPrice,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.name));
}

export type BillableProduct = Awaited<ReturnType<typeof listBillableProducts>>[number];
