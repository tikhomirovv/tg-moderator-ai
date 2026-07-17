import { describe, expect, test } from "bun:test";
import {
  computeDiscountedAmountRub,
  normalizePromoCode,
} from "../../../server/core/billing/promo-discount";

describe("promo-discount", () => {
  test("normalizePromoCode uppercases and trims", () => {
    expect(normalizePromoCode("  save10  ")).toBe("SAVE10");
  });

  test("computeDiscountedAmountRub floors and enforces minimum 1 RUB", () => {
    expect(computeDiscountedAmountRub(490, 10)).toBe(441);
    expect(computeDiscountedAmountRub(490, 100)).toBe(1);
    expect(computeDiscountedAmountRub(1, 50)).toBe(1);
  });
});
