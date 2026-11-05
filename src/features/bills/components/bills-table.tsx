import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBillNumber, formatCurrency, formatDateTime } from "@/lib/format";
import type { BillListRow } from "../queries";
import { DeleteBillButton } from "./delete-bill-button";
import { WhatsappStatusBadge } from "./whatsapp-status-badge";

export function BillsTable({
  bills,
  emptyMessage = "No bills yet.",
  compact = false,
}: {
  bills: BillListRow[];
  emptyMessage?: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bill</TableHead>
            <TableHead>Customer</TableHead>
            {!compact && <TableHead className="hidden md:table-cell">Billed by</TableHead>}
            <TableHead className="hidden sm:table-cell">WhatsApp</TableHead>
            <TableHead className="text-right">Total</TableHead>
            {!compact && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.length === 0 ? (
            <TableRow>
              <TableCell colSpan={compact ? 4 : 6} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            bills.map((bill) => (
              <TableRow key={bill.id} className="relative">
                <TableCell>
                  {/* Stretched link makes the whole row clickable. */}
                  <Link
                    href={`/bills/${bill.id}`}
                    className="font-medium after:absolute after:inset-0 hover:underline"
                  >
                    {formatBillNumber(bill.id)}
                  </Link>
                  <p className="text-xs text-muted-foreground">{formatDateTime(bill.createdAt)}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{bill.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    +{bill.customerPhone} · {bill.itemCount} items
                  </p>
                </TableCell>
                {!compact && (
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {bill.billedBy}
                  </TableCell>
                )}
                <TableCell className="hidden sm:table-cell">
                  <WhatsappStatusBadge status={bill.whatsappStatus} />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(bill.total)}
                </TableCell>
                {!compact && (
                  <TableCell>
                    {/* Above the stretched row link so clicking it doesn't open the bill. */}
                    <DeleteBillButton billId={bill.id} iconOnly className="relative z-10" />
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
