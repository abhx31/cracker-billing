"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SendIcon } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { FieldErrors } from "@/lib/action-result";
import { formatCurrency } from "@/lib/format";
import type { BillableProduct } from "@/features/products/queries";
import { openPendingTab } from "@/features/whatsapp/links";
import { createBill, markBillShared } from "../actions";
import { computeTotals } from "../calc";
import { BillLines, type BillLine } from "./bill-lines";
import { ProductPicker } from "./product-picker";

// No auth: remember who is billing on this device so they don't retype it.
const BILLER_KEY = "cracker-billing:billed-by";

function readStoredBiller() {
  try {
    return localStorage.getItem(BILLER_KEY) ?? "";
  } catch {
    return "";
  }
}

function storeBiller(name: string) {
  try {
    localStorage.setItem(BILLER_KEY, name);
  } catch {
    // Storage unavailable (private mode); nothing to do.
  }
}

export function BillForm({
  products,
  autoSend,
}: {
  products: BillableProduct[];
  /** True when WhatsApp Cloud API is configured and bills go out on save. */
  autoSend: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [billedBy, setBilledBy] = useState("");
  const [discount, setDiscount] = useState("");
  const [lines, setLines] = useState<BillLine[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const stored = readStoredBiller();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only
    if (stored) setBilledBy(stored);
  }, []);

  // Keep line products in sync with fresh stock/prices after a refresh.
  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const currentLines = useMemo(
    () =>
      lines
        .map((l) => ({ ...l, product: productsById.get(l.product.id) ?? l.product }))
        .filter((l) => productsById.has(l.product.id)),
    [lines, productsById],
  );

  const inBill = useMemo(
    () => new Map(currentLines.map((l) => [l.product.id, l.quantity])),
    [currentLines],
  );

  const discountPercent = Math.min(100, Math.max(0, Number(discount) || 0));
  const totals = computeTotals(
    currentLines.map((l) => ({ unitPrice: l.product.price, quantity: l.quantity })),
    discountPercent,
  );
  const overStock = currentLines.some((l) => l.quantity > l.product.stock);

  function addProduct(product: BillableProduct) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id
            ? { ...l, quantity: Math.min(product.stock, l.quantity + 1) }
            : l,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setErrors((e) => ({ ...e, items: undefined }));
  }

  function setQuantity(productId: number, quantity: number) {
    setLines((prev) => prev.map((l) => (l.product.id === productId ? { ...l, quantity } : l)));
  }

  function removeLine(productId: number) {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function reset() {
    setCustomerName("");
    setCustomerPhone("");
    setDiscount("");
    setLines([]);
    setErrors({});
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (currentLines.length === 0) {
      setErrors({ items: ["Add at least one item"] });
      toast.error("Add at least one item");
      return;
    }
    if (overStock) {
      toast.error("Some items exceed available stock");
      return;
    }

    // Must open synchronously in the submit handler or the browser blocks it.
    const whatsappTab = autoSend ? null : openPendingTab();

    startTransition(async () => {
      const result = await createBill({
        customerName,
        customerPhone,
        billedBy,
        discountPercent,
        items: currentLines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      });

      if (!result.ok) {
        whatsappTab?.close();
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }

      storeBiller(billedBy.trim());
      const { id, whatsapp } = result.data;
      if (whatsapp.mode === "cloud-api") {
        if (whatsapp.sent) toast.success("Bill saved and sent on WhatsApp");
        else toast.warning(`Bill saved, but WhatsApp failed: ${whatsapp.error}`);
      } else if (whatsapp.share && whatsappTab?.sendTo(whatsapp.share)) {
        void markBillShared(id);
        toast.success("Bill saved. WhatsApp is open — just press send.");
      } else {
        whatsappTab?.close();
        toast.success("Bill saved. Tap “Send on WhatsApp” to share it.");
      }
      reset();
      router.push(`/bills/${id}`);
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Customer name"
              name="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ravi Kumar"
              autoComplete="off"
              required
              errors={errors.customerName}
            />
            <FormField
              label="WhatsApp number"
              name="customerPhone"
              type="tel"
              inputMode="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="98765 43210"
              autoComplete="off"
              required
              hint="10-digit numbers get the default country code."
              errors={errors.customerPhone}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProductPicker products={products} inBill={inBill} onPick={addProduct} />
            {errors.items && <p className="text-sm text-destructive">{errors.items[0]}</p>}
            <BillLines lines={currentLines} onQuantityChange={setQuantity} onRemove={removeLine} />
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            label="Discount (%)"
            name="discountPercent"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0"
            errors={errors.discountPercent}
          />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatCurrency(totals.subtotal)}</dd>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount ({discountPercent}%)</dt>
                <dd className="tabular-nums">−{formatCurrency(totals.discountAmount)}</dd>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCurrency(totals.total)}</dd>
            </div>
          </dl>
          <FormField
            label="Billed by"
            name="billedBy"
            value={billedBy}
            onChange={(e) => setBilledBy(e.target.value)}
            placeholder="Your name"
            autoComplete="off"
            required
            errors={errors.billedBy}
          />
          <Button type="submit" size="lg" className="w-full" disabled={pending || overStock}>
            <SendIcon />
            {pending ? "Saving…" : autoSend ? "Save & send on WhatsApp" : "Save & open WhatsApp"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
