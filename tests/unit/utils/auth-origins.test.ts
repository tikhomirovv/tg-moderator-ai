import { describe, expect, test } from "bun:test";
import { getTrustedAuthOrigins } from "../../../server/utils/auth-origins";

describe("getTrustedAuthOrigins", () => {
  test("includes localhost and 127.0.0.1 pair for dev", () => {
    const origins = getTrustedAuthOrigins("http://localhost:3001");
    expect(origins).toContain("http://localhost:3001");
    expect(origins).toContain("http://127.0.0.1:3001");
  });

  test("includes extra origins from env", () => {
    const prev = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
    process.env.BETTER_AUTH_TRUSTED_ORIGINS = "https://app.example.com";
    try {
      const origins = getTrustedAuthOrigins("http://localhost:3001");
      expect(origins).toContain("https://app.example.com");
    } finally {
      if (prev === undefined) {
        delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;
      } else {
        process.env.BETTER_AUTH_TRUSTED_ORIGINS = prev;
      }
    }
  });
});
