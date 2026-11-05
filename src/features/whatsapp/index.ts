import "server-only";
import type { BillWithItems } from "@/db/schema";
import { env, publicAppUrl } from "@/lib/env";
import type { WhatsappShare } from "./links";
import { buildBillMessage } from "./message";
import { normalizePhone } from "./phone";
import { createCloudApiSender } from "./providers/cloud-api";
import type { SendResult, WhatsappSender } from "./providers/types";

export type WhatsappMode = "cloud-api" | "link";

let sender: WhatsappSender | null | undefined;

/** Returns an automatic sender if one is configured, otherwise null (link mode). */
function getAutoSender(): WhatsappSender | null {
  if (sender !== undefined) return sender;
  const e = env();
  sender =
    e.WHATSAPP_ACCESS_TOKEN && e.WHATSAPP_PHONE_NUMBER_ID
      ? createCloudApiSender({
          accessToken: e.WHATSAPP_ACCESS_TOKEN,
          phoneNumberId: e.WHATSAPP_PHONE_NUMBER_ID,
          apiVersion: e.WHATSAPP_API_VERSION,
          templateName: e.WHATSAPP_TEMPLATE_NAME,
          templateLanguage: e.WHATSAPP_TEMPLATE_LANGUAGE,
        })
      : null;
  return sender;
}

export function whatsappMode(): WhatsappMode {
  return getAutoSender() ? "cloud-api" : "link";
}

/** App-relative path of the bill's PDF (works for the biller anywhere). */
export function billPdfPath(bill: BillWithItems) {
  return `/b/${bill.shareToken}`;
}

/** Full PDF link customers can open; null when the app isn't deployed. */
export function billPdfUrl(bill: BillWithItems) {
  const base = publicAppUrl();
  return base ? `${base}${billPdfPath(bill)}` : null;
}

export function billMessage(bill: BillWithItems) {
  return buildBillMessage(bill, env().SHOP_NAME, billPdfUrl(bill));
}

export function toWhatsappNumber(phone: string) {
  return normalizePhone(phone, env().WHATSAPP_DEFAULT_COUNTRY_CODE);
}

/** Number + pre-typed bill for opening the customer's chat (see ./links.ts). */
export function billWhatsappShare(bill: BillWithItems): WhatsappShare {
  return { phone: toWhatsappNumber(bill.customerPhone), text: billMessage(bill) };
}

/** Sends automatically when a provider is configured; returns null in link mode. */
export async function sendBill(bill: BillWithItems): Promise<SendResult | null> {
  const auto = getAutoSender();
  if (!auto) return null;
  return auto.send({
    to: toWhatsappNumber(bill.customerPhone),
    text: billMessage(bill),
    bill,
  });
}
