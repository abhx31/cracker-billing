ALTER TABLE "products" ALTER COLUMN "unit" SET DEFAULT 'pc';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "pack_size" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "pack_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "bill_items" ADD COLUMN "pieces_per_unit" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_pack_complete" CHECK (("products"."pack_size" is null and "products"."pack_price" is null) or ("products"."pack_size" >= 2 and "products"."pack_price" >= 0));