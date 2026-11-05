import { Suspense } from "react";
import Link from "next/link";
import {
  CalendarRangeIcon,
  IndianRupeeIcon,
  PlusIcon,
  ReceiptTextIcon,
  TrendingUpIcon,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard, StatCardSkeleton } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { billsHref, relativeDayLabel } from "@/features/bills/components/bill-day-filter";
import { BillsTable } from "@/features/bills/components/bills-table";
import {
  getTodaySalesSummary,
  getTotalSalesSummary,
  listBillDays,
  listBills,
} from "@/features/bills/queries";
import { formatCurrency, toDayKey } from "@/lib/format";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Today's sales and the season so far"
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
            <CardTitle>Sales by day</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <SalesByDay />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

async function Stats() {
  const [today, total] = await Promise.all([getTodaySalesSummary(), getTotalSalesSummary()]);
  return (
    <>
      <StatCard label="Today's sales" value={formatCurrency(today.revenue)} icon={IndianRupeeIcon} />
      <StatCard label="Bills today" value={String(today.billCount)} icon={ReceiptTextIcon} />
      <StatCard
        label="Season sales"
        value={formatCurrency(total.revenue)}
        hint="All bills so far"
        icon={TrendingUpIcon}
      />
      <StatCard label="Season bills" value={String(total.billCount)} icon={CalendarRangeIcon} />
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

async function SalesByDay() {
  const days = await listBillDays();
  if (days.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No sales yet.</p>;
  }

  const now = new Date();
  const todayKey = toDayKey(now);
  const yesterdayKey = toDayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  return (
    <ul className="divide-y">
      {days.map((d) => (
        <li key={d.day}>
          <Link
            href={billsHref({ day: d.day })}
            className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-muted"
          >
            <div>
              <p className="text-sm font-medium">{relativeDayLabel(d.day, todayKey, yesterdayKey)}</p>
              <p className="text-xs text-muted-foreground">
                {d.billCount} {d.billCount === 1 ? "bill" : "bills"}
              </p>
            </div>
            <span className="font-medium tabular-nums">{formatCurrency(d.revenue)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
