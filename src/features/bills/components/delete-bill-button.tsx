"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatBillNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteBill } from "../actions";

export function DeleteBillButton({
  billId,
  iconOnly = false,
  redirectTo,
  className,
}: {
  billId: number;
  /** Compact icon button for table rows. */
  iconOnly?: boolean;
  /** Where to go after deleting (e.g. away from the deleted bill's page). */
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const billNumber = formatBillNumber(billId);

  function confirm() {
    startTransition(async () => {
      const result = await deleteBill(billId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${billNumber}: ${result.message}`);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger asChild>
        {iconOnly ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${billNumber}`}
            title="Delete bill"
            className={cn("text-muted-foreground hover:text-destructive", className)}
          >
            <Trash2Icon />
          </Button>
        ) : (
          <Button variant="destructive" className={className}>
            <Trash2Icon />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {billNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            The bill is removed permanently. A WhatsApp message
            already sent to the customer can&apos;t be recalled.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep bill</AlertDialogCancel>
          {/* Plain button (not AlertDialogAction) so the dialog stays open until the delete finishes. */}
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? "Deleting…" : "Delete bill"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
