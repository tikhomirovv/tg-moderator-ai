import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";

const PAGES_ROOT = path.resolve(import.meta.dir, "../../../pages");

describe("bots page routing", () => {
  test("audit route is not blocked by sibling [id].vue leaf", () => {
    const botIdVue = path.join(PAGES_ROOT, "bots/[id].vue");
    const botIndexVue = path.join(PAGES_ROOT, "bots/[id]/index.vue");
    const auditVue = path.join(PAGES_ROOT, "bots/[id]/audit.vue");
    const moderationVue = path.join(
      PAGES_ROOT,
      "bots/[id]/chats/[chatId]/moderation.vue"
    );

    expect(existsSync(botIdVue)).toBe(false);
    expect(existsSync(botIndexVue)).toBe(true);
    expect(existsSync(auditVue)).toBe(true);
    expect(existsSync(moderationVue)).toBe(true);
  });

  test("pre-refactor workspace route dirs are absent", () => {
    const legacyDirs = [
      path.join(PAGES_ROOT, "moderation"),
      path.join(PAGES_ROOT, "w"),
      path.join(PAGES_ROOT, "w-[slug]"),
    ];

    for (const dir of legacyDirs) {
      expect(existsSync(dir)).toBe(false);
    }
  });
});
