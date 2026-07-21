import { describe, expect, test } from "bun:test";
import { PROMO_COOKIE_NAME } from "../../../server/utils/promo-cookie";

describe("promo cookie", () => {
  test("exports stable cookie name for client/server contract", () => {
    expect(PROMO_COOKIE_NAME).toBe("tg_promo_code");
  });
});
