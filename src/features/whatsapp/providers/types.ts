import type { BillWithItems } from "@/db/schema";

export type SendBillInput = {
  /** Digits-only international number, e.g. 919876543210 */
  to: string;
  text: string;
  bill: BillWithItems;
};

export type SendResult = { status: "sent" } | { status: "failed"; error: string };

/** Anything that can deliver a bill without the biller tapping "send". */
export interface WhatsappSender {
  readonly name: string;
  send(input: SendBillInput): Promise<SendResult>;
}
