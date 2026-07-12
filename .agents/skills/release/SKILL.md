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
| **Developers** — repo archive, **git tag message**, **GitHub Release body** | `.docs/releases/vX.Y.Z_TIMESTAMP.md` (archive), `.docs/releases/github-vX.Y.Z.md` (GitHub) | **English only** — Keep a Changelog style, linked commits/issues, **no YAML frontmatter** on GitHub |

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

- `.docs/releases/vX.Y.Z_<UTC-timestamp>.md` — English archive (YAML frontmatter + commit list)
- `.docs/releases/github-vX.Y.Z.md` — **GitHub Release body** (English, rendered markdown, no frontmatter)
- `data/releases/vX.Y.Z.md` — **user draft** (Russian; feat/fix/perf only)

`--github-only` regenerates `github-vX.Y.Z.md` for an existing tag (e.g. fix release formatting).

**Language rule:** Russian → app (`data/releases/`) only. English → archive, GitHub Release, git tag annotation.

**Mandatory:** rewrite `data/releases/vX.Y.Z.md` with the user. Never publish the auto-generated user draft as-is.

Archive file: commit as-is. GitHub file: use for `gh release create/edit` — **not** the archive file.

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

### Tech-only release — neutral user text

Use when **all commits are internal** (chore, ci, refactor, docs, test, build) or after review there is **nothing honest and specific** to tell a chat admin — no new screens, flows, or visible behavior.

**Still publish** `data/releases/vX.Y.Z.md`. Empty or missing user notes are worse than a short neutral entry: admins see that the version exists and that updating is worthwhile.

**Do not** invent features, screens, or fixes that are not in the release. **Do not** mention refactoring, CI, migrations, or “technical work”.

Pick **2–3 bullets** from the templates below (adjust wording slightly if needed; keep tone calm and informative):

| Focus | Example bullet (Russian) |
|-------|--------------------------|
| Stability | Повышена стабильность и надёжность работы приложения |
| Bugfixes (generic) | Исправлены ошибки, которые могли мешать повседневной работе с ботами и правилами |
| Performance | Улучшена скорость отклика интерфейса и обработки сообщений |
| Moderation reliability | Модерация чатов работает стабильнее за счёт внутренних улучшений |
| Maintenance | Обновление содержит накопленные исправления и улучшения для более комфортной работы |

**Default template** (patch / maintenance release — use when unsure):

```markdown
---
version: "1.0.1"
tag: v1.0.1
date: 2026-07-12
---

## Исправлено

- Исправлены ошибки и повышена стабильность работы приложения

## Производительность

- Оптимизирована работа интерфейса и фоновых процессов модерации
```

- Omit **Добавлено** if there are no new user-visible capabilities.
- Omit **Производительность** if the release has no perf-related work at all — one bullet under **Исправлено** is enough.
- For a **security-hardening** release with no UI change, you may add under **Исправлено**: «Усилена защита подключения ботов и обработки входящих сообщений» — only when security work is actually in the tag range.

Technical detail stays in `.docs/releases/` and GitHub Release; the app page stays short and non-technical.

Confirm with the user: «Для интерфейса заметных изменений нет — публикуем нейтральное описание?» unless the answer is already obvious from the commit list.

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

Set `GITHUB=.docs/releases/github-vX.Y.Z.md` from `--write` (or `--github-only` to refresh).

```bash
git add package.json data/releases/vX.Y.Z.md .docs/releases/
git commit -m "chore(release): vX.Y.Z"
git push origin master
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
gh release create vX.Y.Z --title "vX.Y.Z" --notes-file "$GITHUB"
```

- **GitHub Release** → `$GITHUB` (English, `## [version] - date`, `### Added/Fixed/…`, linked commits)
- **Git tag** → one-line message (`Release vX.Y.Z`); full changelog lives on GitHub + archive
- **App** `/release-notes` → `data/releases/vX.Y.Z.md` only (Russian, human)

**Do not** pass the archive file (`vX.Y.Z_TIMESTAMP.md`) to `gh release` — it contains YAML frontmatter that GitHub renders as ugly plain text.

**Do not** add a “Full Changelog” / “Compare changes” footer to `$GITHUB` — GitHub may show its own compare UI when a previous release exists; we do not duplicate it in notes.

## CI

Tag `v*` → [`.github/workflows/docker-publish.yml`](../../.github/workflows/docker-publish.yml) → GHCR image.

## Checklist

- [ ] User confirmed tag `vX.Y.Z`
- [ ] English archive in `.docs/releases/vX.Y.Z_*.md`
- [ ] English `github-vX.Y.Z.md` for GitHub Release
- [ ] User `data/releases/vX.Y.Z.md` — **human Russian** or agreed **neutral template** (tech-only releases)
- [ ] `package.json` version matches
- [ ] Commit includes both markdown paths
- [ ] Annotated tag `vX.Y.Z` (short one-line message)
- [ ] Tag pushed → CI started
- [ ] `gh release create` with **`$GITHUB`** (not archive file)

## Do not

- Put unreleased versions in `data/releases/` (empty page until first publish)
- Publish auto-generated user draft without rewriting (use neutral template instead when nothing user-visible)
- Put SQL, Drizzle, Nitro, API paths, or issue numbers in **app** user notes (`data/releases/`)
- Use human `data/releases/` text or archive frontmatter file for GitHub Release
- Tag without user-confirmed version
- Use `db:reset` as part of release

## References

- UI: `/release-notes` (link: sidebar version `v…`)
- User data: [`data/releases/README.md`](../../data/releases/README.md)
- Technical: [`.docs/releases/README.md`](../../.docs/releases/README.md)
- Deploy: [`.docs/deploy.md`](../../.docs/deploy.md)
