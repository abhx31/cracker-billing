/** How a line is sold: single pieces at `price`, or whole packs at `packPrice`. */
export type SellAs = "piece" | "pack";

type Sellable = {
  unit: string;
  price: number;
  packSize: number | null;
  packPrice: number | null;
};

export function hasPack<T extends Sellable>(
  product: T,
): product is T & { packSize: number; packPrice: number } {
  return product.packSize !== null && product.packPrice !== null;
}

/** Price, pieces, and unit label for one unit sold. */
export function sellUnit(product: Sellable, sellAs: SellAs) {
  if (sellAs === "pack" && hasPack(product)) {
    return {
      unitPrice: product.packPrice,
      piecesPerUnit: product.packSize,
      unit: `pack of ${product.packSize}`,
    };
  }
  return { unitPrice: product.price, piecesPerUnit: 1, unit: product.unit };
}
