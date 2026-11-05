import Link from "next/link";
import { formatCurrency, formatDayLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BillDay } from "../queries";

export function billsHref({ day, query }: { day?: string; query?: string }) {
  const params = new URLSearchParams();
  if (day) params.set("date", day);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/bills?${search}` : "/bills";
}

/** "Today" / "Yesterday" / "Thu, 5 Nov" */
export function relativeDayLabel(day: string, todayKey: string, yesterdayKey: string) {
  if (day === todayKey) return "Today";
  if (day === yesterdayKey) return "Yesterday";
  return formatDayLabel(day, { short: true });
}

const chipClass =
  "flex shrink-0 flex-col rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted";
const activeClass = "border-primary bg-primary/10 hover:bg-primary/15";

export function BillDayFilter({
  days,
  selected,
  query,
  todayKey,
  yesterdayKey,
}: {
  days: BillDay[];
  selected?: string;
  query?: string;
  todayKey: string;
  yesterdayKey: string;
}) {
  if (days.length === 0) return null;

  const totalBills = days.reduce((sum, d) => sum + d.billCount, 0);
  const totalRevenue = days.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <nav aria-label="Filter bills by date" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <Link
        href={billsHref({ query })}
        aria-current={!selected ? "page" : undefined}
        className={cn(chipClass, !selected && activeClass)}
      >
        <span className="text-sm font-medium">All days</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {totalBills} bills · {formatCurrency(totalRevenue)}
        </span>
      </Link>
      {days.map((d) => (
        <Link
          key={d.day}
          href={billsHref({ day: d.day, query })}
          aria-current={selected === d.day ? "page" : undefined}
          className={cn(chipClass, selected === d.day && activeClass)}
        >
          <span className="text-sm font-medium">
            {relativeDayLabel(d.day, todayKey, yesterdayKey)}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {d.billCount} {d.billCount === 1 ? "bill" : "bills"} · {formatCurrency(d.revenue)}
          </span>
        </Link>
      ))}
    </nav>
  );
}
