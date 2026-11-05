"use client";

import { useState, useTransition, type ReactNode } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Product } from "@/db/schema";
import { adjustStock } from "../actions";

type Mode = "add" | "remove";

export function StockAdjustDialog({ product, trigger }: { product: Product; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [quantity, setQuantity] = useState("");
  const [pending, startTransition] = useTransition();

  const qty = Number(quantity);
  const valid = Number.isInteger(qty) && qty > 0 && (mode === "add" || qty <= product.stock);
  const preview = valid ? product.stock + (mode === "add" ? qty : -qty) : product.stock;

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setMode("add");
      setQuantity("");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    startTransition(async () => {
      const result = await adjustStock({
        productId: product.id,
        delta: mode === "add" ? qty : -qty,
      });
      if (result.ok) {
        toast.success(`${product.name}: ${result.message}`);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {product.name} · currently {product.stock} {product.unit}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            {(["add", "remove"] as const).map((m) => (
              <Button
                key={m}
                type="button"
                variant={mode === m ? "default" : "outline"}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
              >
                {m === "add" ? <PlusIcon /> : <MinusIcon />}
                {m === "add" ? "Add stock" : "Remove"}
              </Button>
            ))}
          </div>
          <FormField
            label={mode === "add" ? "Quantity received" : "Quantity to remove"}
            name="quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={mode === "remove" ? product.stock : undefined}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            autoFocus
            required
            errors={
              mode === "remove" && qty > product.stock
                ? [`Only ${product.stock} in stock`]
                : undefined
            }
          />
          <p className="text-sm text-muted-foreground">
            New stock:{" "}
            <span className={cn("font-semibold text-foreground", preview <= 0 && "text-destructive")}>
              {preview} {product.unit}
            </span>
          </p>
          <DialogFooter>
            <Button type="submit" disabled={!valid || pending}>
              {pending ? "Saving…" : "Update stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
