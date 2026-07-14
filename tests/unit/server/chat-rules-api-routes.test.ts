import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";

const CHATS_API_DIR = path.resolve(
  import.meta.dir,
  "../../../server/api/bots/[id]/chats"
);
const RULE_ROUTE_DIR = path.join(CHATS_API_DIR, "[chatId]/rules");

describe("chat API routes", () => {
  test("rule update/delete handlers exist at rules/[ruleId]", () => {
    expect(existsSync(path.join(RULE_ROUTE_DIR, "[ruleId].put.ts"))).toBe(true);
    expect(existsSync(path.join(RULE_ROUTE_DIR, "[ruleId].delete.ts"))).toBe(
      true
    );
  });

  test("chat photo route does not share chats/ dynamic segment with chatId", () => {
    // Two dynamic siblings under chats/ break deeper routes like rules/[ruleId].
    expect(existsSync(path.join(CHATS_API_DIR, "[chatRowId]/photo.get.ts"))).toBe(
      false
    );
    expect(
      existsSync(path.join(CHATS_API_DIR, "row/[chatRowId]/photo.get.ts"))
    ).toBe(true);
  });

  test("legacy empty API dirs from route moves are absent", () => {
    const legacyDirs = [
      path.resolve(import.meta.dir, "../../../server/api/moderation"),
      path.join(RULE_ROUTE_DIR, "[ruleId]"),
      path.join(RULE_ROUTE_DIR, "from-template"),
      path.join(CHATS_API_DIR, "[chatRowId]"),
    ];

    for (const dir of legacyDirs) {
      expect(existsSync(dir)).toBe(false);
    }
  });
});
