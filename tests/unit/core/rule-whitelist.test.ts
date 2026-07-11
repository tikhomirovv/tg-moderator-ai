import { describe, expect, test } from "bun:test";
import {
  filterRulesByWhitelist,
  isSenderWhitelisted,
  matchesWhitelistEntry,
  normalizeWhitelistEntry,
  normalizeWhitelistUsername,
  parseWhitelistEntry,
} from "../../../server/core/rule-whitelist";

describe("normalizeWhitelistUsername", () => {
  test("strips @ and lowercases", () => {
    expect(normalizeWhitelistUsername("@Admin")).toBe("admin");
    expect(normalizeWhitelistUsername("User")).toBe("user");
  });
});

describe("normalizeWhitelistEntry", () => {
  test("normalizes user id entries", () => {
    expect(normalizeWhitelistEntry(" 987654321 ")).toBe("987654321");
    expect(normalizeWhitelistEntry("@123456789")).toBe("123456789");
  });

  test("normalizes username entries", () => {
    expect(normalizeWhitelistEntry("@TrustedUser")).toBe("trusteduser");
    expect(normalizeWhitelistEntry("TrustedUser")).toBe("trusteduser");
  });

  test("rejects empty entries", () => {
    expect(normalizeWhitelistEntry("")).toBeNull();
    expect(normalizeWhitelistEntry("  @  ")).toBeNull();
  });
});

describe("parseWhitelistEntry", () => {
  test("classifies digit-only as user_id", () => {
    expect(parseWhitelistEntry("42")).toBe("user_id");
  });

  test("classifies non-digits as username", () => {
    expect(parseWhitelistEntry("trusteduser")).toBe("username");
  });
});

describe("matchesWhitelistEntry", () => {
  test("matches telegram user id", () => {
    expect(matchesWhitelistEntry("42", { id: 42 })).toBe(true);
    expect(matchesWhitelistEntry("42", { id: 99 })).toBe(false);
  });

  test("matches username case-insensitively", () => {
    expect(
      matchesWhitelistEntry("trusted", { id: 1, username: "@Trusted" })
    ).toBe(true);
  });
});

describe("isSenderWhitelisted", () => {
  test("matches telegram user id", () => {
    expect(isSenderWhitelisted(["42"], { id: 42 })).toBe(true);
  });

  test("matches username case-insensitively without @", () => {
    expect(
      isSenderWhitelisted(["trusted"], { id: 1, username: "@Trusted" })
    ).toBe(true);
  });
});

describe("filterRulesByWhitelist", () => {
  test("removes rules where sender is whitelisted", () => {
    const rules = [
      { id: "spam", name: "Spam" },
      { id: "ads", name: "Ads" },
    ];
    const whitelist = new Map([
      ["spam", ["99"]],
      ["ads", []],
    ]);

    const filtered = filterRulesByWhitelist(
      rules,
      whitelist,
      { id: 99, username: "vip" }
    );

    expect(filtered.map((rule) => rule.id)).toEqual(["ads"]);
  });

  test("returns empty when all rules whitelisted for sender", () => {
    const rules = [{ id: "spam", name: "Spam" }];
    const whitelist = new Map([["spam", ["vip"]]]);

    const filtered = filterRulesByWhitelist(
      rules,
      whitelist,
      { id: 1, username: "VIP" }
    );

    expect(filtered).toHaveLength(0);
  });
});
