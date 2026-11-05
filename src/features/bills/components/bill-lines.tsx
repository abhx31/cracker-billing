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

/** Pieces each line takes from stock, summed per product. */
export function piecesByProduct(lines: BillLine[]) {
  const pieces = new Map<number, number>();
  for (const line of lines) {
    const { piecesPerUnit } = sellUnit(line.product, line.sellAs);
    pieces.set(line.product.id, (pieces.get(line.product.id) ?? 0) + line.quantity * piecesPerUnit);
  }
  return pieces;
}

/** Most units this line can have, given what other lines of the same product use. */
export function maxQuantity(line: BillLine, lines: BillLine[]) {
  const { piecesPerUnit } = sellUnit(line.product, line.sellAs);
  const usedElsewhere = lines
    .filter((l) => l.product.id === line.product.id && l.sellAs !== line.sellAs)
    .reduce((sum, l) => sum + l.quantity * sellUnit(l.product, l.sellAs).piecesPerUnit, 0);
  return Math.floor((line.product.stock - usedElsewhere) / piecesPerUnit);
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
            const max = maxQuantity(line, lines);
            const over = quantity > max;
            return (
              <TableRow key={key}>
                <TableCell className="whitespace-normal">
                  <p className="font-medium">{product.name}</p>
                  <p className={cn("text-xs", over ? "text-destructive" : "text-muted-foreground")}>
                    {over
                      ? `Only ${Math.max(0, max)} ${sellAs === "pack" ? "pack(s)" : product.unit} available`
                      : `${formatCurrency(unitPrice)} / ${unit} · ${product.stock} ${product.unit} in stock`}
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
                      max={Math.max(1, max)}
                      value={quantity}
                      onChange={(e) =>
                        onQuantityChange(key, Math.max(0, Math.floor(Number(e.target.value) || 0)))
                      }
                      onBlur={() => quantity < 1 && onQuantityChange(key, 1)}
                      aria-invalid={over || undefined}
                      aria-label={`Quantity of ${product.name}`}
                      className="h-7 w-16 text-center tabular-nums"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Increase ${product.name}`}
                      onClick={() => onQuantityChange(key, quantity + 1)}
                      disabled={quantity >= max}
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
