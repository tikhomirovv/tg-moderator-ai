import { describe, expect, test } from "bun:test";
import { DEFAULT_APP_NAME, resolveAppName } from "../../../lib/app-config";

describe("resolveAppName", () => {
  test("defaults to Telemodai", () => {
    expect(resolveAppName({})).toBe(DEFAULT_APP_NAME);
    expect(DEFAULT_APP_NAME).toBe("Telemodai");
  });

  test("trims APP_NAME from env", () => {
    expect(resolveAppName({ APP_NAME: "  Custom  " })).toBe("Custom");
  });

  test("falls back when APP_NAME is blank", () => {
    expect(resolveAppName({ APP_NAME: "   " })).toBe(DEFAULT_APP_NAME);
  });
});
