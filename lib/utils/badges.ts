export type ProductBadgeInput = {
  createdAt: Date | string;
  stock: number;
  price: number;
  oldPrice?: number | null;
  salesCount?: number | null;
};

export type ProductBadges = {
  isNew: boolean;
  isOutOfStock: boolean;
  isDiscount: boolean;
  isHot: boolean;
};

const NEW_WINDOW_DAYS = 14;
const HOT_MIN_SALES = 10;

export function getProductBadges(
  product: ProductBadgeInput,
  options: { hotThreshold?: number } = {}
): ProductBadges {
  const created =
    typeof product.createdAt === 'string'
      ? new Date(product.createdAt)
      : product.createdAt;
  const ageMs = Date.now() - created.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  const sales = product.salesCount ?? 0;
  // A product is "hot" when it sits in the top sales tier of the current set
  // (hotThreshold is provided by callers that have a comparable list);
  // when no threshold is supplied, fall back to a sensible absolute floor.
  const hotThreshold = options.hotThreshold ?? HOT_MIN_SALES;

  return {
    isNew: ageDays >= 0 && ageDays <= NEW_WINDOW_DAYS,
    isOutOfStock: product.stock <= 0,
    isDiscount:
      product.oldPrice != null && product.oldPrice > product.price,
    isHot: sales > 0 && sales >= hotThreshold,
  };
}

// Computes the salesCount cutoff for the top ~20% of a product set,
// floored at HOT_MIN_SALES so a quiet catalog doesn't crown everything hot.
export function computeHotThreshold(salesCounts: number[]): number {
  const positives = salesCounts.filter((n) => n > 0).sort((a, b) => b - a);
  if (positives.length === 0) return HOT_MIN_SALES;
  const topIdx = Math.max(0, Math.floor(positives.length * 0.2) - 1);
  return Math.max(HOT_MIN_SALES, positives[topIdx]);
}
