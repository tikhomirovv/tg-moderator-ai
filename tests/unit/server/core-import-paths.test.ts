import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const CORE_ROOT = path.resolve(import.meta.dir, "../../../server/core");
const RELATIVE_IMPORT_RE = /from\s+["'](\.[^"']+)["']/g;

function collectTsFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...collectTsFiles(fullPath));
      continue;
    }

    if (entry.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function resolveImport(fromFile: string, importPath: string): string | null {
  const resolved = path.resolve(path.dirname(fromFile), importPath);
  const candidates = [
    resolved,
    `${resolved}.ts`,
    path.join(resolved, "index.ts"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

describe("server/core import paths", () => {
  test("relative imports resolve to existing files", () => {
    const failures: string[] = [];

    for (const file of collectTsFiles(CORE_ROOT)) {
      const content = readFileSync(file, "utf8");

      for (const match of content.matchAll(RELATIVE_IMPORT_RE)) {
        const importPath = match[1];
        if (!importPath) {
          continue;
        }

        if (!resolveImport(file, importPath)) {
          failures.push(`${path.relative(CORE_ROOT, file)} -> ${importPath}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
