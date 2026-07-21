import { describe, expect, test } from "bun:test";
import {
  parseGrantAmount,
  validateGrantReason,
} from "../../../server/core/operator/credits-grant";

describe("operator credits-grant helpers", () => {
  test("parseGrantAmount accepts signed non-zero integers", () => {
    expect(parseGrantAmount("5000")).toBe(5000);
    expect(parseGrantAmount("-100")).toBe(-100);
    expect(parseGrantAmount("0")).toBeNull();
    expect(parseGrantAmount("1.5")).toBeNull();
    expect(parseGrantAmount("")).toBeNull();
  });

  test("validateGrantReason requires non-empty text", () => {
    expect(validateGrantReason(" support ")).toBe("support");
    expect(validateGrantReason("")).toBeNull();
    expect(validateGrantReason(undefined)).toBeNull();
  });
});
