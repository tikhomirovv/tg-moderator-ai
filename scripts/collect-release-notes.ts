#!/usr/bin/env bun
/**
 * Draft release notes: technical report (tag, GitHub Release, .docs/releases)
 * + user-facing summary (app /release-notes only).
 * Usage: bun scripts/collect-release-notes.ts v1.1.0 [--write]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const USER_SECTION_BY_TYPE: Record<string, string> = {
  feat: "Добавлено",
  fix: "Исправлено",
  perf: "Производительность",
};

const TECH_SECTION_BY_TYPE: Record<string, string> = {
  feat: "Добавлено",
  fix: "Исправлено",
  perf: "Производительность",
  refactor: "Рефакторинг",
  docs: "Документация",
  chore: "Служебное",
  test: "Тесты",
  ci: "CI",
  build: "Сборка",
};

const USER_TYPES = new Set(["feat", "fix", "perf"]);

/** Skip commit descriptions that read like dev notes, not product copy. */
const USER_SKIP_PATTERNS = [
  /\//,
  /\.(vue|ts|js|md)\b/i,
  /\[.*\]/,
  /\b(API|import|Drizzle|Nitro|SSR|GHCR|Docker|CI|schema|migration)\b/i,
  /\b(GET|POST|PUT|DELETE)\s+\//i,
  /\bvia\s+\S+\.(vue|ts)/i,
  /\bcorrect\b/i,
  /\balign\b/i,
  /\bresolve\b/i,
  /\bpath(s)?\b/i,
];

function isTooTechnicalForUser(text: string): boolean {
  return USER_SKIP_PATTERNS.some((pattern) => pattern.test(text));
}

type CommitInfo = {
  hash: string;
  subject: string;
  body: string;
  type: string;
  scope?: string;
  description: string;
  issueIds: number[];
};

type IssueSummary = {
  id: number;
  title: string;
};

function run(command: string[]): string {
  const proc = Bun.spawnSync({
    cmd: command,
    stdout: "pipe",
    stderr: "pipe",
  });

  if (proc.exitCode !== 0) {
    const err = new TextDecoder().decode(proc.stderr);
    throw new Error(`Command failed: ${command.join(" ")}\n${err}`);
  }

  return new TextDecoder().decode(proc.stdout).trim();
}

function tryRun(command: string[]): string | null {
  try {
    return run(command);
  } catch {
    return null;
  }
}

function normalizeTag(tag: string): string {
  return tag.startsWith("v") ? tag : `v${tag}`;
}

function versionFromTag(tag: string): string {
  return normalizeTag(tag).replace(/^v/, "");
}

function sanitizeCommitBody(body: string): string {
  return body
    .split("\n")
    .filter((line) => !line.startsWith("Co-authored-by:"))
    .join("\n")
    .trim();
}

function getLastTag(): string | null {
  return tryRun(["git", "describe", "--tags", "--abbrev=0"]);
}

function parseConventionalCommit(subject: string): CommitInfo {
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);

  if (!match) {
    return {
      hash: "",
      subject,
      body: "",
      type: "chore",
      description: subject,
      issueIds: [],
    };
  }

  return {
    hash: "",
    subject,
    body: "",
    type: match[1]!.toLowerCase(),
    scope: match[2],
    description: match[3]!.trim(),
    issueIds: [],
  };
}

