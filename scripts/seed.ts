/**
 * Loads the product list (scripts/data/material-list.ts).
 *
 *   npm run db:seed              add products whose name doesn't exist yet
 *   npm run db:seed -- --replace delete ALL products first, then load the list
 *                                (refused while any bills exist)
 */
import "dotenv/config";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { bills, products, type NewProduct } from "../src/db/schema";
import { materialList } from "./data/material-list";

neonConfig.webSocketConstructor = ws;

const rows: NewProduct[] = materialList.map(({ name, brand, sp, pack }) => ({
  name,
  category: brand,
  unit: "pc",
  price: sp ?? 0,
  packPrice: pack?.[0] ?? null,
  packSize: pack?.[1] ?? null,
  stock: 0,
  // Warn once roughly a pack (or 5 pieces) is left.
  lowStockThreshold: pack?.[1] ?? 5,
  // Items without a price stay out of billing until one is set.
  isActive: sp !== null,
}));

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (see .env.example)");
  const replace = process.argv.includes("--replace");

  const names = new Set(rows.map((r) => r.name));
  if (names.size !== rows.length) throw new Error("Duplicate product names in seed data");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    await db.transaction(async (tx) => {
      if (replace) {
        const [{ billCount }] = await tx.select({ billCount: count() }).from(bills);
        if (billCount > 0) {
          throw new Error(
            `Refusing to replace products: ${billCount} bill(s) exist. Delete them first.`,
          );
        }
        const removed = await tx.delete(products).returning({ id: products.id });
        await tx.execute(sql`select setval(pg_get_serial_sequence('products', 'id'), 1, false)`);
        console.log(`Removed ${removed.length} old products.`);
      }

      const inserted = await tx
        .insert(products)
        .values(rows)
        .onConflictDoNothing({ target: products.name })
        .returning({ name: products.name });
      console.log(
        `Added ${inserted.length} products (${rows.length - inserted.length} already existed).`,
      );
    });
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
