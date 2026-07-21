import { describe, expect, test } from "bun:test";
import { promoStatusMessageToI18nKey } from "../../../lib/promo-validation-messages";
import { resolvePromoUserMessage } from "../../../lib/promo-validation-ui";

const t = (key: string) => `i18n:${key}`;

describe("promo validation UI", () => {
  test("maps known statusMessage to i18n key", () => {
    expect(promoStatusMessageToI18nKey("Promo code not found")).toBe(
      "billing.promo.errors.notFound"
    );
    expect(
      resolvePromoUserMessage("Promo code not found", t)
    ).toBe("i18n:billing.promo.errors.notFound");
  });

  test("uses generic fallback for unknown messages", () => {
    expect(resolvePromoUserMessage(undefined, t)).toBe(
      "i18n:billing.promo.errors.generic"
    );
  });
});
