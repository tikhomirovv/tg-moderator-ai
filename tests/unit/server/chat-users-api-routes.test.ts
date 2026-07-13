import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";

const USERS_API_DIR = path.resolve(
  import.meta.dir,
  "../../../server/api/bots/[id]/chats/[chatId]/users"
);

describe("chat users moderation API routes", () => {
  test("list and pardon endpoints exist", () => {
    expect(existsSync(path.join(USERS_API_DIR, "index.get.ts"))).toBe(true);
    expect(
      existsSync(path.join(USERS_API_DIR, "[userId]/pardon.post.ts"))
    ).toBe(true);
    expect(
      existsSync(path.join(USERS_API_DIR, "[userId]/reset-warnings.post.ts"))
    ).toBe(true);
    expect(existsSync(path.join(USERS_API_DIR, "[userId]/unban.post.ts"))).toBe(
      true
    );
  });
});
