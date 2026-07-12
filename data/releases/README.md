# User-facing release notes

Markdown **only** for the in-app **Что нового** page (`/release-notes`). One file per published release.

GitHub Release and git tags use the **technical** report in [`.docs/releases/`](../.docs/releases/) — not this folder.

**Do not** put draft or technical content here before `git tag` + publish.

## File naming

`vMAJOR.MINOR.PATCH.md` (e.g. `v1.1.0.md`)

## Content rules

- **Russian**, for workspace admins using the product
- **No** table/column names, API paths, migration files, CI, internal codenames
- Describe **what changed for the user** (bots, rules, moderation, UI)

## Frontmatter

```yaml
---
version: "1.1.0"
tag: v1.1.0
date: 2026-07-12
---
```

## Body sections

`## Добавлено`, `## Исправлено`, `## Производительность` — bullet lists only.

Generated draft: `bun run release:notes vX.Y.Z --write` → **rewrite** to human language before publish.

If the release is tech-only and nothing is user-visible, use the **neutral template** in [`.agents/skills/release/SKILL.md`](../../.agents/skills/release/SKILL.md) — do not leave the file empty and do not copy commit subjects.

Technical report (commits, tag message, GitHub Release) → [`.docs/releases/`](../.docs/releases/).
