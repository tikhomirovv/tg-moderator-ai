import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const API_ROOT = path.resolve(import.meta.dir, "../../../server/api/bots");

const FORMER_OWNER_ONLY_ROUTES = [
  "[id].delete.ts",
  "[id]/chats/pending.post.ts",
  "[id]/chats/pending/[pendingId].get.ts",
  "[id]/team/access-code.get.ts",
  "[id]/team/access-code/revoke.post.ts",
  "[id]/team/members/[userId].delete.ts",
] as const;

describe("manager parity API routes", () => {
  test("former owner-only routes no longer require ['owner']", () => {
    for (const relativePath of FORMER_OWNER_ONLY_ROUTES) {
      const content = readFileSync(path.join(API_ROOT, relativePath), "utf8");
      expect(content).not.toContain('["owner"]');
    }
  });
});
