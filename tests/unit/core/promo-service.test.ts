import { describe, expect, test, beforeEach } from "bun:test";
import { PromoService } from "../../../server/core/promo-service";
import { resetDeploymentModeCacheForTests } from "../../../server/core/deployment-mode";
import type { PromoCode } from "../../../server/database/models/promo-code";

function createPromo(overrides: Partial<PromoCode> = {}): PromoCode {
  return {
    id: 1,
    code: "SAVE10",
    discount_percent: 10,
    is_active: true,
    expires_at: null,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("PromoService", () => {
  beforeEach(() => {
    resetDeploymentModeCacheForTests();
  });

  test("rejects when not in SaaS mode", async () => {
    const service = new PromoService({ env: { DEPLOYMENT_MODE: "self-hosted" } });
    const result = await service.validateForUser("SAVE10", "user-1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("not_saas");
    }
  });

  test("rejects inactive, expired, and already redeemed codes", async () => {
    const promo = createPromo();
    const store = {
      async findPromoByCode() {
        return promo;
      },
      async findRedemption() {
        return null;
      },
    };

    const inactive = new PromoService({
      env: { DEPLOYMENT_MODE: "saas" },
      store: {
        ...store,
        async findPromoByCode() {
          return createPromo({ is_active: false });
        },
      },
    });
    expect((await inactive.validateForUser("SAVE10", "user-1")).ok).toBe(false);

    const expired = new PromoService({
      env: { DEPLOYMENT_MODE: "saas" },
      now: () => new Date("2026-07-01"),
      store: {
        ...store,
        async findPromoByCode() {
          return createPromo({ expires_at: new Date("2026-06-01") });
        },
      },
    });
    const expiredResult = await expired.validateForUser("SAVE10", "user-1");
    expect(expiredResult.ok).toBe(false);
    if (!expiredResult.ok) {
      expect(expiredResult.error).toBe("expired");
    }

    const redeemed = new PromoService({
      env: { DEPLOYMENT_MODE: "saas" },
      store: {
        ...store,
        async findRedemption() {
          return { id: 99 };
        },
      },
    });
    const redeemedResult = await redeemed.validateForUser("SAVE10", "user-1");
    expect(redeemedResult.ok).toBe(false);
    if (!redeemedResult.ok) {
      expect(redeemedResult.error).toBe("already_redeemed");
    }
  });

  test("accepts valid promo for user", async () => {
    const service = new PromoService({
      env: { DEPLOYMENT_MODE: "saas" },
      store: {
        async findPromoByCode() {
          return createPromo();
        },
        async findRedemption() {
          return null;
        },
      },
    });

    const result = await service.validateForUser("save10", "user-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.promo.code).toBe("SAVE10");
      expect(result.value.discount_percent).toBe(10);
      expect(service.computeDiscountedPrice(490, 10)).toBe(441);
    }
  });
});
