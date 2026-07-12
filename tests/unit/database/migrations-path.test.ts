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

  test("journal includes init migration", () => {
    const folder = resolveMigrationsFolder();
    const journal = JSON.parse(
      readFileSync(path.join(folder, "meta/_journal.json"), "utf8")
    ) as { entries: Array<{ tag: string }> };

    expect(journal.entries.length).toBeGreaterThanOrEqual(1);
    expect(journal.entries.some((e) => e.tag === "0000_init")).toBe(true);
  });
});
