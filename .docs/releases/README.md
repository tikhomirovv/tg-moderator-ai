# Technical release reports

Full changelog for developers. **Not** shown in the app UI.

**Same content** goes to:

- this folder (repo archive)
- **annotated git tag** message (`git tag -a … -F …`)
- **GitHub Release** body (`gh release create --notes-file …`)

## File naming

`vVERSION_TIMESTAMP.md` — e.g. `v1.1.0_20260712T103045Z.md`

- `VERSION` — release tag (`v1.1.0`)
- `TIMESTAMP` — UTC ISO compact at generation time

## Content

- All commits since previous tag (including chore, ci, test, refactor)
- Conventional commit type, scope, short hash
- Linked GitHub issues (`#N — title`) when `gh` is available
- Git range and commit count in frontmatter

## Generation

```bash
bun run release:notes v1.1.0 --write
```

Writes:

1. **This folder** — technical report (also used for tag + GitHub Release)
2. **`data/releases/v1.1.0.md`** — draft for **app** `/release-notes` only (rewrite to human Russian before publish)
