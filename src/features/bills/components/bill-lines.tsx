"use client";

import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { hasPack, sellUnit, type SellAs } from "@/features/products/pack";
import type { BillableProduct } from "@/features/products/queries";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export type BillLine = { product: BillableProduct; sellAs: SellAs; quantity: number };

export function lineKey(line: Pick<BillLine, "sellAs"> & { product: { id: number } }) {
  return `${line.product.id}:${line.sellAs}`;
}

export function BillLines({
  lines,
  onQuantityChange,
  onSellAsChange,
  onRemove,
}: {
  lines: BillLine[];
  onQuantityChange: (key: string, quantity: number) => void;
  onSellAsChange: (key: string, sellAs: SellAs) => void;
  onRemove: (key: string) => void;
}) {
  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No items yet. Use “Add item” above to start the bill.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-center">Qty</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => {
            const { product, quantity, sellAs } = line;
            const key = lineKey(line);
            const { unitPrice, unit } = sellUnit(product, sellAs);
            return (
              <TableRow key={key}>
                <TableCell className="whitespace-normal">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(unitPrice)} / {unit}
                  </p>
                  {hasPack(product) && (
                    <div
                      role="radiogroup"
                      aria-label={`Sell ${product.name} as`}
                      className="mt-1.5 inline-flex rounded-md border p-0.5"
                    >
                      {(["piece", "pack"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          role="radio"
                          aria-checked={sellAs === mode}
                          onClick={() => sellAs !== mode && onSellAsChange(key, mode)}
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                            sellAs === mode
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {mode === "piece"
                            ? `Piece ${formatCurrency(product.price)}`
                            : `Pack of ${product.packSize} ${formatCurrency(product.packPrice)}`}
                        </button>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Decrease ${product.name}`}
                      onClick={() => onQuantityChange(key, quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <MinusIcon />
                    </Button>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={quantity}
                      onChange={(e) =>
                        onQuantityChange(key, Math.max(0, Math.floor(Number(e.target.value) || 0)))
                      }
                      onBlur={() => quantity < 1 && onQuantityChange(key, 1)}
                      aria-label={`Quantity of ${product.name}`}
                      className="h-7 w-16 text-center tabular-nums"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Increase ${product.name}`}
                      onClick={() => onQuantityChange(key, quantity + 1)}
                    >
                      <PlusIcon />
                    </Button>
                  </div>
                  {sellAs === "pack" && (
                    <p className="mt-1 text-center text-xs text-muted-foreground">
                      {quantity * (product.packSize ?? 1)} pcs
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(unitPrice * quantity)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${product.name}`}
                    onClick={() => onRemove(key)}
                  >
                    <Trash2Icon />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
