import { Badge } from "@/components/ui/badge";

export function StockBadge({
  stock,
  lowStockThreshold,
  unit,
}: {
  stock: number;
  lowStockThreshold: number;
  unit?: string;
}) {
  const label = unit ? `${stock} ${unit}` : String(stock);
  if (stock <= 0) return <Badge variant="destructive">Out of stock</Badge>;
  if (stock <= lowStockThreshold) {
    return (
      <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
        {label} · Low
      </Badge>
    );
  }
  return <Badge variant="secondary">{label}</Badge>;
}
