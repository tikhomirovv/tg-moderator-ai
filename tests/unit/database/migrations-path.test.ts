import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { resolveMigrationsFolder } from "../../../server/database/migrations-path";

describe("resolveMigrationsFolder", () => {
  test("finds meta/_journal.json from project root", () => {
    const folder = resolveMigrationsFolder();
    expect(existsSync(path.join(folder, "meta/_journal.json"))).toBe(true);
    expect(existsSync(path.join(folder, "0000_init.sql"))).toBe(true);
    expect(folder).toEndWith("/server/database/migrations");
  });

  test("journal lists incremental migrations", () => {
    const folder = resolveMigrationsFolder();
    const journal = JSON.parse(
      readFileSync(path.join(folder, "meta/_journal.json"), "utf8")
    ) as { entries: Array<{ tag: string }> };

    expect(journal.entries.length).toBeGreaterThanOrEqual(3);
    expect(journal.entries[0]?.tag).toBe("0000_init");
    expect(existsSync(path.join(folder, "0001_strong_otto_octavius.sql"))).toBe(
      true
    );
    expect(existsSync(path.join(folder, "0002_productive_starhawk.sql"))).toBe(
      true
    );
    expect(existsSync(path.join(folder, "0004_freezing_kang.sql"))).toBe(true);
    expect(existsSync(path.join(folder, "0005_normal_whiplash.sql"))).toBe(true);
  });
});
