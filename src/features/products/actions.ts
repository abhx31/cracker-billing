"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import { products } from "@/db/schema";
import { type ActionResult, errorMessage, fail, fromZodError, ok } from "@/lib/action-result";
import {
  productActiveSchema,
  productInputSchema,
  productUpdateSchema,
} from "./schemas";

export type ProductFormState = ActionResult<{ id: number }> | null;

export async function saveProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const raw = Object.fromEntries(formData);
  const isEdit = Boolean(raw.id);

  try {
    if (isEdit) {
      const parsed = productUpdateSchema.safeParse(raw);
      if (!parsed.success) return fromZodError(parsed.error);
      const { id, ...values } = parsed.data;
      const [row] = await db
        .update(products)
        .set(values)
        .where(eq(products.id, id))
        .returning({ id: products.id });
      if (!row) return fail("Product not found");
      refresh();
      return ok(row, `Updated ${values.name}`);
    }

    const parsed = productInputSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    const [row] = await db.insert(products).values(parsed.data).returning({ id: products.id });
    refresh();
    return ok(row, `Added ${parsed.data.name}`);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail("A product with this name already exists", {
        name: ["A product with this name already exists"],
      });
    }
    return fail(errorMessage(error, "Could not save product"));
  }
}

export async function setProductActive(input: {
  productId: number;
  isActive: boolean;
}): Promise<ActionResult> {
  const parsed = productActiveSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const { productId, isActive } = parsed.data;

  try {
    await db.update(products).set({ isActive }).where(eq(products.id, productId));
    refresh();
    return ok(undefined, isActive ? "Product restored" : "Product archived");
  } catch (error) {
    return fail(errorMessage(error, "Could not update product"));
  }
}
