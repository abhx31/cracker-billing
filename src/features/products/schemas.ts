import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

/** Empty form inputs mean "no value". */
const blankToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

const productFields = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  category: optionalText,
  unit: z.string().trim().min(1, "Unit is required").max(20).default("pc"),
  price: z.coerce.number().min(0, "Price can't be negative"),
  packSize: z.preprocess(
    blankToNull,
    z.coerce.number().int("Pieces per pack must be a whole number").min(2, "A pack needs at least 2 pieces").nullable(),
  ),
  packPrice: z.preprocess(
    blankToNull,
    z.coerce.number().min(0, "Pack price can't be negative").nullable(),
  ),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
});

// Refinements go on the final schemas: zod can't omit/extend a refined object.
function requireCompletePack<T extends { packSize: number | null; packPrice: number | null }>(
  value: T,
  ctx: z.RefinementCtx,
) {
  if ((value.packSize === null) !== (value.packPrice === null)) {
    const path = value.packSize === null ? "packSize" : "packPrice";
    ctx.addIssue({ code: "custom", path: [path], message: "Fill both pack fields, or leave both empty" });
  }
}

export const productInputSchema = productFields
  .extend({
    stock: z.coerce.number().int("Stock must be a whole number").min(0, "Stock can't be negative"),
  })
  .superRefine(requireCompletePack);

export const productUpdateSchema = productFields
  .extend({ id: z.coerce.number().int().positive() })
  .superRefine(requireCompletePack);

export const stockAdjustSchema = z.object({
  productId: z.coerce.number().int().positive(),
  // Positive to add stock, negative to remove (damage, returns to supplier, ...).
  delta: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .refine((v) => v !== 0, "Quantity can't be zero"),
});

export const productActiveSchema = z.object({
  productId: z.coerce.number().int().positive(),
  isActive: z.boolean(),
});

export type ProductInput = z.infer<typeof productInputSchema>;
