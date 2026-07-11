import { describe, expect, test } from "bun:test";
import {
  filterRulesByWhitelist,
  isSenderWhitelisted,
  normalizeWhitelistUsername,
} from "../../../server/core/rule-whitelist";

describe("normalizeWhitelistUsername", () => {
  test("strips @ and lowercases", () => {
    expect(normalizeWhitelistUsername("@Admin")).toBe("admin");
    expect(normalizeWhitelistUsername("User")).toBe("user");
  });
});

describe("isSenderWhitelisted", () => {
  test("matches telegram user id", () => {
    expect(
      isSenderWhitelisted(
        [{ telegram_user_id: 42, username: null }],
        { id: 42 }
      )
    ).toBe(true);
  });

  test("matches username case-insensitively without @", () => {
    expect(
      isSenderWhitelisted(
        [{ telegram_user_id: null, username: "trusted" }],
        { id: 1, username: "@Trusted" }
      )
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
      ["spam", [{ telegram_user_id: 99, username: null }]],
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
    const whitelist = new Map([
      ["spam", [{ telegram_user_id: null, username: "vip" }]],
    ]);

    const filtered = filterRulesByWhitelist(
      rules,
      whitelist,
      { id: 1, username: "VIP" }
    );

    expect(filtered).toHaveLength(0);
  });
});
