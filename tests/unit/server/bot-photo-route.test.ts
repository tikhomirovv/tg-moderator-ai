import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";

const BOTS_API_DIR = path.resolve(import.meta.dir, "../../../server/api/bots");

describe("bot photo API route", () => {
  test("photo proxy handler lives beside bot detail route", () => {
    expect(existsSync(path.join(BOTS_API_DIR, "[id]/photo.get.ts"))).toBe(true);
  });
});
