import { describe, expect, test } from "bun:test";
import {
  generateWebhookSecret,
  isValidWebhookSecret,
} from "../../../server/utils/webhook-auth";

describe("webhook-auth", () => {
  test("generateWebhookSecret returns hex string", () => {
    const secret = generateWebhookSecret();
    expect(secret).toMatch(/^[a-f0-9]{64}$/);
  });

  test("isValidWebhookSecret accepts matching secrets", () => {
    const secret = "abc123";
    expect(isValidWebhookSecret(secret, secret)).toBe(true);
  });

  test("isValidWebhookSecret rejects missing or mismatched secrets", () => {
    expect(isValidWebhookSecret(undefined, "abc")).toBe(false);
    expect(isValidWebhookSecret("abc", undefined)).toBe(false);
    expect(isValidWebhookSecret("abc", "def")).toBe(false);
  });
});
