import { describe, expect, test } from "bun:test";
import { formatAuthError } from "../../../lib/auth-errors";

describe("formatAuthError", () => {
  test("maps known error codes", () => {
    expect(
      formatAuthError({ code: "INVALID_EMAIL_OR_PASSWORD" })
    ).toBe("Invalid email or password.");
    expect(
      formatAuthError({ code: "ORGANIZATION_ALREADY_EXISTS" })
    ).toBe("A workspace with this name already exists.");
  });

  test("maps raw Better Auth messages by pattern", () => {
    expect(
      formatAuthError({ message: "Organization already exists" })
    ).toBe("A workspace with this name already exists.");
  });

  test("returns fallback for unknown errors", () => {
    expect(formatAuthError({ message: "Something weird" }, "Failed")).toBe(
      "Failed"
    );
    expect(formatAuthError(null, "Failed")).toBe("Failed");
  });
});
