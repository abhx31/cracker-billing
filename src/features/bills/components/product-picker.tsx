"use client";

import { useState } from "react";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { hasPack } from "@/features/products/pack";
import type { BillableProduct } from "@/features/products/queries";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductPicker({
  products,
  inBill,
  onPick,
}: {
  products: BillableProduct[];
  /** Quantity already on the bill per product id, to show what's left. */
  inBill: Map<number, number>;
  onPick: (product: BillableProduct) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 w-full justify-between font-normal text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <PlusIcon />
            Add item — search by name or category
          </span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search crackers…" />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => {
                const left = product.stock - (inBill.get(product.id) ?? 0);
                return (
                  <CommandItem
                    key={product.id}
                    value={`${product.name} ${product.id}`}
                    keywords={product.category ? [product.category] : undefined}
                    disabled={left <= 0}
                    onSelect={() => {
                      onPick(product);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.category ? `${product.category} · ` : ""}
                        {formatCurrency(product.price)} / {product.unit}
                        {hasPack(product) &&
                          ` · ${formatCurrency(product.packPrice)} / pack of ${product.packSize}`}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-xs tabular-nums",
                        left <= 0 ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {left <= 0 ? "No stock" : `${left} left`}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
