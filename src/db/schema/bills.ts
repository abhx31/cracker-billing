import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { products } from "./products";

export const whatsappStatus = pgEnum("whatsapp_status", [
  "pending", // not shared yet
  "sent", // delivered to the WhatsApp Cloud API
  "shared", // opened via wa.me link by the biller
  "failed", // Cloud API returned an error
]);

export const bills = pgTable(
  "bills",
  {
    id: serial("id").primaryKey(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    billedBy: text("billed_by").notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2, mode: "number" }).notNull(),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    total: numeric("total", { precision: 12, scale: 2, mode: "number" }).notNull(),
    whatsappStatus: whatsappStatus("whatsapp_status").notNull().default("pending"),
    whatsappError: text("whatsapp_error"),
    // Unguessable id for the public PDF link sent to the customer (128-bit random).
    shareToken: text("share_token")
      .notNull()
      .unique()
      .default(sql`replace(gen_random_uuid()::text, '-', '')`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("bills_created_at_idx").on(t.createdAt)],
);

export const billItems = pgTable(
  "bill_items",
  {
    id: serial("id").primaryKey(),
    billId: integer("bill_id")
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    // Snapshot so old bills stay correct after a product is renamed/re-priced.
    productName: text("product_name").notNull(),
    unit: text("unit").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2, mode: "number" }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: numeric("line_total", { precision: 12, scale: 2, mode: "number" }).notNull(),
  },
  (t) => [
    index("bill_items_bill_id_idx").on(t.billId),
    check("bill_items_quantity_positive", sql`${t.quantity} > 0`),
  ],
);

export const billsRelations = relations(bills, ({ many }) => ({
  items: many(billItems),
}));

export const billItemsRelations = relations(billItems, ({ one }) => ({
  bill: one(bills, { fields: [billItems.billId], references: [bills.id] }),
  product: one(products, { fields: [billItems.productId], references: [products.id] }),
}));

export type Bill = typeof bills.$inferSelect;
export type BillItem = typeof billItems.$inferSelect;
export type BillWithItems = Bill & { items: BillItem[] };
export type WhatsappStatus = (typeof whatsappStatus.enumValues)[number];
