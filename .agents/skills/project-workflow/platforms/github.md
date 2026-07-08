# GitHub — Platform Details

Read this file when the repository is hosted on GitHub (remote contains `github.com`). CLI: `gh`.

## Authentication

Authenticate once via `gh auth login`. All subsequent `gh` and `gh api` calls use this token automatically — no separate API credentials needed.

Check current auth status:
```bash
gh auth status
```

For GitHub Projects commands the token may additionally need the `project` scope:
```bash
gh auth refresh -s project
```

If you get unexpected `404` or permission errors, check auth before assuming a resource is missing.

## Required Token Permissions (fine-grained PATs)

| Scope | Access |
|-------|--------|
| Issues | Read and write |
| Pull requests | Read and write |
| Contents | Read and write |
| Metadata | Read-only (usually automatic) |

## Core CLI Commands

Always discover flags at runtime: `gh <command> --help`

| Task | Command |
|------|---------|
| List issues | `gh issue list` |
| Create issue | `gh issue create` |
| View issue | `gh issue view N` |
| Close issue | `gh issue close N` |
| Create PR | `gh pr create` |
| Merge PR | `gh pr merge` |
| View PR status | `gh pr view` |
| Create milestone | `gh api` (no direct CLI command; use API) |
| Create label | `gh label create` |
| Create project board | `gh project create` |
| Add issue to project | `gh project item-add` |
| Link project to repo | `gh project link N --owner OWNER --repo OWNER/REPO` |

## Issue Dependencies (Blockers)

GitHub does not have a native `gh issue edit --add-blocked-by` flag in all versions. Check first:
```bash
gh issue edit --help
```

If `--add-blocked-by` is available, use it. Otherwise fall back to the REST API:

```bash
# Get numeric issue id (not the issue number shown in UI)
BLOCKER_ID=$(gh api repos/OWNER/REPO/issues/BLOCKER_NUMBER --jq .id)

# Mark ISSUE_NUMBER as blocked by BLOCKER_NUMBER
gh api repos/OWNER/REPO/issues/ISSUE_NUMBER/dependencies/blocked_by \
  --method POST \
  --input - <<< "{\"issue_id\":${BLOCKER_ID}}"
```

Important:
- `issue_id` must be an **integer** in the JSON body, not a string. Use `--input` with raw JSON or `-F issue_id:=ID`. Plain `-f issue_id=ID` sends a string and returns `422`.
- Multiple blockers require one POST per blocker.

Check blockers of an issue:
```bash
gh api repos/OWNER/REPO/issues/N/dependencies/blocked_by --jq '.[].number'
```

Check what an issue blocks:
```bash
gh api repos/OWNER/REPO/issues/N/dependencies/blocking --jq '.[].number'
```

## GitHub Projects (Boards)

GitHub Projects is a standalone product — separate from issues and milestones. Use it when you need visual boards, roadmap views, or custom fields.

```bash
gh project create --owner OWNER --title "Project Name"
gh project list --owner OWNER
gh project item-add PROJECT_NUMBER --owner OWNER --url ISSUE_URL
gh project link PROJECT_NUMBER --owner OWNER --repo OWNER/REPO
```

## Closing Issues via PR

In the PR body, use:
```
Closes #N
```
The issue closes automatically when the PR is merged. One closing keyword per issue; one issue per PR (unless user explicitly requests a batch).

## Updating Issue State During Implementation

### Checkboxes in issue description

Read the current body, update checkboxes, write back:
```bash
# Read current body
gh issue view N --json body --jq .body

# Write updated body (replace content, preserve everything else)
gh issue edit N --body "UPDATED_BODY"
```

Tick a checkbox by changing `- [ ]` to `- [x]` for the completed criterion only.

### Issue status on a GitHub Projects board

Move the issue card to the correct status column as work progresses:

```bash
# Find the project item ID
ITEM_ID=$(gh project item-list PROJECT_NUMBER --owner OWNER --format json \
  --jq ".items[] | select(.content.number == ISSUE_NUMBER) | .id")

# Find the status field ID and option ID for the desired status
gh project field-list PROJECT_NUMBER --owner OWNER --format json

# Update the status field
gh project item-edit --project-id PROJECT_ID \
  --id ITEM_ID \
  --field-id STATUS_FIELD_ID \
  --single-select-option-id OPTION_ID
```

Discover exact option IDs via `gh project field-list` — status options vary per project.

### Labels

```bash
gh issue edit N --add-label "status:in-progress"
gh issue edit N --remove-label "status:in-progress" --add-label "status:in-review"
```

## Checking CI Status

```bash
gh pr checks
gh pr view --json statusCheckRollup
```
