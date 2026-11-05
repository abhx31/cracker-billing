import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BillActions } from "@/features/bills/components/bill-actions";
import { BillReceipt } from "@/features/bills/components/bill-receipt";
import { DeleteBillButton } from "@/features/bills/components/delete-bill-button";
import { WhatsappStatusBadge } from "@/features/bills/components/whatsapp-status-badge";
import { getBill } from "@/features/bills/queries";
import { billPdfPath, billWhatsappShare, whatsappMode } from "@/features/whatsapp";
import { env } from "@/lib/env";
import { formatBillNumber } from "@/lib/format";

export default function BillPage({ params }: PageProps<"/bills/[id]">) {
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 print:hidden">
        <Link href="/bills">
          <ArrowLeftIcon />
          All bills
        </Link>
      </Button>
      <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
        <BillDetail params={params} />
      </Suspense>
    </>
  );
}

async function BillDetail({ params }: Pick<PageProps<"/bills/[id]">, "params">) {
  const { id } = await params;
  const billId = Number(id);
  if (!Number.isInteger(billId) || billId <= 0) notFound();

  const bill = await getBill(billId);
  if (!bill) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={formatBillNumber(bill.id)}
        actions={
          <>
            <DeleteBillButton billId={bill.id} redirectTo="/bills" />
            <BillActions
              billId={bill.id}
              share={billWhatsappShare(bill)}
              mode={whatsappMode()}
              pdfPath={billPdfPath(bill)}
              pdfFileName={`${formatBillNumber(bill.id)}.pdf`}
            />
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm print:hidden">
        <span className="text-muted-foreground">WhatsApp:</span>
        <WhatsappStatusBadge status={bill.whatsappStatus} />
        {bill.whatsappStatus === "failed" && bill.whatsappError && (
          <span className="text-destructive">{bill.whatsappError}</span>
        )}
      </div>
      <BillReceipt bill={bill} shopName={env().SHOP_NAME} />
    </div>
  );
}
