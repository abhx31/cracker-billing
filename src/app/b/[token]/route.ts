import { renderBillPdf } from "@/features/bills/pdf/render";
import { getBillByShareToken } from "@/features/bills/queries";
import { env } from "@/lib/env";
import { formatBillNumber } from "@/lib/format";

// Public, no-auth link sent to customers on WhatsApp: /b/<share token>.
// Short path keeps the WhatsApp message tidy.
export async function GET(_request: Request, { params }: RouteContext<"/b/[token]">) {
  const { token } = await params;
  if (!/^[0-9a-f]{32}$/.test(token)) return notFound();

  const bill = await getBillByShareToken(token);
  if (!bill) return notFound();

  const pdf = await renderBillPdf(bill, env().SHOP_NAME);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${formatBillNumber(bill.id)}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

function notFound() {
  return new Response("Bill not found. It may have been deleted.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
