import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const API_ROOT = path.resolve(import.meta.dir, "../../../server/api/bots");

const OWNER_ONLY_ROUTES = [
  "[id].delete.ts",
  "[id]/team/access-code.get.ts",
  "[id]/team/access-code/revoke.post.ts",
  "[id]/team/members/[userId].delete.ts",
] as const;

const MANAGER_OPERATIONAL_ROUTES = [
  "[id]/chats/pending.post.ts",
  "[id]/chats/pending/[pendingId].get.ts",
  "[id]/team/members.get.ts",
] as const;

function readRoute(relativePath: string): string {
  return readFileSync(path.join(API_ROOT, relativePath), "utf8");
}

describe("manager role API access", () => {
  test("bot delete and team admin routes require owner role", () => {
    for (const relativePath of OWNER_ONLY_ROUTES) {
      const content = readRoute(relativePath);
      expect(content).toContain('requireBotAccess(event, botId, ["owner"])');
    }
  });

  test("operational routes remain available to any bot member", () => {
    for (const relativePath of MANAGER_OPERATIONAL_ROUTES) {
      const content = readRoute(relativePath);
      expect(content).not.toContain('["owner"]');
      expect(content).toContain("requireBotAccess(event, botId)");
    }
  });
});
