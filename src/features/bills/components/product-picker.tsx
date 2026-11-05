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

/**
 * Every typed word must appear in the name or brand ("bird" finds BIRD OTH,
 * not FP BIG). cmdk's default fuzzy match is too loose for short names.
 * Names that start with the search rank first.
 */
function matchProduct(value: string, search: string, keywords?: string[]) {
  const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 1;
  const name = value.toLowerCase();
  const haystack = [name, ...(keywords ?? []).map((k) => k.toLowerCase())].join(" ");
  if (!terms.every((term) => haystack.includes(term))) return 0;
  return name.startsWith(terms[0]) ? 1 : 0.5;
}

export function ProductPicker({
  products,
  onPick,
}: {
  products: BillableProduct[];
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
        <Command filter={matchProduct}>
          <CommandInput placeholder="Search crackers…" />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  keywords={product.category ? [product.category] : undefined}
                  onSelect={() => {
                    onPick(product);
                    setOpen(false);
                  }}
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
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
