import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";
import { resolveMigrationsFolder } from "../../../server/database/migrations-path";

describe("resolveMigrationsFolder", () => {
  test("finds meta/_journal.json from project root", () => {
    const folder = resolveMigrationsFolder();
    expect(existsSync(path.join(folder, "meta/_journal.json"))).toBe(true);
    expect(existsSync(path.join(folder, "0001_rules_whitelist_and_chat_cleanup.sql"))).toBe(
      true
    );
    expect(folder).toEndWith("/server/database/migrations");
  });
});
