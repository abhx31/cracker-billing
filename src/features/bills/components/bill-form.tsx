"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SaveIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { FieldErrors } from "@/lib/action-result";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import type { BillableProduct } from "@/features/products/queries";
import { openPendingTab } from "@/features/whatsapp/links";
import { createBill, markBillShared, updateBill } from "../actions";
import { computeTotals } from "../calc";
import { sellUnit, type SellAs } from "@/features/products/pack";
import { BillLines, lineKey, type BillLine } from "./bill-lines";
import { AddItemDialog } from "./add-item-dialog";
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

/** An existing bill loaded into the form for editing. */
export type BillFormEditing = {
  billId: number;
  customerName: string;
  customerPhone: string;
  billedBy: string;
  discountPercent: number;
  lines: BillLine[];
};

export function BillForm({
  products,
  autoSend,
  editing,
}: {
  products: BillableProduct[];
  /** True when WhatsApp Cloud API is configured and bills go out on save. */
  autoSend: boolean;
  /** When set, the form edits this bill instead of creating a new one. */
  editing?: BillFormEditing;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [customerName, setCustomerName] = useState(editing?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(editing?.customerPhone ?? "");
  const [billedBy, setBilledBy] = useState(editing?.billedBy ?? "");
  const [discount, setDiscount] = useState(
    editing?.discountPercent ? String(editing.discountPercent) : "",
  );
  const [lines, setLines] = useState<BillLine[]>(editing?.lines ?? []);
  // Cracker picked from search, waiting for piece/pack + quantity.
  const [picked, setPicked] = useState<BillableProduct | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    // An edited bill keeps its own biller.
    if (editing) return;
    const stored = readStoredBiller();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only
    if (stored) setBilledBy(stored);
  }, [editing]);

  // Keep line products in sync with fresh prices after a refresh.
  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const currentLines = useMemo(
    () =>
      lines
        .map((l) => ({ ...l, product: productsById.get(l.product.id) ?? l.product }))
        .filter((l) => productsById.has(l.product.id)),
    [lines, productsById],
  );

  const discountPercent = Math.min(100, Math.max(0, Number(discount) || 0));
  const totals = computeTotals(
    currentLines.map((l) => ({
      unitPrice: sellUnit(l.product, l.sellAs).unitPrice,
      quantity: l.quantity,
    })),
    discountPercent,
  );

  /** Adds from the piece/pack dialog; same product + kind adds to the existing line. */
  function addLine(product: BillableProduct, sellAs: SellAs, quantity: number) {
    setLines((prev) => {
      const key = lineKey({ product, sellAs });
      const existing = prev.find((l) => lineKey(l) === key);
      if (existing) {
        return prev.map((l) => (l === existing ? { ...l, quantity: l.quantity + quantity } : l));
      }
      return [...prev, { product, sellAs, quantity }];
    });
    setErrors((e) => ({ ...e, items: undefined }));
  }

  function setQuantity(key: string, quantity: number) {
    setLines((prev) => prev.map((l) => (lineKey(l) === key ? { ...l, quantity } : l)));
  }

  /** Switches a line between pieces and packs, merging into an existing line of that kind. */
  function setSellAs(key: string, sellAs: SellAs) {
    setLines((prev) => {
      const line = prev.find((l) => lineKey(l) === key);
      if (!line) return prev;
      const target = prev.find((l) => lineKey(l) === lineKey({ ...line, sellAs }));
      if (target) {
        return prev
          .filter((l) => l !== line)
          .map((l) => (l === target ? { ...l, quantity: l.quantity + line.quantity } : l));
      }
      return prev.map((l) => (l === line ? { ...l, sellAs } : l));
    });
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
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
    // Dialogs render in a portal but React still bubbles their submit events
    // here; only this form's own submit should save the bill.
    if (e.target !== e.currentTarget) return;
    if (currentLines.length === 0) {
      setErrors({ items: ["Add at least one item"] });
      toast.error("Add at least one item");
      return;
    }

    const input = {
      customerName,
      customerPhone,
      billedBy,
      discountPercent,
      items: currentLines.map((l) => ({
        productId: l.product.id,
        quantity: l.quantity,
        sellAs: l.sellAs,
      })),
    };

    if (editing) {
      startTransition(async () => {
        const result = await updateBill(editing.billId, input);
        if (!result.ok) {
          setErrors(result.fieldErrors ?? {});
          toast.error(result.error);
          return;
        }
        toast.success("Bill updated. Send it on WhatsApp again so the customer has the new total.");
        router.push(`/bills/${editing.billId}`);
      });
      return;
    }

    // Must open synchronously in the submit handler or the browser blocks it.
    const whatsappTab = autoSend ? null : openPendingTab();

    startTransition(async () => {
      const result = await createBill(input);

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
    <>
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
              <ProductPicker products={products} onPick={setPicked} />
              {errors.items && <p className="text-sm text-destructive">{errors.items[0]}</p>}
              <BillLines
                lines={currentLines}
                onQuantityChange={setQuantity}
                onSellAsChange={setSellAs}
                onRemove={removeLine}
              />
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
              {totals.roundOff !== 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Round off</dt>
                  <dd className="tabular-nums">{formatSignedCurrency(totals.roundOff)}</dd>
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
            {editing ? (
              <div className="grid gap-2">
                <Button type="submit" size="lg" className="w-full" disabled={pending}>
                  <SaveIcon />
                  {pending ? "Saving…" : "Save changes"}
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href={`/bills/${editing.billId}`}>Cancel</Link>
                </Button>
              </div>
            ) : (
              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                <SendIcon />
                {pending ? "Saving…" : autoSend ? "Save & send on WhatsApp" : "Save & open WhatsApp"}
              </Button>
            )}
          </CardContent>
        </Card>
      </form>
      {/* Outside the bill form so "Add to bill" can't submit the whole bill. */}
      {picked && (
        <AddItemDialog
          key={picked.id}
          product={picked}
          onAdd={(sellAs, quantity) => {
            addLine(picked, sellAs, quantity);
            setPicked(null);
          }}
          onClose={() => setPicked(null)}
        />
      )}
    </>
  );
}
