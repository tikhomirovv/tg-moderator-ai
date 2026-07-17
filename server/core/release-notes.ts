import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type ReleaseNoteSection = {
  title: string;
  items: string[];
};

export type ReleaseNote = {
  version: string;
  tag: string;
  date: string;
  sections: ReleaseNoteSection[];
  bodyMarkdown: string;
  githubReleaseUrl: string;
};

export type PaginatedReleaseNotes = {
  items: ReleaseNote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

const REPO_RELEASE_BASE =
  "https://github.com/telemodai/app/releases/tag";

/** Release markdown files live in repo root — not next to bundled Nitro output. */
export const RELEASES_DIR = "data/releases";

export function resolveReleasesDirectory(rootDir?: string): string {
  return path.join(rootDir ?? process.cwd(), RELEASES_DIR);
}

export function parseReleaseFrontmatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: raw.trim() };
  }

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    meta[key] = value;
  }

  return { meta, body: match[2].trim() };
}

export function parseReleaseSections(body: string): ReleaseNoteSection[] {
  const sections: ReleaseNoteSection[] = [];
  const lines = body.split("\n");
  let current: ReleaseNoteSection | null = null;

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      if (current && current.items.length > 0) {
        sections.push(current);
      }
      current = { title: heading[1]!.trim(), items: [] };
      continue;
    }

    const item = line.match(/^-\s+(.+)$/);
    if (item && current) {
      current.items.push(item[1]!.trim());
    }
  }

  if (current && current.items.length > 0) {
    sections.push(current);
  }

  return sections;
}

export function parseReleaseFile(filePath: string): ReleaseNote {
  const raw = readFileSync(filePath, "utf8");
  const { meta, body } = parseReleaseFrontmatter(raw);
  const version = meta.version ?? path.basename(filePath, ".md");
  const tag = meta.tag ?? `v${version}`;
  const date = meta.date ?? new Date().toISOString().slice(0, 10);

  return {
    version,
    tag,
    date,
    sections: parseReleaseSections(body),
    bodyMarkdown: body,
    githubReleaseUrl: `${REPO_RELEASE_BASE}/${tag}`,
  };
}

export function listReleaseFiles(releasesDir: string): string[] {
  if (!existsSync(releasesDir)) {
    return [];
  }

  return readdirSync(releasesDir)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .sort((a, b) => {
      const av = a.replace(/^v/, "").replace(/\.md$/, "");
      const bv = b.replace(/^v/, "").replace(/\.md$/, "");
      return compareVersions(bv, av);
    });
}

export function loadPaginatedReleaseNotes(options: {
  page?: number;
  limit?: number;
  releasesDir?: string;
}): PaginatedReleaseNotes {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(10, Math.max(1, options.limit ?? 5));
  const releasesDir = options.releasesDir ?? resolveReleasesDirectory();
  const files = listReleaseFiles(releasesDir);

  const all = files.map((file) =>
    parseReleaseFile(path.join(releasesDir, file))
  );

  const total = all.length;
  const offset = (page - 1) * limit;

  return {
    items: all.slice(offset, offset + limit),
    pagination: {
      page,
      limit,
      total,
      total_pages: total > 0 ? Math.ceil(total / limit) : 1,
    },
  };
}

function compareVersions(a: string, b: string): number {
  const ap = a.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const bp = b.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const len = Math.max(ap.length, bp.length);

  for (let i = 0; i < len; i++) {
    const diff = (ap[i] ?? 0) - (bp[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}
