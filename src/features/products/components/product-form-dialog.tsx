"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Product } from "@/db/schema";
import { saveProduct, type ProductFormState } from "../actions";

export function ProductFormDialog({ product, trigger }: { product?: Product; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Update the name, brand or prices."
              : "Add a cracker item with its price."}
          </DialogDescription>
        </DialogHeader>
        {/* Remount on open so the form starts fresh each time. */}
        {open && <ProductForm product={product} onSaved={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({ product, onSaved }: { product?: Product; onSaved: () => void }) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    saveProduct,
    null,
  );

  // Each result is handled once, even if the parent re-renders after refresh().
  const handled = useRef<ProductFormState>(null);
  useEffect(() => {
    if (!state || handled.current === state) return;
    handled.current = state;
    if (state.ok) {
      toast.success(state.message ?? "Saved");
      onSaved();
    } else if (!state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, onSaved]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="grid gap-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <FormField
        label="Name"
        name="name"
        defaultValue={product?.name}
        placeholder="e.g. Flower Pot (Big)"
        required
        autoFocus
        errors={errors?.name}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Category"
          name="category"
          defaultValue={product?.category ?? ""}
          placeholder="e.g. Ground"
          errors={errors?.category}
        />
        <FormField
          label="Unit"
          name="unit"
          defaultValue={product?.unit ?? "pc"}
          placeholder="pc / box / pkt"
          required
          errors={errors?.unit}
        />
      </div>
      <FormField
        label="Price per piece (₹)"
        name="price"
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        defaultValue={product?.price}
        required
        errors={errors?.price}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Pieces per pack"
          name="packSize"
          type="number"
          inputMode="numeric"
          min={2}
          step={1}
          defaultValue={product?.packSize ?? ""}
          placeholder="e.g. 25"
          hint="Optional. Leave empty if not sold by pack."
          errors={errors?.packSize}
        />
        <FormField
          label="Pack price (₹)"
          name="packPrice"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          defaultValue={product?.packPrice ?? ""}
          placeholder="e.g. 350"
          errors={errors?.packPrice}
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : product ? "Save changes" : "Add product"}
        </Button>
      </DialogFooter>
    </form>
  );
}
