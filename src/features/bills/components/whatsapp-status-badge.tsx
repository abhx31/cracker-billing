import { Badge } from "@/components/ui/badge";
import type { WhatsappStatus } from "@/db/schema";

const config: Record<WhatsappStatus, { label: string; className?: string; variant?: "secondary" | "destructive" | "outline" }> = {
  sent: { label: "Sent", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200" },
  shared: { label: "Shared", className: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200" },
  failed: { label: "Failed", variant: "destructive" },
  pending: { label: "Not sent", variant: "outline" },
};

export function WhatsappStatusBadge({ status }: { status: WhatsappStatus }) {
  const { label, className, variant } = config[status];
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
