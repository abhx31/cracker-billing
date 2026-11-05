import { formatCurrency, formatDayLabel, toDayKey } from "@/lib/format";
import type { BillDay, BillListRow } from "../queries";
import { BillsTable } from "./bills-table";

/** Bills split into one section per day, each with that day's totals. */
export function BillsByDay({
  bills,
  days,
  todayKey,
  yesterdayKey,
}: {
  bills: BillListRow[];
  /**
   * Full-day totals, so a day cut off by the list limit still shows its real
   * total. Omit when the list is filtered (search) to total only what's shown.
   */
  days?: BillDay[];
  todayKey: string;
  yesterdayKey: string;
}) {
  const groups = new Map<string, BillListRow[]>();
  for (const bill of bills) {
    const key = toDayKey(bill.createdAt);
    groups.set(key, [...(groups.get(key) ?? []), bill]);
  }
  const totals = new Map(days?.map((d) => [d.day, d]));

  return (
    <div className="space-y-6">
      {[...groups].map(([day, dayBills]) => {
        const summary = totals.get(day) ?? {
          billCount: dayBills.length,
          revenue: dayBills.reduce((sum, b) => sum + b.total, 0),
        };
        const prefix = day === todayKey ? "Today · " : day === yesterdayKey ? "Yesterday · " : "";
        return (
          <section key={day} aria-labelledby={`day-${day}`} className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id={`day-${day}`} className="font-semibold">
                {prefix}
                {formatDayLabel(day)}
              </h2>
              <p className="text-sm text-muted-foreground tabular-nums">
                {summary.billCount} {summary.billCount === 1 ? "bill" : "bills"} ·{" "}
                <span className="font-medium text-foreground">{formatCurrency(summary.revenue)}</span>
              </p>
            </div>
            <BillsTable bills={dayBills} />
          </section>
        );
      })}
    </div>
  );
}
