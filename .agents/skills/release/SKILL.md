---
name: release
description: Prepare and publish a tg-moderator-ai release from master — changelog markdown, package.json version, git tag, GitHub Release, Docker CI. Use when the user asks to собрать релиз, сделать релиз, подготовить релиз, publish release, or cut a version.
---

# Release workflow

End-to-end release for **tg-moderator-ai**. Language: **Russian** release notes.

## Before anything

1. `git checkout master && git pull --ff-only` — clean, up-to-date master.
2. **Ask the user for the target tag** (e.g. `v1.1.0`). Do not guess or auto-bump without confirmation.
3. Normalize tag: must start with `v` (`v1.1.0`). Version for `package.json` = tag without `v`.

`package.json` `version` is the source of truth — sync it to match the user-confirmed tag before tagging.

## Collect changes

```bash
bun scripts/collect-release-notes.ts vX.Y.Z        # draft to stdout
bun scripts/collect-release-notes.ts vX.Y.Z --write  # write data/releases/vX.Y.Z.md + package.json
```

Script behaviour:
- Commits since last git tag → grouped by Conventional Commits (`feat` → **Добавлено**, `fix` → **Исправлено**, …)
- Skips `chore`, `test`, `ci`, `build` in user-facing notes
- If `gh` available: enriches lines with closed issue titles (`#N — title`)

**Review and edit** `data/releases/vX.Y.Z.md` with the user — curated prose beats raw commit dump.

## File format

Path: `data/releases/vX.Y.Z.md`

```markdown
---
version: "1.1.0"
tag: v1.1.0
date: 2026-07-12
---

## Добавлено

- Краткое описание на русском

## Исправлено

- …
```

Consumed by `/release-notes` (paginated UI) and GitHub Release body.

## Publish (after user approves draft)

On branch `master` (or release commit on master):

```bash
git add package.json data/releases/vX.Y.Z.md
git commit -m "chore(release): vX.Y.Z"
git push origin master
git tag vX.Y.Z
git push origin vX.Y.Z
```

GitHub Release (strip YAML frontmatter from notes file for body):

```bash
gh release create vX.Y.Z \
  --title "vX.Y.Z" \
  --notes-file <(sed '1,/^---$/d;/^---$/d' data/releases/vX.Y.Z.md)
```

Or paste body manually if `gh` unavailable — tell user to create release in UI.

## CI

Push tag `v*` triggers [`.github/workflows/docker-publish.yml`](../../.github/workflows/docker-publish.yml) → GHCR image `ghcr.io/tikhomirovv/tg-moderator-ai:vX.Y.Z` and `latest`.

Monitor: `gh run list --workflow=docker-publish.yml`

## Checklist

- [ ] User confirmed tag `vX.Y.Z`
- [ ] `data/releases/vX.Y.Z.md` written and reviewed (RU)
- [ ] `package.json` version matches
- [ ] Commit pushed to master
- [ ] Tag pushed → CI started
- [ ] `gh release create` done (or user notified to do manually)
- [ ] Comment on related issues if useful

## Do not

- Tag without user-confirmed version
- Push tag before release markdown is committed
- Use `db:reset` or destructive DB ops as part of release
- Include `Co-authored-by` / raw commit bodies in release notes

## References

- Release notes UI: `/release-notes`
- Data README: [`data/releases/README.md`](../../data/releases/README.md)
- Deploy: [`.docs/deploy.md`](../../.docs/deploy.md) § GHCR
