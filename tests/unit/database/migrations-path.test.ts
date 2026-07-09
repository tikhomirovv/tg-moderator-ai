import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";
import { resolveMigrationsFolder } from "../../../server/database/migrations-path";

describe("resolveMigrationsFolder", () => {
  test("finds meta/_journal.json from project root", () => {
    const folder = resolveMigrationsFolder();
    expect(existsSync(path.join(folder, "meta/_journal.json"))).toBe(true);
    expect(folder.endsWith("server/database/migrations")).toBe(true);
  });
});
