# Cracker Billing

A simple billing and stock app for a cracker shop. Each bill records the customer name, WhatsApp number, items and who billed it. Bills are shared to the customer on WhatsApp. There is no login.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · shadcn/ui · Drizzle ORM · Neon Postgres

## Setup

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL (and SHOP_NAME)
npm run db:migrate          # create tables
npm run db:seed             # optional: 17 sample cracker products
npm run dev
```

## Pages

| Route         | What it does                                                    |
| ------------- | --------------------------------------------------------------- |
| `/`           | Today's sales, stock on hand, low-stock items, recent bills     |
| `/bills/new`  | Create a bill: customer, items (searchable), discount %, biller |
| `/bills`      | Bill history with search (name, phone, biller, bill no.)        |
| `/bills/[id]` | Printable bill + Send on WhatsApp                               |
| `/stock`      | Add/edit products, add or remove stock, archive items           |

## Bill PDFs

Every bill has a PDF at `/b/<share token>`. The token is a random 32-character code, so links can't be guessed from bill numbers. Deleted bills return 404.

- **WhatsApp message.** When the app is deployed, the message carries the shop name, bill number, total and the PDF link. The customer taps it to view or download the bill. Locally, with no public URL, the message lists every item instead.
- **Bill page.** On phones, **Share PDF** sends the actual file through the share menu (WhatsApp → customer). On computers, **Download PDF** saves it so you can drag it into WhatsApp Web.
- **Public URL.** On Vercel it's detected automatically (`VERCEL_PROJECT_PRODUCTION_URL`). Anywhere else, set `APP_URL`.
- PDFs are built with `@react-pdf/renderer` using the bundled Noto Sans fonts (`src/features/bills/pdf/`), which include the ₹ symbol.

## Deploying (Vercel)

1. Push the repo to GitHub and import it in Vercel.
2. Add the env vars `DATABASE_URL` and `SHOP_NAME`, plus `WHATSAPP_DEFAULT_COUNTRY_CODE` if it isn't 91.
3. Deploy. Migrations are already applied to Neon. Run `npm run db:migrate` locally after any schema change.

## WhatsApp

There are two modes. The app picks one automatically from `.env`:

- **Link mode (default, free, no setup).** **Save & open WhatsApp** saves the bill and immediately opens the customer's chat with the full bill typed in. The biller just presses send. Messages go from whichever WhatsApp is logged in: the WhatsApp app on a phone, or WhatsApp Web on a computer, which reuses a single tab. If pop-ups are blocked, use **Send on WhatsApp** on the bill page.
- **Cloud API mode (automatic).** Set `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` from a [Meta WhatsApp Business](https://developers.facebook.com/docs/whatsapp/cloud-api) app. Bills are then sent as soon as they are saved. WhatsApp only delivers free-form text to customers who messaged you in the last 24h. To reach anyone, create an approved template with three body variables (customer name, bill no., total) and set `WHATSAPP_TEMPLATE_NAME`.

Each bill tracks its WhatsApp status: Not sent / Shared / Sent / Failed.

## Project structure

```
src/
  app/                      routes only (thin pages; data loads inside <Suspense>)
  components/               app-wide UI (header, page header, form field, stat card)
    ui/                     shadcn/ui components
  db/
    schema/                 Drizzle tables: products, bills, bill_items
    index.ts                Neon pool + Drizzle client (lazy)
  features/
    products/               stock: schemas, queries, server actions, components
    bills/                  billing: calc, schemas, service (transaction), queries, actions, components
    whatsapp/               message builder, phone normalizing, providers (Cloud API)
  lib/                      env validation, formatting, action result helpers
scripts/seed.ts             sample data
drizzle/                    generated SQL migrations
```

How the parts fit together:

- **Queries** (`queries.ts`) are server-only reads. They call `connection()` so stock and sales are always live.
- **Actions** (`actions.ts`) are Server Actions. They validate input with Zod and return `{ ok, data | error }`.
- **Bill creation** (`features/bills/service.ts`) runs in a single transaction. It locks the product rows (`SELECT … FOR UPDATE`), checks stock, saves the bill and its items, and deducts stock. Two billers can't sell the last box twice, and prices always come from the database. A database `CHECK (stock >= 0)` is the final safeguard.
- **WhatsApp** is behind a small `WhatsappSender` interface (`features/whatsapp/providers`). Adding another provider (e.g. Twilio, Gupshup) means adding one file.

## Scripts

| Script                | Purpose                                      |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | Dev server                                   |
| `npm run build`       | Production build                             |
| `npm run typecheck`   | Generate route types + `tsc`                 |
| `npm run db:generate` | Create a migration after editing the schema  |
| `npm run db:migrate`  | Apply migrations                             |
| `npm run db:studio`   | Browse data in Drizzle Studio                |
| `npm run db:seed`     | Insert sample products (skips existing ones) |

## Notes

- There is no auth by design. Anyone who can open the URL can bill. Deploy it privately or put it behind your host's password protection (e.g. Vercel Deployment Protection) if it's on the public internet.
- The biller's name is remembered per device (localStorage), so they don't retype it.
- Deleting a bill (bill page or the trash icon in the list) asks for confirmation, then puts its items back into stock. A WhatsApp message already sent can't be recalled.
- Dark mode: use the sun/moon button in the header. It follows the device setting until you pick one. The choice is saved per device, and bills always print in light mode.
- Times are shown in IST (`TIME_ZONE` in `src/lib/format.ts`). "Today's sales" uses the IST day.
