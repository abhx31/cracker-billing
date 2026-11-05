"use client";

import { useState } from "react";
import { MinusIcon, PackageIcon, PlusIcon, SparkleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasPack, sellUnit, type SellAs } from "@/features/products/pack";
import type { BillableProduct } from "@/features/products/queries";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * After picking a cracker: choose single piece or pack, then how many.
 * Rendered only while a product is picked, so its state starts fresh each time.
 */
export function AddItemDialog({
  product,
  onAdd,
  onClose,
}: {
  product: BillableProduct;
  onAdd: (sellAs: SellAs, quantity: number) => void;
  onClose: () => void;
}) {
  const [sellAs, setSellAs] = useState<SellAs>("piece");
  const [quantityText, setQuantityText] = useState("1");

  const { unitPrice, piecesPerUnit } = sellUnit(product, sellAs);
  const quantity = Math.floor(Number(quantityText) || 0);
  const valid = quantity >= 1;

  function setQuantity(next: number) {
    setQuantityText(String(Math.max(1, next)));
  }

  function choose(mode: SellAs) {
    setSellAs(mode);
    setQuantityText("1");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (valid) onAdd(sellAs, quantity);
  }

  const options: { mode: SellAs; title: string; price: string; icon: typeof SparkleIcon }[] = [
    {
      mode: "piece",
      title: "Single piece",
      price: `${formatCurrency(product.price)} each`,
      icon: SparkleIcon,
    },
  ];
  if (hasPack(product)) {
    options.push({
      mode: "pack",
      title: `Pack of ${product.packSize}`,
      price: `${formatCurrency(product.packPrice)} per pack`,
      icon: PackageIcon,
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          {product.category && <DialogDescription>{product.category}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-5">
          <div role="radiogroup" aria-label="Sell as" className="grid grid-cols-2 gap-3">
            {options.map(({ mode, title, price, icon: Icon }) => {
              const selected = sellAs === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(mode)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                    selected ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:bg-muted",
                    options.length === 1 && "col-span-2",
                  )}
                >
                  <Icon className={cn("size-5", selected ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-medium">{title}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">{price}</span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="add-item-quantity">
              How many {sellAs === "pack" ? "packs" : "pieces"}?
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                aria-label="Decrease"
                onClick={() => setQuantity(quantity - 1)}
                disabled={quantity <= 1}
              >
                <MinusIcon />
              </Button>
              <Input
                id="add-item-quantity"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={quantityText}
                onChange={(e) => setQuantityText(e.target.value)}
                onFocus={(e) => e.target.select()}
                autoFocus
                aria-invalid={!valid || undefined}
                className="h-9 w-24 text-center text-base tabular-nums"
              />
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                aria-label="Increase"
                onClick={() => setQuantity(quantity + 1)}
              >
                <PlusIcon />
              </Button>
            </div>
            {sellAs === "pack" && valid && (
              <p className="text-xs text-muted-foreground">{quantity * piecesPerUnit} pieces</p>
            )}
          </div>

          <DialogFooter className="items-center sm:justify-between">
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrency(valid ? unitPrice * quantity : 0)}
            </p>
            <Button type="submit" size="lg" disabled={!valid}>
              Add to bill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
