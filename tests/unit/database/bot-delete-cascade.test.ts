import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { resolveMigrationsFolder } from "../../../server/database/migrations-path";

const CASCADE_TABLES = [
  "chat_statistics",
  "moderation_actions",
  "moderation_decisions",
  "user_contexts",
  "user_messages",
] as const;

describe("bot delete cascade migrations", () => {
  test("0004 adds ON DELETE cascade FK from audit tables to bots", () => {
    const folder = resolveMigrationsFolder();
    const sql = readFileSync(
      path.join(folder, "0004_freezing_kang.sql"),
      "utf8"
    );

    for (const table of CASCADE_TABLES) {
      expect(sql).toContain(`ALTER TABLE "${table}"`);
      expect(sql).toContain(`${table}_bot_id_bots_id_fk`);
      expect(sql).toContain('ON DELETE cascade');
    }

    expect(sql).toContain('DELETE FROM "moderation_actions"');
  });
});
