/** Normalize promo code for storage and lookup (case-insensitive). */
export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Floor discounted RUB amount; minimum 1 ₽ (100% codes still charge 1 ₽). */
export function computeDiscountedAmountRub(
  originalAmountRub: number,
  discountPercent: number
): number {
  return Math.max(
    1,
    Math.floor((originalAmountRub * (100 - discountPercent)) / 100)
  );
}
