import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "../../..");

function readPage(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("document titles", () => {
  test("default layout sets titleTemplate from i18n app name", () => {
    const layout = readPage("layouts/default.vue");
    expect(layout).toContain('t("app.name")');
    expect(layout).toContain("titleTemplate:");
  });

  test("user-facing pages set a page title", () => {
    const pagesWithTitle = [
      "pages/index.vue",
      "pages/login.vue",
      "pages/bots/index.vue",
      "pages/bots/[id]/index.vue",
      "pages/bots/[id]/audit.vue",
      "pages/bots/[id]/chats/[chatId]/moderation.vue",
      "pages/release-notes/index.vue",
    ];

    for (const pagePath of pagesWithTitle) {
      const content = readPage(pagePath);
      expect(content).toContain("usePageTitle(");
    }
  });

  test("join redirect page does not set a title", () => {
    const content = readPage("pages/join.vue");
    expect(content).not.toContain("usePageTitle(");
  });
});
