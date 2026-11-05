import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BillForm } from "@/features/bills/components/bill-form";
import { listBillableProducts } from "@/features/products/queries";
import { whatsappMode } from "@/features/whatsapp";

export const metadata: Metadata = { title: "New bill" };

export default function NewBillPage() {
  return (
    <>
      <PageHeader title="New bill" description="Pick items, enter customer details and save." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <NewBill />
      </Suspense>
    </>
  );
}

async function NewBill() {
  const products = await listBillableProducts();

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="mb-4 text-muted-foreground">Add products before billing.</p>
        <Button asChild>
          <Link href="/products">Go to products</Link>
        </Button>
      </div>
    );
  }

  return <BillForm products={products} autoSend={whatsappMode() === "cloud-api"} />;
}
