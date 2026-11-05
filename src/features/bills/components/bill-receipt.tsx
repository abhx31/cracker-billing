import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BillWithItems } from "@/db/schema";
import { formatBillNumber, formatCurrency, formatDateTime } from "@/lib/format";

/** Printable bill. Server component: no interactivity. */
export function BillReceipt({ bill, shopName }: { bill: BillWithItems; shopName: string }) {
  return (
    <article className="rounded-xl border bg-card p-6 print:border-0 print:p-0">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{shopName}</h2>
          <p className="text-sm text-muted-foreground">Bill</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">{formatBillNumber(bill.id)}</p>
          <p className="text-muted-foreground">{formatDateTime(bill.createdAt)}</p>
        </div>
      </header>

      <dl className="mb-6 grid gap-1 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Customer</dt>
          <dd className="font-medium">{bill.customerName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">WhatsApp</dt>
          <dd className="font-medium">+{bill.customerPhone}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Billed by</dt>
          <dd className="font-medium">{bill.billedBy}</dd>
        </div>
      </dl>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bill.items.map((item, i) => (
            <TableRow key={item.id}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-medium whitespace-normal">{item.productName}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(item.unitPrice)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {item.quantity} {item.unit}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(item.lineTotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="text-right font-normal text-muted-foreground">
              Subtotal
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(bill.subtotal)}</TableCell>
          </TableRow>
          {bill.discountAmount > 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-right font-normal text-muted-foreground">
                Discount ({bill.discountPercent}%)
              </TableCell>
              <TableCell className="text-right tabular-nums">
                −{formatCurrency(bill.discountAmount)}
              </TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell colSpan={4} className="text-right text-base font-semibold">
              Total
            </TableCell>
            <TableCell className="text-right text-base font-semibold tabular-nums">
              {formatCurrency(bill.total)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Thank you for your purchase! Celebrate safely.
      </p>
    </article>
  );
}
