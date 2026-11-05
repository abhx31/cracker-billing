"use client";

import { useTransition } from "react";
import { MessageCircleIcon, PrinterIcon, RotateCwIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { WhatsappMode } from "@/features/whatsapp";
import { openWhatsappChat, type WhatsappShare } from "@/features/whatsapp/links";
import { markBillShared, resendBill } from "../actions";
import { BillPdfButton } from "./bill-pdf-button";

export function BillActions({
  billId,
  share,
  mode,
  pdfPath,
  pdfFileName,
}: {
  billId: number;
  share: WhatsappShare;
  mode: WhatsappMode;
  pdfPath: string;
  pdfFileName: string;
}) {
  const [pending, startTransition] = useTransition();

  function resend() {
    startTransition(async () => {
      const result = await resendBill(billId);
      if (result.ok) toast.success(result.message ?? "Sent");
      else toast.error(result.error);
    });
  }

  function openWhatsapp() {
    // The URL depends on the device (app vs WhatsApp Web), so build it on click.
    if (!openWhatsappChat(share)) {
      toast.error("Your browser blocked the WhatsApp tab. Allow pop-ups for this site.");
      return;
    }
    // Fire-and-forget: the chat opens regardless of this result.
    void markBillShared(billId);
  }

  return (
    <>
      {mode === "cloud-api" && (
        <Button variant="outline" onClick={resend} disabled={pending}>
          <RotateCwIcon />
          {pending ? "Sending…" : "Resend"}
        </Button>
      )}
      <BillPdfButton billId={billId} pdfPath={pdfPath} fileName={pdfFileName} />
      <Button variant="outline" onClick={() => window.print()}>
        <PrinterIcon />
        Print
      </Button>
      <Button onClick={openWhatsapp} className="bg-emerald-600 text-white hover:bg-emerald-700">
        <MessageCircleIcon />
        {mode === "cloud-api" ? "Open in WhatsApp" : "Send on WhatsApp"}
      </Button>
    </>
  );
}
