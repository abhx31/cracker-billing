import { Suspense } from "react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { PlusIcon, SearchIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BillsTable } from "@/features/bills/components/bills-table";
import { listBills } from "@/features/bills/queries";

export const metadata: Metadata = { title: "Bills" };

export default function BillsPage({ searchParams }: PageProps<"/bills">) {
  return (
    <>
      <PageHeader
        title="Bills"
        description="Every bill, newest first"
        actions={
          <Button asChild>
            <Link href="/bills/new">
              <PlusIcon />
              New bill
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <BillsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function BillsList({ searchParams }: Pick<PageProps<"/bills">, "searchParams">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : undefined;
  const bills = await listBills({ query, limit: 100 });

  return (
    <div className="space-y-3">
      <Form action="/bills" className="flex max-w-md gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Name, phone, biller or bill no."
            className="pl-8"
            aria-label="Search bills"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </Form>
      <BillsTable
        bills={bills}
        emptyMessage={query ? `No bills match “${query}”.` : "No bills yet."}
      />
    </div>
  );
}
