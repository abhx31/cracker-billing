"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DownloadIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markBillShared } from "../actions";

function canShareFiles() {
  try {
    const probe = new File([""], "probe.pdf", { type: "application/pdf" });
    return typeof navigator.canShare === "function" && navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

const noopSubscribe = () => () => {};

/**
 * Phones: share the PDF file through the share sheet (pick WhatsApp → customer).
 * Computers: download it to drag into WhatsApp Web.
 */
export function BillPdfButton({
  billId,
  pdfPath,
  fileName,
}: {
  billId: number;
  pdfPath: string;
  fileName: string;
}) {
  const shareSupported = useSyncExternalStore(noopSubscribe, canShareFiles, () => false);
  const [file, setFile] = useState<File | null>(null);

  // Fetch ahead of the tap: browsers (iOS especially) only allow share() right
  // after a tap, so waiting for a download inside the click handler fails.
  useEffect(() => {
    if (!shareSupported) return;
    let cancelled = false;
    fetch(pdfPath)
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(res.statusText))))
      .then((blob) => {
        if (!cancelled) setFile(new File([blob], fileName, { type: "application/pdf" }));
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't prepare the PDF. Check your connection.");
      });
    return () => {
      cancelled = true;
    };
  }, [shareSupported, pdfPath, fileName]);

  if (!shareSupported) {
    return (
      <Button asChild variant="outline">
        <a href={pdfPath} download={fileName}>
          <DownloadIcon />
          Download PDF
        </a>
      </Button>
    );
  }

  async function share() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: fileName });
      void markBillShared(billId);
    } catch (error) {
      // AbortError = the user closed the share sheet; nothing to report.
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Sharing failed. Try Download instead.");
    }
  }

  return (
    <Button variant="outline" onClick={share} disabled={!file}>
      <Share2Icon />
      {file ? "Share PDF" : "Preparing PDF…"}
    </Button>
  );
}
