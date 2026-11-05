import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  category: optionalText,
  unit: z.string().trim().min(1, "Unit is required").max(20).default("box"),
  price: z.coerce.number().min(0, "Price can't be negative"),
  stock: z.coerce.number().int("Stock must be a whole number").min(0, "Stock can't be negative"),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
});

export const productUpdateSchema = productInputSchema.omit({ stock: true }).extend({
  id: z.coerce.number().int().positive(),
});

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
