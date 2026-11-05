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
import type { BillableProduct } from "@/features/products/queries";
import { formatCurrency } from "@/lib/format";

export type BillLine = { product: BillableProduct; quantity: number };

export function BillLines({
  lines,
  onQuantityChange,
  onRemove,
}: {
  lines: BillLine[];
  onQuantityChange: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
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
            <TableHead className="hidden text-right sm:table-cell">Rate</TableHead>
            <TableHead className="text-center">Qty</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map(({ product, quantity }) => {
            const over = quantity > product.stock;
            return (
              <TableRow key={product.id}>
                <TableCell>
                  <p className="font-medium">{product.name}</p>
                  <p className={over ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                    {over
                      ? `Only ${product.stock} ${product.unit} in stock`
                      : `${formatCurrency(product.price)} / ${product.unit} · ${product.stock} in stock`}
                  </p>
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">
                  {formatCurrency(product.price)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Decrease ${product.name}`}
                      onClick={() => onQuantityChange(product.id, quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <MinusIcon />
                    </Button>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={product.stock}
                      value={quantity}
                      onChange={(e) =>
                        onQuantityChange(product.id, Math.max(0, Math.floor(Number(e.target.value) || 0)))
                      }
                      onBlur={() => quantity < 1 && onQuantityChange(product.id, 1)}
                      aria-invalid={over || undefined}
                      aria-label={`Quantity of ${product.name}`}
                      className="h-7 w-16 text-center tabular-nums"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Increase ${product.name}`}
                      onClick={() => onQuantityChange(product.id, quantity + 1)}
                      disabled={quantity >= product.stock}
                    >
                      <PlusIcon />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(product.price * quantity)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${product.name}`}
                    onClick={() => onRemove(product.id)}
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
