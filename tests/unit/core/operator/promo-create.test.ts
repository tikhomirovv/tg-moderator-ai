import { describe, expect, test } from "bun:test";
import {
  createPromoCodeOperator,
  parseExpiresAt,
  validateDiscountPercent,
} from "../../../server/core/operator/promo-create";
import type { PromoCode } from "../../../server/database/models/promo-code";

function createPromo(overrides: Partial<PromoCode> = {}): PromoCode {
  return {
    id: 42,
    code: "SAVE10",
    discount_percent: 10,
    is_active: true,
    expires_at: null,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("operator promo-create", () => {
  test("validateDiscountPercent accepts 1-100 integers only", () => {
    expect(validateDiscountPercent(1)).toBe(true);
    expect(validateDiscountPercent(100)).toBe(true);
    expect(validateDiscountPercent(0)).toBe(false);
    expect(validateDiscountPercent(101)).toBe(false);
    expect(validateDiscountPercent(10.5)).toBe(false);
  });

  test("parseExpiresAt rejects invalid ISO", () => {
    expect(() => parseExpiresAt("not-a-date")).toThrow(/Invalid expires_at/);
    expect(parseExpiresAt("")).toBeNull();
    expect(parseExpiresAt(undefined)).toBeNull();
  });

  test("createPromoCodeOperator returns duplicate when code exists", async () => {
    const repo = {
      async findByCode() {
        return createPromo();
      },
      async create() {
        throw new Error("should not create");
      },
    };

    const result = await createPromoCodeOperator(
      { code: "save10", discount_percent: 10, expires_at: null },
      repo as never
    );

    expect(result).toEqual({ ok: false, error: "duplicate" });
  });

  test("createPromoCodeOperator creates via repository", async () => {
    const repo = {
      async findByCode() {
        return null;
      },
      async create(input: {
        code: string;
        discount_percent: number;
        expires_at?: Date | null;
      }) {
        return createPromo({
          code: input.code,
          discount_percent: input.discount_percent,
          expires_at: input.expires_at ?? null,
        });
      },
    };

    const result = await createPromoCodeOperator(
      { code: "launch20", discount_percent: 20, expires_at: null },
      repo as never
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.promo.code).toBe("LAUNCH20");
      expect(result.promo.discount_percent).toBe(20);
    }
  });
});
