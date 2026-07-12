#!/usr/bin/env bun
/**
 * Draft release notes from git log + optional GitHub issues.
 * Usage: bun scripts/collect-release-notes.ts v1.1.0 [--write]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SECTION_BY_TYPE: Record<string, string> = {
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

type CommitInfo = {
  hash: string;
  subject: string;
  body: string;
  type: string;
  scope?: string;
  description: string;
  issueIds: number[];
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
  const output = tryRun(["git", "describe", "--tags", "--abbrev=0"]);
  return output || null;
}

function parseConventionalCommit(subject: string, body: string): CommitInfo {
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
  const issueIds = [
    ...subject.matchAll(/#(\d+)/g),
    ...body.matchAll(/#(\d+)/g),
    ...body.matchAll(/Closes\s+#(\d+)/gi),
  ].map((m) => Number.parseInt(m[1]!, 10));

  if (!match) {
    return {
      hash: "",
      subject,
      body,
      type: "chore",
      description: subject,
      issueIds: [...new Set(issueIds)],
    };
  }

  return {
    hash: "",
    subject,
    body,
    type: match[1]!.toLowerCase(),
    scope: match[2],
    description: match[3]!.trim(),
    issueIds: [...new Set(issueIds)],
  };
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

async function fetchIssueSummary(issueId: number): Promise<string | null> {
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
    return issue.title;
  } catch {
    return null;
  }
}

async function enrichDescription(commit: CommitInfo): Promise<string> {
  let line = commit.description;
  if (commit.scope) {
    line = `**${commit.scope}:** ${line}`;
  }

  if (commit.issueIds.length === 0) {
    return line;
  }

  const issueBits: string[] = [];
  for (const issueId of commit.issueIds.slice(0, 3)) {
    const title = await fetchIssueSummary(issueId);
    if (title) {
      issueBits.push(`#${issueId} — ${title}`);
    } else {
      issueBits.push(`#${issueId}`);
    }
  }

  return `${line} (${issueBits.join("; ")})`;
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
  const logFormat = "%H%x09%s%x09%b";
  const rawLog = run(["git", "log", range, `--pretty=format:${logFormat}`]);

  const commits: CommitInfo[] = rawLog
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, subject, body = ""] = line.split("\t");
      const parsed = parseConventionalCommit(subject ?? line, "");
      parsed.hash = hash ?? "";
      parsed.body = sanitizeCommitBody(body);
      if (parsed.issueIds.length === 0) {
        parsed.issueIds = [
          ...parsed.body.matchAll(/#(\d+)/g),
          ...parsed.body.matchAll(/Closes\s+#(\d+)/gi),
        ].map((m) => Number.parseInt(m[1]!, 10));
        parsed.issueIds = [...new Set(parsed.issueIds)];
      }
      return parsed;
    })
    .filter((commit) => !commit.subject.startsWith("Merge "))
    .filter((commit) => commit.description.length > 0);

  const grouped = new Map<string, string[]>();

  for (const commit of commits) {
    if (["chore", "test", "ci", "build"].includes(commit.type)) {
      continue;
    }
    const section = SECTION_BY_TYPE[commit.type] ?? "Прочее";
    const line = await enrichDescription(commit);
    const items = grouped.get(section) ?? [];
    items.push(line);
    grouped.set(section, items);
  }

  const today = new Date().toISOString().slice(0, 10);
  const sectionOrder = [
    "Добавлено",
    "Исправлено",
    "Безопасность",
    "Производительность",
    "Документация",
    "CI",
    "Сборка",
    "Тесты",
    "Рефакторинг",
    "Служебное",
    "Прочее",
  ];

  const bodyParts: string[] = [];
  for (const section of sectionOrder) {
    const items = grouped.get(section);
    if (!items?.length) {
      continue;
    }
    bodyParts.push(`## ${section}`, "", ...items.map((item) => `- ${item}`), "");
  }

  if (bodyParts.length === 0) {
    bodyParts.push("## Прочее", "", "- Нет пользовательских изменений в этом диапазоне.", "");
  }

  const markdown = `---
version: "${version}"
tag: ${tag}
date: ${today}
---

${bodyParts.join("\n").trim()}
`;

  const outDir = path.join(import.meta.dir, "../data/releases");
  const outFile = path.join(outDir, `${tag}.md`);

  console.log(`# Draft release notes for ${tag}`);
  console.log(`Range: ${range}`);
  console.log(`Commits: ${commits.length}`);
  console.log("---");
  console.log(markdown);

  if (shouldWrite) {
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }
    writeFileSync(outFile, markdown);
    if (loadPackageVersion() !== version) {
      updatePackageVersion(version);
      console.error(`Updated package.json version → ${version}`);
    }
    console.error(`Wrote ${outFile}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
