import { describe, expect, test } from "bun:test";
import { readFetchError } from "../../../lib/fetch-error";

describe("readFetchError", () => {
  test("prefers API statusMessage from data", () => {
    const error = {
      data: { statusMessage: "Promo code not found" },
      message: '[POST] "/api/promo/apply": 400',
    };
    expect(readFetchError(error, "fallback")).toBe("Promo code not found");
  });

  test("ignores ofetch transport message and uses fallback", () => {
    const error = {
      message: '[POST] "/api/promo/apply": 400',
    };
    expect(readFetchError(error, "Something went wrong")).toBe(
      "Something went wrong"
    );
  });
});
