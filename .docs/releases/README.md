# Technical release reports

English changelog for developers. **Not** shown in the app UI.

## Files per release

| File | Purpose |
|------|---------|
| `vVERSION_TIMESTAMP.md` | Repo archive — YAML frontmatter + English commit list |
| `github-vVERSION.md` | **GitHub Release** body — rendered markdown, no frontmatter |

Russian text → `data/releases/` (app only).

## GitHub format (`github-vX.Y.Z.md`)

Keep a Changelog style — no YAML, no “Compare changes” footer:

```markdown
## [1.0.0] - 2026-07-12

Short English summary.

## What's Changed

### Added
- **auth**: password reset UI in [`0c6899c`](https://github.com/…/commit/…) ([#28](https://github.com/…/issues/28))
```

## Generation

```bash
bun run release:notes v1.1.0 --write          # archive + github + user draft
bun run release:notes v1.0.0 --github-only --write   # refresh GitHub file only
```

Publish:

```bash
gh release create v1.1.0 --notes-file .docs/releases/github-v1.1.0.md
```

User-facing Russian notes → `data/releases/v1.1.0.md` (edit before publish).
