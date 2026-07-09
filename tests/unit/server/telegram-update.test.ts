import { describe, expect, test } from "bun:test";
import { isBotEligibleForUpdates } from "../../../server/index";

describe("isBotEligibleForUpdates", () => {
  test("returns false for inactive bot", () => {
    expect(
      isBotEligibleForUpdates({
        is_active: false,
        token: "secret",
      })
    ).toBe(false);
  });

  test("returns false when token is missing", () => {
    expect(
      isBotEligibleForUpdates({
        is_active: true,
        token: undefined,
      })
    ).toBe(false);
  });

  test("returns true for active bot with token", () => {
    expect(
      isBotEligibleForUpdates({
        is_active: true,
        token: "secret",
      })
    ).toBe(true);
  });
});