function collectIssueIds(subject: string, body: string): number[] {
  return [
    ...new Set(
      [...subject.matchAll(/#(\d+)/g), ...body.matchAll(/#(\d+)/g)]
        .map((m) => Number.parseInt(m[1]!, 10))
        .filter((id) => Number.isFinite(id))
    ),
  ];
}

function loadPackageVersion(): string {
  const pkg = JSON.parse(
    readFileSync(path.join(import.meta.dir, "../package.json"), "utf8")
  ) as { version: string };
  return pkg.version;
}

function updatePackageVersion(version: string): void {
  const pkgPath = path.join(import.meta.dir, "../package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
    version: string;
    [key: string]: unknown;
  };
  pkg.version = version;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function formatTimestampForFilename(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function fetchIssueSummary(issueId: number): Promise<IssueSummary | null> {
  const json = tryRun([
    "gh",
    "issue",
    "view",
    String(issueId),
    "--json",
    "title,state",
  ]);
  if (!json) {
    return null;
  }

  try {
    const issue = JSON.parse(json) as { title: string; state: string };
    if (issue.state !== "CLOSED") {
      return null;
    }
    return { id: issueId, title: issue.title };
  } catch {
    return null;
  }
}

function formatTechnicalLine(
  commit: CommitInfo,
  issues: IssueSummary[]
): string {
  const shortHash = commit.hash.slice(0, 7);
  const scope = commit.scope ? `**${commit.scope}** ` : "";
  const issueSuffix =
    issues.length > 0
      ? ` (${issues.map((i) => `#${i.id} — ${i.title}`).join("; ")})`
      : "";
  return `\`${shortHash}\` ${scope}${commit.description}${issueSuffix}`;
}

function humanizeForUser(
  commit: CommitInfo,
  issues: IssueSummary[]
): string | null {
  if (!USER_TYPES.has(commit.type)) {
    return null;
  }

  if (issues.length > 0) {
    return issues[0]!.title;
  }

  let text = commit.description
    .replace(/`/g, "")
    .replace(/\b(GET|POST|PUT|DELETE)\s+\/api\/\S+/gi, "")
    .replace(/\b[a-z_]+_[a-z_]+\b/g, (word) => {
      if (word.includes("_") && word.length > 12) {
        return "";
      }
      return word;
    })
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!text || text.length < 4 || isTooTechnicalForUser(text)) {
    return null;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildMarkdownBody(
  grouped: Map<string, string[]>,
  sectionOrder: string[],
  emptyMessage: string
): string {
  const parts: string[] = [];

  for (const section of sectionOrder) {
    const items = grouped.get(section);
    if (!items?.length) {
      continue;
    }
    parts.push(`## ${section}`, "", ...items.map((item) => `- ${item}`), "");
  }

  if (parts.length === 0) {
    parts.push(`## Прочее`, "", `- ${emptyMessage}`, "");
  }

  return parts.join("\n").trim();
}

async function main() {
  const args = process.argv.slice(2);
  const targetTag = args.find((arg) => !arg.startsWith("-"));
  const shouldWrite = args.includes("--write");

  if (!targetTag) {
    console.error("Usage: bun scripts/collect-release-notes.ts v1.1.0 [--write]");
    process.exit(1);
  }

  const tag = normalizeTag(targetTag);
  const version = versionFromTag(tag);
  const lastTag = getLastTag();
  const range = lastTag ? `${lastTag}..HEAD` : "HEAD";
  const generatedAt = new Date();
  const date = generatedAt.toISOString().slice(0, 10);
  const logFormat = "%H%x09%s%x09%b%x1e";
  const rawLog = run(["git", "log", range, `--pretty=format:${logFormat}`]);

  const commits: CommitInfo[] = rawLog
    .split("\x1e")
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, subject, body = ""] = record.split("\t");
      const parsed = parseConventionalCommit(subject ?? line);
      parsed.hash = hash ?? "";
      parsed.body = sanitizeCommitBody(body);
      parsed.issueIds = collectIssueIds(subject ?? "", parsed.body);
      return parsed;
    })
    .filter((commit) => !commit.subject.startsWith("Merge "))
    .filter((commit) => commit.description.length > 0);

  const technicalGrouped = new Map<string, string[]>();
  const userGrouped = new Map<string, string[]>();

  for (const commit of commits) {
    const issues: IssueSummary[] = [];
    for (const issueId of commit.issueIds.slice(0, 3)) {
      const summary = await fetchIssueSummary(issueId);
      if (summary) {
        issues.push(summary);
      }
    }

    const techSection = TECH_SECTION_BY_TYPE[commit.type] ?? "Прочее";
    const techLine = formatTechnicalLine(commit, issues);
    const techItems = technicalGrouped.get(techSection) ?? [];
    techItems.push(techLine);
    technicalGrouped.set(techSection, techItems);

    const userLine = humanizeForUser(commit, issues);
    if (userLine) {
      const userSection = USER_SECTION_BY_TYPE[commit.type] ?? "Прочее";
      const userItems = userGrouped.get(userSection) ?? [];
      if (!userItems.includes(userLine)) {
        userItems.push(userLine);
      }
      userGrouped.set(userSection, userItems);
    }
  }

  const techSectionOrder = [
    "Добавлено",
    "Исправлено",
    "Производительность",
    "Документация",
    "CI",
    "Сборка",
    "Тесты",
    "Рефакторинг",
    "Служебное",
    "Прочее",
  ];
  const userSectionOrder = ["Добавлено", "Исправлено", "Производительность"];

  const technicalBody = buildMarkdownBody(
    technicalGrouped,
    techSectionOrder,
    "Нет коммитов в диапазоне."
  );
  const userBody = buildMarkdownBody(
    userGrouped,
    userSectionOrder,
    "Нет изменений, заметных пользователю — отредактируйте вручную или отложите релиз."
  );

  const technicalMarkdown = `---
version: "${version}"
tag: ${tag}
date: ${date}
generated_at: ${generatedAt.toISOString()}
range: ${range}
commits: ${commits.length}
---

${technicalBody}
`;

  const userMarkdown = `---
version: "${version}"
tag: ${tag}
date: ${date}
---

${userBody}
`;

  const techDir = path.join(import.meta.dir, "../.docs/releases");
  const techFile = path.join(
    techDir,
    `${tag}_${formatTimestampForFilename(generatedAt)}.md`
  );
  const userDir = path.join(import.meta.dir, "../data/releases");
  const userFile = path.join(userDir, `${tag}.md`);

  console.log(`# Release draft for ${tag}`);
  console.log(`Range: ${range} (${commits.length} commits)`);
  console.log("\n## USER (data/releases) — edit before publish\n");
  console.log(userMarkdown);
  console.log("\n## TECHNICAL (.docs/releases) — archive\n");
  console.log(technicalMarkdown);

  if (shouldWrite) {
    mkdirSync(techDir, { recursive: true });
    mkdirSync(userDir, { recursive: true });
    writeFileSync(techFile, technicalMarkdown);
    if (!existsSync(userFile)) {
      writeFileSync(userFile, userMarkdown);
    } else {
      console.error(`Skipped user draft (exists): ${userFile}`);
    }
    if (loadPackageVersion() !== version) {
      updatePackageVersion(version);
      console.error(`Updated package.json version → ${version}`);
    }
    console.error(`Wrote technical: ${techFile}`);
    console.error(`Wrote user draft: ${userFile}`);
    console.error("Edit data/releases file for end users before tagging.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
