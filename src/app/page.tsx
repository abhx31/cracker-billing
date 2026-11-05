import { Suspense } from "react";
import Link from "next/link";
import { BoxesIcon, IndianRupeeIcon, PlusIcon, ReceiptTextIcon, TriangleAlertIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard, StatCardSkeleton } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BillsTable } from "@/features/bills/components/bills-table";
import { getTodaySalesSummary, listBills } from "@/features/bills/queries";
import { StockBadge } from "@/features/products/components/stock-badge";
import { getStockSummary, listLowStockProducts } from "@/features/products/queries";
import { formatCurrency } from "@/lib/format";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Today's sales and stock at a glance"
        actions={
          <Button asChild size="lg">
            <Link href="/bills/new">
              <PlusIcon />
              New bill
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<StatsSkeleton />}>
          <Stats />
        </Suspense>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Recent bills</CardTitle>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/bills">View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <RecentBills />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/stock">Manage</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <LowStockList />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

async function Stats() {
  const [sales, stock] = await Promise.all([getTodaySalesSummary(), getStockSummary()]);
  return (
    <>
      <StatCard label="Today's sales" value={formatCurrency(sales.revenue)} icon={IndianRupeeIcon} />
      <StatCard label="Bills today" value={String(sales.billCount)} icon={ReceiptTextIcon} />
      <StatCard
        label="Stock on hand"
        value={stock.totalUnits.toLocaleString("en-IN")}
        hint={`${stock.productCount} products · worth ${formatCurrency(stock.stockValue)}`}
        icon={BoxesIcon}
      />
      <StatCard
        label="Low / out of stock"
        value={String(stock.lowStockCount)}
        hint="At or below alert level"
        icon={TriangleAlertIcon}
      />
    </>
  );
}

function StatsSkeleton() {
  return Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />);
}

async function RecentBills() {
  const bills = await listBills({ limit: 6 });
  return <BillsTable bills={bills} compact emptyMessage="No bills yet. Create your first one." />;
}

async function LowStockList() {
  const products = await listLowStockProducts();
  if (products.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">All items are well stocked.</p>;
  }
  return (
    <ul className="divide-y">
      {products.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{p.name}</p>
            <p className="text-xs text-muted-foreground">Alert at {p.lowStockThreshold}</p>
          </div>
          <StockBadge stock={p.stock} lowStockThreshold={p.lowStockThreshold} unit={p.unit} />
        </li>
      ))}
    </ul>
  );
}
