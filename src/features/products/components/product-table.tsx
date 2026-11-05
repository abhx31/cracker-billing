"use client";

import { useMemo, useState, useTransition } from "react";
import { ArchiveIcon, ArchiveRestoreIcon, PackagePlusIcon, PencilIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import type { Product } from "@/db/schema";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { setProductActive } from "../actions";
import { hasPack } from "../pack";
import { ProductFormDialog } from "./product-form-dialog";
import { StockAdjustDialog } from "./stock-adjust-dialog";
import { StockBadge } from "./stock-badge";

export function ProductTable({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (showArchived || p.isActive) &&
        (!q || p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)),
    );
  }, [products, query, showArchived]);

  const archivedCount = products.filter((p) => !p.isActive).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or category"
            className="pl-8"
            aria-label="Search products"
          />
        </div>
        {archivedCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Hide archived" : `Show archived (${archivedCount})`}
          </Button>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {products.length === 0 ? "No products yet. Add your first item." : "No matches."}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((p) => (
                <TableRow key={p.id} className={cn(!p.isActive && "opacity-60")}>
                  <TableCell className="font-medium">
                    {p.name}
                    <span className="ml-1 text-xs text-muted-foreground">/ {p.unit}</span>
                    {!p.isActive && (
                      <Badge variant="outline" className="ml-2">
                        Archived
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {p.category ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(p.price)}
                    {hasPack(p) && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(p.packPrice)} / {p.packSize} pcs
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <StockBadge stock={p.stock} lowStockThreshold={p.lowStockThreshold} />
                  </TableCell>
                  <TableCell>
                    <ProductRowActions product={p} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ProductRowActions({ product }: { product: Product }) {
  const [pending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      const result = await setProductActive({ productId: product.id, isActive: !product.isActive });
      if (result.ok) toast.success(`${product.name}: ${result.message}`);
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex justify-end gap-1">
      {product.isActive && (
        <StockAdjustDialog
          product={product}
          trigger={
            <Button variant="outline" size="sm">
              <PackagePlusIcon />
              <span className="hidden md:inline">Stock</span>
            </Button>
          }
        />
      )}
      <ProductFormDialog
        product={product}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${product.name}`}>
            <PencilIcon />
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggleActive}
        disabled={pending}
        aria-label={product.isActive ? `Archive ${product.name}` : `Restore ${product.name}`}
        title={product.isActive ? "Archive (hide from billing)" : "Restore"}
      >
        {product.isActive ? <ArchiveIcon /> : <ArchiveRestoreIcon />}
      </Button>
    </div>
  );
}
