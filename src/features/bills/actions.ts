"use server";

import { and, eq, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { bills } from "@/db/schema";
import { type ActionResult, errorMessage, fail, fromZodError, ok } from "@/lib/action-result";
import {
  billWhatsappShare,
  sendBill,
  toWhatsappNumber,
  whatsappMode,
  type WhatsappMode,
} from "@/features/whatsapp";
import type { WhatsappShare } from "@/features/whatsapp/links";
import { isValidPhone } from "@/features/whatsapp/phone";
import { getBill } from "./queries";
import { billIdSchema, createBillSchema, type CreateBillInput } from "./schemas";
import {
  BillError,
  createBill as createBillRecord,
  deleteBill as deleteBillRecord,
  setWhatsappStatus,
} from "./service";

export type CreateBillResult = ActionResult<{
  id: number;
  whatsapp: {
    mode: WhatsappMode;
    sent: boolean;
    error?: string;
    /** Link mode: what the client needs to open the customer's chat. */
    share?: WhatsappShare;
  };
}>;

export async function createBill(input: CreateBillInput): Promise<CreateBillResult> {
  const parsed = createBillSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const customerPhone = toWhatsappNumber(parsed.data.customerPhone);
  if (!isValidPhone(customerPhone)) {
    return fail("Enter a valid WhatsApp number", { customerPhone: ["Enter a valid WhatsApp number"] });
  }

  let bill;
  try {
    bill = await createBillRecord({ ...parsed.data, customerPhone });
  } catch (error) {
    return fail(error instanceof BillError ? error.message : errorMessage(error, "Could not save bill"));
  }

  // The bill is saved at this point; a WhatsApp failure must not undo it.
  const mode = whatsappMode();
  const result = await sendBill(bill);
  if (result) {
    await setWhatsappStatus(
      bill.id,
      result.status,
      result.status === "failed" ? result.error : null,
    ).catch(() => {});
  }

  refresh();
  return ok({
    id: bill.id,
    whatsapp: {
      mode,
      sent: result?.status === "sent",
      error: result?.status === "failed" ? result.error : undefined,
      share: mode === "link" ? billWhatsappShare(bill) : undefined,
    },
  });
}

/**
 * Deletes a bill. Doesn't call refresh(): the
 * caller either navigates away (from the deleted bill's page, which would
 * otherwise re-render as "not found") or refreshes the router itself.
 */
export async function deleteBill(billId: number): Promise<ActionResult> {
  const id = billIdSchema.safeParse(billId);
  if (!id.success) return fromZodError(id.error);

  try {
    await deleteBillRecord(id.data);
    return ok(undefined, "Bill deleted.");
  } catch (error) {
    return fail(error instanceof BillError ? error.message : errorMessage(error, "Could not delete bill"));
  }
}

/** Records that the biller opened the wa.me link for this bill. */
export async function markBillShared(billId: number): Promise<ActionResult> {
  const id = billIdSchema.safeParse(billId);
  if (!id.success) return fromZodError(id.error);

  await db
    .update(bills)
    .set({ whatsappStatus: "shared", whatsappError: null })
    .where(and(eq(bills.id, id.data), ne(bills.whatsappStatus, "sent")));
  refresh();
  return ok(undefined);
}

/** Retries automatic delivery (Cloud API mode only). */
export async function resendBill(billId: number): Promise<ActionResult> {
  const id = billIdSchema.safeParse(billId);
  if (!id.success) return fromZodError(id.error);

  const bill = await getBill(id.data);
  if (!bill) return fail("Bill not found");

  const result = await sendBill(bill);
  if (!result) return fail("Automatic WhatsApp sending is not configured");

  await setWhatsappStatus(bill.id, result.status, result.status === "failed" ? result.error : null);
  refresh();
  return result.status === "sent" ? ok(undefined, "Sent on WhatsApp") : fail(result.error);
}
