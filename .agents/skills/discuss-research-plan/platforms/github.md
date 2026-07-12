# GitHub — issue tracker

Use when the repository remote contains `github.com`. CLI: `gh`.

Authenticate: `gh auth login` · status: `gh auth status`

Discover flags at runtime: `gh <command> --help`

## Commands used in Discuss → Research → Plan

| Task | Command |
|------|---------|
| List issues | `gh issue list` |
| Create issue | `gh issue create` |
| View issue | `gh issue view N` |
| Edit issue body | `gh issue edit N --body-file …` |
| Search closed issues | `gh issue list --state all` |

Pass multi-line bodies via a file (`--body-file`) or heredoc to preserve formatting.

## Labels and milestones

```bash
gh label list
gh api repos/:owner/:repo/milestones --jq '.[].title'
```

Assign on create:

```bash
gh issue create --title "…" --label "type:enhancement" --milestone "v1.0" --body-file issue.md
```

Use labels and milestones that already exist in the repo unless the user asks to create new ones.

## Issue dependencies (blockers)

Check whether the CLI supports `--add-blocked-by`:

```bash
gh issue edit --help
```

If available:

```bash
gh issue edit ISSUE --add-blocked-by BLOCKER
```

Otherwise use the REST API (issue `id` is numeric, not the UI number):

```bash
BLOCKER_ID=$(gh api repos/OWNER/REPO/issues/BLOCKER_NUMBER --jq .id)

gh api repos/OWNER/REPO/issues/ISSUE_NUMBER/dependencies/blocked_by \
  --method POST \
  --input - <<< "{\"issue_id\":${BLOCKER_ID}}"
```

Also document blockers in the issue body under **Depends on**.

List blockers:

```bash
gh api repos/OWNER/REPO/issues/N/dependencies/blocked_by --jq '.[].number'
```
