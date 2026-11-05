import "server-only";
import { z } from "zod";

// `KEY=""` in .env means "not set", not "set to an empty string".
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

const withDefault = (schema: z.ZodString, fallback: string) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.default(fallback));

const envSchema = z.object({
  DATABASE_URL: z.url("DATABASE_URL must be your Neon connection string"),

  // Used when a customer number is typed without a country code, e.g. "91".
  WHATSAPP_DEFAULT_COUNTRY_CODE: withDefault(
    z.string().regex(/^\d{1,4}$/, "WHATSAPP_DEFAULT_COUNTRY_CODE must be a country code like 91"),
    "91",
  ),

  // Optional: Meta WhatsApp Cloud API. When both are set, bills are sent
  // automatically; otherwise the app falls back to a click-to-send wa.me link.
  WHATSAPP_ACCESS_TOKEN: optional(z.string()),
  WHATSAPP_PHONE_NUMBER_ID: optional(z.string()),
  // Optional approved template name. Needed to message customers who have not
  // messaged your business in the last 24 hours.
  WHATSAPP_TEMPLATE_NAME: optional(z.string()),
  WHATSAPP_TEMPLATE_LANGUAGE: withDefault(z.string(), "en"),
  WHATSAPP_API_VERSION: withDefault(z.string(), "v21.0"),

  SHOP_NAME: withDefault(z.string(), "Cracker Shop"),

  // Public address of the deployed app, used in the bill PDF link sent to
  // customers. On Vercel it falls back to the production domain automatically.
  APP_URL: optional(z.url("APP_URL must be a full URL like https://bills.example.com")),
  VERCEL_PROJECT_PRODUCTION_URL: optional(z.string()),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function env(): Env {
  cached ??= envSchema.parse(process.env);
  return cached;
}

/** Base URL customers can open, or null when running only on this computer. */
export function publicAppUrl(): string | null {
  const e = env();
  if (e.APP_URL) return e.APP_URL.replace(/\/+$/, "");
  if (e.VERCEL_PROJECT_PRODUCTION_URL) return `https://${e.VERCEL_PROJECT_PRODUCTION_URL}`;
  return null;
}
