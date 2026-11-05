import "server-only";
import { formatBillNumber, formatCurrency } from "@/lib/format";
import type { SendBillInput, SendResult, WhatsappSender } from "./types";

type CloudApiConfig = {
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
  templateName?: string;
  templateLanguage: string;
};

/**
 * Meta WhatsApp Cloud API.
 *
 * Free-form text only reaches customers who messaged you in the last 24h.
 * Configure an approved template (WHATSAPP_TEMPLATE_NAME) to reach anyone.
 */
export function createCloudApiSender(config: CloudApiConfig): WhatsappSender {
  const endpoint = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

  function buildPayload({ to, text, bill }: SendBillInput) {
    if (config.templateName) {
      return {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: config.templateName,
          language: { code: config.templateLanguage },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: bill.customerName },
                { type: "text", text: formatBillNumber(bill.id) },
                { type: "text", text: formatCurrency(bill.total) },
              ],
            },
          ],
        },
      };
    }

    return {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text, preview_url: false },
    };
  }

  return {
    name: "cloud-api",
    async send(input): Promise<SendResult> {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildPayload(input)),
          signal: AbortSignal.timeout(10_000),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: { message?: string };
          } | null;
          return {
            status: "failed",
            error: body?.error?.message ?? `WhatsApp API responded with ${res.status}`,
          };
        }

        return { status: "sent" };
      } catch (error) {
        return {
          status: "failed",
          error: error instanceof Error ? error.message : "Could not reach WhatsApp",
        };
      }
    },
  };
}
