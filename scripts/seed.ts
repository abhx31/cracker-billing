/**
 * Loads opening stock from the supplier challan. Safe to re-run: products
 * whose name already exists are skipped (their stock is not touched).
 *   npm run db:seed
 */
import "dotenv/config";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { products, type NewProduct } from "../src/db/schema";
import { openingStock } from "./data/opening-stock";

neonConfig.webSocketConstructor = ws;

const rows: NewProduct[] = openingStock.map(([name, category, stock, price]) => ({
  name,
  category,
  unit: "box",
  price,
  stock,
  // Warn when ~20% of the opening quantity is left (at least 1).
  lowStockThreshold: Math.max(1, Math.round(stock * 0.2)),
}));

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (see .env.example)");

  const names = new Set(rows.map((r) => r.name));
  if (names.size !== rows.length) throw new Error("Duplicate product names in seed data");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  const inserted = await db
    .insert(products)
    .values(rows)
    .onConflictDoNothing({ target: products.name })
    .returning({ name: products.name });

  console.log(`Seeded ${inserted.length} products (${rows.length - inserted.length} already existed).`);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
