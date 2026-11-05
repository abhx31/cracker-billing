import { Suspense } from "react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { PlusIcon, SearchIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BillDayFilter, billsHref } from "@/features/bills/components/bill-day-filter";
import { BillsByDay } from "@/features/bills/components/bills-by-day";
import { BillsTable } from "@/features/bills/components/bills-table";
import { listBillDays, listBills } from "@/features/bills/queries";
import { DAY_KEY_PATTERN, formatCurrency, formatDayLabel, toDayKey } from "@/lib/format";

export const metadata: Metadata = { title: "Bills" };

// The "all days" view shows the latest bills; picking a day shows all of that day's.
const ALL_DAYS_LIMIT = 300;
const ONE_DAY_LIMIT = 2000;

export default function BillsPage({ searchParams }: PageProps<"/bills">) {
  return (
    <>
      <PageHeader
        title="Bills"
        description="Bills by date, newest first"
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
  const { q, date } = await searchParams;
  const query = typeof q === "string" && q.trim() ? q.trim() : undefined;
  const day = typeof date === "string" && DAY_KEY_PATTERN.test(date) ? date : undefined;

  const [days, bills] = await Promise.all([
    listBillDays(),
    listBills({ query, day, limit: day ? ONE_DAY_LIMIT : ALL_DAYS_LIMIT }),
  ]);

  const now = new Date();
  const todayKey = toDayKey(now);
  const yesterdayKey = toDayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const daySummary = day ? days.find((d) => d.day === day) : undefined;

  return (
    <div className="space-y-4">
      <BillDayFilter
        days={days}
        selected={day}
        query={query}
        todayKey={todayKey}
        yesterdayKey={yesterdayKey}
      />

      <Form action="/bills" className="flex max-w-md gap-2">
        {/* Keep the chosen date while searching. */}
        {day && <input type="hidden" name="date" value={day} />}
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
        {query && (
          <Button asChild variant="ghost">
            <Link href={billsHref({ day })}>Clear</Link>
          </Button>
        )}
      </Form>

      {day ? (
        <section aria-labelledby="day-heading" className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="day-heading" className="font-semibold">
              {formatDayLabel(day)}
            </h2>
            {daySummary && !query && (
              <p className="text-sm text-muted-foreground tabular-nums">
                {daySummary.billCount} {daySummary.billCount === 1 ? "bill" : "bills"} ·{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(daySummary.revenue)}
                </span>
              </p>
            )}
          </div>
          <BillsTable
            bills={bills}
            emptyMessage={query ? `No bills on this day match “${query}”.` : "No bills on this day."}
          />
        </section>
      ) : bills.length === 0 ? (
        <BillsTable bills={[]} emptyMessage={query ? `No bills match “${query}”.` : "No bills yet."} />
      ) : (
        <>
          <BillsByDay
            bills={bills}
            days={query ? undefined : days}
            todayKey={todayKey}
            yesterdayKey={yesterdayKey}
          />
          {bills.length === ALL_DAYS_LIMIT && (
            <p className="text-center text-sm text-muted-foreground">
              Showing the latest {ALL_DAYS_LIMIT} bills. Pick a date above to see every bill for
              that day.
            </p>
          )}
        </>
      )}
    </div>
  );
}
