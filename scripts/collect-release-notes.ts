#!/usr/bin/env bun
/**
 * Draft release notes:
 * - data/releases/vX.Y.Z.md — Russian, human (app /release-notes only)
 * - .docs/releases/vX.Y.Z_TIMESTAMP.md — English archive with YAML frontmatter
 * - .docs/releases/github-vX.Y.Z.md — English, GitHub Release body (no frontmatter)
 *
 * Usage: bun scripts/collect-release-notes.ts v1.1.0 [--write] [--github-only]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const USER_SECTION_BY_TYPE: Record<string, string> = {
  feat: "Добавлено",
  fix: "Исправлено",
  perf: "Производительность",
};

const TECH_SECTION_BY_TYPE: Record<string, string> = {
  feat: "Added",
  fix: "Fixed",
  perf: "Performance",
  refactor: "Refactoring",
  docs: "Documentation",
  chore: "Chores",
  test: "Tests",
  ci: "CI",
  build: "Build",
};

const TECH_SECTION_ORDER = [
  "Added",
  "Fixed",
  "Performance",
  "Documentation",
  "CI",
  "Build",
  "Tests",
  "Refactoring",
  "Chores",
  "Other",
];

const USER_TYPES = new Set(["feat", "fix", "perf"]);

const CONVENTIONAL_SUBJECT = /^(\w+)(?:\([^)]+\))?!?:\s*.+/;

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

function tagExists(tag: string): boolean {
  return tryRun(["git", "rev-parse", "--verify", `${tag}^{tag}`]) !== null;
}

function getPreviousTag(targetTag: string): string | null {
  const tags = tryRun(["git", "tag", "-l", "v*", "--sort=-version:refname"]);
  if (!tags) {
    return null;
  }

  const list = tags.split("\n").filter(Boolean);
  const index = list.indexOf(targetTag);
  if (index < 0 || index >= list.length - 1) {
    return null;
  }

  return list[index + 1] ?? null;
}

function resolveLogRange(targetTag: string): string {
  if (tagExists(targetTag)) {
    const previousTag = getPreviousTag(targetTag);
    return previousTag ? `${previousTag}..${targetTag}` : targetTag;
  }

  const lastTag = tryRun(["git", "describe", "--tags", "--abbrev=0"]);
  if (lastTag && lastTag !== targetTag) {
    return `${lastTag}..HEAD`;
  }

  return "HEAD";
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

function isConventionalCommit(commit: CommitInfo): boolean {
  return CONVENTIONAL_SUBJECT.test(commit.subject);
}

function isTooTechnicalForUser(text: string): boolean {
  return USER_SKIP_PATTERNS.some((pattern) => pattern.test(text));
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

function loadRepoBase(): string {
  const pkg = JSON.parse(
    readFileSync(path.join(import.meta.dir, "../package.json"), "utf8")
  ) as { repository?: { url?: string } };
  const url =
    pkg.repository?.url ?? "https://github.com/telemodai/app";
  return url.replace(/\.git$/, "");
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

function formatArchiveLine(commit: CommitInfo, issues: IssueSummary[]): string {
  const shortHash = commit.hash.slice(0, 7);
  const scope = commit.scope ? `**${commit.scope}** ` : "";
  const issueSuffix =
    issues.length > 0 ? ` (${issues.map((i) => `#${i.id}`).join(", ")})` : "";
  return `\`${shortHash}\` ${scope}${commit.description}${issueSuffix}`;
}

function formatGitHubLine(
  commit: CommitInfo,
  issues: IssueSummary[],
  repoBase: string
): string {
  const shortHash = commit.hash.slice(0, 7);
  const hashLink = `[\`${shortHash}\`](${repoBase}/commit/${commit.hash})`;
  const scope = commit.scope ? `**${commit.scope}**: ` : "";
  const linkedDescription = commit.description.replace(
    /#(\d+)/g,
    (_, id) => `[#${id}](${repoBase}/issues/${id})`
  );

  const extraIssues = issues
    .filter((issue) => !commit.description.includes(`#${issue.id}`))
    .map((issue) => `[#${issue.id}](${repoBase}/issues/${issue.id})`);

  const refs = extraIssues.length > 0 ? ` (${extraIssues.join(", ")})` : "";
  return `${scope}${linkedDescription} in ${hashLink}${refs}`;
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
  emptyMessage: string,
  headingLevel: 2 | 3 = 2
): string {
  const parts: string[] = [];
  const prefix = "#".repeat(headingLevel);

  for (const section of sectionOrder) {
    const items = grouped.get(section);
    if (!items?.length) {
      continue;
    }
    parts.push(`${prefix} ${section}`, "", ...items.map((item) => `- ${item}`), "");
  }

  if (parts.length === 0) {
    parts.push(`${prefix} Other`, "", `- ${emptyMessage}`, "");
  }

  return parts.join("\n").trim();
}

function buildGitHubReleaseMarkdown(
  version: string,
  date: string,
  grouped: Map<string, string[]>,
  summary: string
): string {
  const body = buildMarkdownBody(
    grouped,
    TECH_SECTION_ORDER,
    "No conventional commits in range.",
    3
  );

  return [
    `## [${version}] - ${date}`,
    "",
    summary,
    "",
    "## What's Changed",
    "",
    body,
  ]
    .join("\n")
    .trim();
}

async function main() {
  const args = process.argv.slice(2);
  const targetTag = args.find((arg) => !arg.startsWith("-"));
  const shouldWrite = args.includes("--write");
  const githubOnly = args.includes("--github-only");

  if (!targetTag) {
    console.error(
      "Usage: bun scripts/collect-release-notes.ts v1.1.0 [--write] [--github-only]"
    );
    process.exit(1);
  }

  const tag = normalizeTag(targetTag);
  const version = versionFromTag(tag);
  const range = resolveLogRange(tag);
  const generatedAt = new Date();
  const date = generatedAt.toISOString().slice(0, 10);
  const repoBase = loadRepoBase();
  const logFormat = "%H%x09%s%x09%b%x1e";
  const rawLog = run(["git", "log", range, `--pretty=format:${logFormat}`]);

  const commits: CommitInfo[] = rawLog
    .split("\x1e")
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, subject, body = ""] = record.split("\t");
      const parsed = parseConventionalCommit(subject ?? record);
      parsed.hash = hash ?? "";
      parsed.body = sanitizeCommitBody(body);
      parsed.issueIds = collectIssueIds(subject ?? "", parsed.body);
      return parsed;
    })
    .filter((commit) => !commit.subject.startsWith("Merge "))
    .filter((commit) => commit.description.length > 0);

  const conventionalCommits = commits.filter(isConventionalCommit);
  const archiveGrouped = new Map<string, string[]>();
  const githubGrouped = new Map<string, string[]>();
  const userGrouped = new Map<string, string[]>();

  for (const commit of conventionalCommits) {
    const issues: IssueSummary[] = [];
    for (const issueId of commit.issueIds.slice(0, 3)) {
      const summary = await fetchIssueSummary(issueId);
      if (summary) {
        issues.push(summary);
      }
    }

    const techSection = TECH_SECTION_BY_TYPE[commit.type] ?? "Other";
    const archiveLine = formatArchiveLine(commit, issues);
    const archiveItems = archiveGrouped.get(techSection) ?? [];
    archiveItems.push(archiveLine);
    archiveGrouped.set(techSection, archiveItems);

    const githubLine = formatGitHubLine(commit, issues, repoBase);
    const githubItems = githubGrouped.get(techSection) ?? [];
    githubItems.push(githubLine);
    githubGrouped.set(techSection, githubItems);

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

  const userSectionOrder = ["Добавлено", "Исправлено", "Производительность"];

  const archiveBody = buildMarkdownBody(
    archiveGrouped,
    TECH_SECTION_ORDER,
    "No conventional commits in range."
  );
  const githubSummary =
    conventionalCommits.length === commits.length
      ? `Self-hosted Telegram AI moderation admin — **${conventionalCommits.length}** commits.`
      : `Self-hosted Telegram AI moderation admin — **${conventionalCommits.length}** conventional commits (${commits.length} total).`;

  const githubMarkdown = buildGitHubReleaseMarkdown(
    version,
    date,
    githubGrouped,
    githubSummary
  );

  const archiveMarkdown = `---
version: "${version}"
tag: ${tag}
date: ${date}
generated_at: ${generatedAt.toISOString()}
range: ${range}
commits_total: ${commits.length}
commits_conventional: ${conventionalCommits.length}
---

${archiveBody}
`;

  const userBody = buildMarkdownBody(
    userGrouped,
    userSectionOrder,
    "Нет изменений, заметных пользователю — отредактируйте вручную или отложите релиз."
  );

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
  const githubFile = path.join(techDir, `github-${tag}.md`);
  const userDir = path.join(import.meta.dir, "../data/releases");
  const userFile = path.join(userDir, `${tag}.md`);

  console.log(`# Release draft for ${tag}`);
  console.log(`Range: ${range} (${conventionalCommits.length} conventional / ${commits.length} total)`);
  console.log("\n## USER (data/releases) — Russian, edit before publish\n");
  console.log(userMarkdown);
  console.log("\n## GITHUB (.docs/releases/github-vX.Y.Z.md) — English\n");
  console.log(githubMarkdown);
  console.log("\n## ARCHIVE (.docs/releases) — English + frontmatter\n");
  console.log(archiveMarkdown);

  if (shouldWrite || githubOnly) {
    mkdirSync(techDir, { recursive: true });

    if (!githubOnly) {
      writeFileSync(techFile, archiveMarkdown);
      mkdirSync(userDir, { recursive: true });
      if (!existsSync(userFile)) {
        writeFileSync(userFile, userMarkdown);
      } else {
        console.error(`Skipped user draft (exists): ${userFile}`);
      }
      if (loadPackageVersion() !== version) {
        updatePackageVersion(version);
        console.error(`Updated package.json version → ${version}`);
      }
      console.error(`Wrote archive: ${techFile}`);
      console.error(`Wrote user draft: ${userFile}`);
    }

    writeFileSync(githubFile, githubMarkdown);
    console.error(`Wrote GitHub release notes: ${githubFile}`);
    console.error("Publish: gh release create/edit … --notes-file .docs/releases/github-vX.Y.Z.md");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
