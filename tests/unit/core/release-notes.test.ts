import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  loadPaginatedReleaseNotes,
  parseReleaseFrontmatter,
  parseReleaseSections,
} from "../../../server/core/release-notes";

describe("release-notes", () => {
  test("parseReleaseFrontmatter reads yaml header", () => {
    const { meta, body } = parseReleaseFrontmatter(`---
version: "1.2.0"
tag: v1.2.0
date: 2026-07-12
---

## Добавлено

- item
`);

    expect(meta.version).toBe("1.2.0");
    expect(meta.tag).toBe("v1.2.0");
    expect(body).toContain("## Добавлено");
  });

  test("parseReleaseSections groups bullet items", () => {
    const sections = parseReleaseSections(`## Добавлено

- first
- second

## Исправлено

- bug
`);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.items).toEqual(["first", "second"]);
    expect(sections[1]?.title).toBe("Исправлено");
  });

  test("loadPaginatedReleaseNotes paginates markdown files", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "releases-"));
    writeFileSync(
      path.join(dir, "v1.1.0.md"),
      `---
version: "1.1.0"
tag: v1.1.0
date: 2026-07-11
---

## Добавлено

- newer
`
    );
    writeFileSync(
      path.join(dir, "v1.0.0.md"),
      `---
version: "1.0.0"
tag: v1.0.0
date: 2026-07-10
---

## Добавлено

- older
`
    );

    const page1 = loadPaginatedReleaseNotes({
      releasesDir: dir,
      page: 1,
      limit: 1,
    });

    expect(page1.pagination.total).toBe(2);
    expect(page1.items[0]?.tag).toBe("v1.1.0");
  });
});
