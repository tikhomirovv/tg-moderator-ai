---
name: release
description: Prepare and publish a tg-moderator-ai release — human notes for app UI, technical report for .docs/releases, git tag, and GitHub Release. Use when the user asks to собрать релиз, сделать релиз, подготовить релиз, publish release, or cut a version.
---

# Release workflow

End-to-end release for **tg-moderator-ai**. Language: **Russian**.

## Two outputs (never mix)

| Audience | Where | Content |
|----------|-------|---------|
| **Users** — app only (`/release-notes`) | `data/releases/vX.Y.Z.md` | **Human Russian** — product changes only; no APIs, tables, migrations, CI |
| **Developers** — repo archive, **git tag message**, **GitHub Release body** | `.docs/releases/vX.Y.Z_TIMESTAMP.md` | Full technical report: all commit types, scopes, hashes, issues, metadata |

`data/releases/` files appear **only when a release is published** — do not seed fake versions.

## Before anything

1. `git checkout master && git pull --ff-only`
2. **Ask the user for the target tag** (e.g. `v1.1.0`). Do not guess.
3. Tag format: `v` + semver. `package.json` `version` = tag without `v`.

## Collect drafts

```bash
bun scripts/collect-release-notes.ts vX.Y.Z        # stdout: user + technical
bun scripts/collect-release-notes.ts vX.Y.Z --write
```

`--write` creates:

- `.docs/releases/vX.Y.Z_<UTC-timestamp>.md` — technical (all commit types, `gh issue` titles)
- `data/releases/vX.Y.Z.md` — **user draft** (feat/fix/perf only; prefers issue titles)

**Mandatory:** rewrite `data/releases/vX.Y.Z.md` with the user. The script output is a **starting point only** — never publish it as-is.

Technical file: commit as-is (or minor fixes).

### Human language for users (critical)

**Audience:** workspace admin who moderates Telegram chats — not a developer. They care about *what they can do now* and *what works better*, not how it was built.

**Write like this:**

- Full Russian sentences or short clear phrases a non-technical person understands
- Product outcomes: «Можно пригласить коллегу в workspace по email», «На дашборде видна статистика модерации»
- Benefits in plain words: faster, clearer, fixed annoying bug

**Never in user-facing notes:**

- Commit subjects, English dev-speak, file paths (`index.vue`, `decisions.get.ts`)
- Internal names: Drizzle, Nitro, Better Auth, GHCR, webhook_secret, `moderation_decisions`
- API routes, SQL, migrations, CI/Docker, issue numbers (`#58`)
- Vague infra lines: «align import paths», «schema reset», «fix SSR session»

**Bad → good examples:**

| Bad (technical) | Good (human) |
|-----------------|--------------|
| Moderation audit decisions table and UI | Можно просматривать, какие решения приняла модель по каждому сообщению |
| Open bot audit page via [id]/index.vue | Страница аудита бота открывается корректно |
| JSON chat history in LLM prompt and 100-msg retention | Бот учитывает больше контекста переписки при проверке сообщений |
| Map Better Auth errors to friendly UI messages | Понятные сообщения об ошибках при входе и регистрации |

Before publish, every bullet must pass: **«Поймёт ли это админ чата без знания кода?»** If not — rewrite or drop.

Merge duplicate ideas; group related changes; prefer 3–8 strong bullets over 30 raw commits.

## User-facing file format

`data/releases/vX.Y.Z.md`:

```markdown
---
version: "1.1.0"
tag: v1.1.0
date: 2026-07-12
---

## Добавлено

- Можно смотреть аудит решений модели по каждому сообщению

## Исправлено

- Исправлено переключение workspace на странице бота
```

Allowed sections: **Добавлено**, **Исправлено**, **Производительность** only.

## Publish (after user approves **human** app notes)

Set `TECH=.docs/releases/vX.Y.Z_<timestamp>.md` to the file from `--write`.

```bash
git add package.json data/releases/vX.Y.Z.md .docs/releases/vX.Y.Z_*.md
git commit -m "chore(release): vX.Y.Z"
git push origin master
git tag -a vX.Y.Z -F "$TECH"
git push origin vX.Y.Z
gh release create vX.Y.Z --title "vX.Y.Z" --notes-file "$TECH"
```

- **Git tag** (annotated) and **GitHub Release** → technical file (`$TECH`) — commits, scopes, issues, full detail
- **App** `/release-notes` → `data/releases/vX.Y.Z.md` only — rewritten human Russian

Frontmatter in `$TECH` is fine on GitHub (version, range, commit count).

## CI

Tag `v*` → [`.github/workflows/docker-publish.yml`](../../.github/workflows/docker-publish.yml) → GHCR image.

## Checklist

- [ ] User confirmed tag `vX.Y.Z`
- [ ] Technical report in `.docs/releases/` (source for tag + GitHub Release)
- [ ] User `data/releases/vX.Y.Z.md` rewritten in **human Russian** — app UI only
- [ ] `package.json` version matches
- [ ] Commit includes both markdown paths
- [ ] Annotated tag `vX.Y.Z` with **technical** notes
- [ ] Tag pushed → CI started
- [ ] `gh release create` with **technical** notes (`$TECH`)

## Do not

- Put unreleased versions in `data/releases/` (empty page until first publish)
- Publish auto-generated user draft without rewriting into human language
- Put SQL, Drizzle, Nitro, API paths, or issue numbers in **app** user notes (`data/releases/`)
- Use human `data/releases/` text for git tag or GitHub Release
- Tag without user-confirmed version
- Use `db:reset` as part of release

## References

- UI: `/release-notes` (link: sidebar version `v…`)
- User data: [`data/releases/README.md`](../../data/releases/README.md)
- Technical: [`.docs/releases/README.md`](../../.docs/releases/README.md)
- Deploy: [`.docs/deploy.md`](../../.docs/deploy.md)
