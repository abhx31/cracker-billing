import { z } from "zod";

export const billItemInputSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
  sellAs: z.enum(["piece", "pack"]).default("piece"),
});

export const createBillSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required").max(120),
  customerPhone: z
    .string()
    .trim()
    .refine((v) => {
      const digits = v.replace(/\D/g, "").length;
      return digits >= 10 && digits <= 15;
    }, "Enter a valid WhatsApp number"),
  billedBy: z.string().trim().min(1, "Enter who is billing").max(60),
  discountPercent: z.number().min(0, "Discount can't be negative").max(100, "Discount can't exceed 100%"),
  items: z.array(billItemInputSchema).min(1, "Add at least one item"),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

export const billIdSchema = z.number().int().positive();
