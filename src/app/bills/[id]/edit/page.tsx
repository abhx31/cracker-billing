import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, TriangleAlertIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BillForm } from "@/features/bills/components/bill-form";
import type { BillLine } from "@/features/bills/components/bill-lines";
import { getBill } from "@/features/bills/queries";
import { hasPack } from "@/features/products/pack";
import { listBillableProducts } from "@/features/products/queries";
import { whatsappMode } from "@/features/whatsapp";
import { formatBillNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Edit bill" };

export default function EditBillPage({ params }: PageProps<"/bills/[id]/edit">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <EditBill params={params} />
    </Suspense>
  );
}

async function EditBill({ params }: Pick<PageProps<"/bills/[id]/edit">, "params">) {
  const { id } = await params;
  const billId = Number(id);
  if (!Number.isInteger(billId) || billId <= 0) notFound();

  const [bill, products] = await Promise.all([getBill(billId), listBillableProducts()]);
  if (!bill) notFound();

  // Rebuild form lines from the saved items. Items whose product was removed
  // or archived can't be re-priced, so they're listed and left out.
  const productsById = new Map(products.map((p) => [p.id, p]));
  const lines: BillLine[] = [];
  const unavailable: string[] = [];
  for (const item of bill.items) {
    const product = item.productId === null ? undefined : productsById.get(item.productId);
    if (!product) {
      unavailable.push(item.productName);
      continue;
    }
    const sellAs = item.piecesPerUnit > 1 && hasPack(product) ? "pack" : "piece";
    lines.push({ product, sellAs, quantity: item.quantity });
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href={`/bills/${bill.id}`}>
          <ArrowLeftIcon />
          Back to bill
        </Link>
      </Button>
      <PageHeader
        title={`Edit ${formatBillNumber(bill.id)}`}
        description="Prices are taken from the current product list when you save."
      />
      {unavailable.length > 0 && (
        <div className="mb-6 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            These items are no longer in the product list and will be removed when you save:{" "}
            <strong>{unavailable.join(", ")}</strong>
          </p>
        </div>
      )}
      <BillForm
        products={products}
        autoSend={whatsappMode() === "cloud-api"}
        editing={{
          billId: bill.id,
          customerName: bill.customerName,
          customerPhone: `+${bill.customerPhone}`,
          billedBy: bill.billedBy,
          discountPercent: bill.discountPercent,
          lines,
        }}
      />
    </>
  );
}
