import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    category: text("category"),
    unit: text("unit").notNull().default("pc"),
    /** Price of one piece (SP). */
    price: numeric("price", { precision: 12, scale: 2, mode: "number" }).notNull(),
    /** Optional whole-pack offer: `packPrice` for `packSize` pieces. Both or neither. */
    packSize: integer("pack_size"),
    packPrice: numeric("pack_price", { precision: 12, scale: 2, mode: "number" }),
    // Unused (the shop doesn't track stock); kept so no migration is needed.
    stock: integer("stock").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    // Last line of defence against overselling.
    check("products_stock_non_negative", sql`${t.stock} >= 0`),
    check("products_price_non_negative", sql`${t.price} >= 0`),
    check(
      "products_pack_complete",
      sql`(${t.packSize} is null and ${t.packPrice} is null) or (${t.packSize} >= 2 and ${t.packPrice} >= 0)`,
    ),
  ],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
