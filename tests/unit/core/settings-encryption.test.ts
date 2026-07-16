import { describe, expect, test } from "bun:test";
import {
  encryptSecret,
  decryptSecret,
} from "../../../server/core/settings-encryption";

const TEST_ENV = {
  SETTINGS_ENCRYPTION_KEY: "test-secret-key-for-unit-tests-only",
};

describe("settings-encryption", () => {
  test("round-trips API key", () => {
    const encrypted = encryptSecret("sk-test-123", TEST_ENV);
    expect(encrypted).not.toContain("sk-test");
    expect(decryptSecret(encrypted, TEST_ENV)).toBe("sk-test-123");
  });

  test("returns null for empty ciphertext", () => {
    expect(decryptSecret(null, TEST_ENV)).toBeNull();
    expect(decryptSecret("", TEST_ENV)).toBeNull();
  });
});
