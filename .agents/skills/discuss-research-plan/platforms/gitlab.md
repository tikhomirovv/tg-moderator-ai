# GitLab — issue tracker

Use when the repository remote contains `gitlab.com` or a self-managed GitLab host. CLI: `glab`.

Authenticate: `glab auth login` · status: `glab auth status` · or set `GITLAB_TOKEN`

Discover flags at runtime: `glab <command> --help`

## Commands used in Discuss → Research → Plan

| Task | Command |
|------|---------|
| List issues | `glab issue list` |
| Create issue | `glab issue create` |
| View issue | `glab issue view N` |
| Edit issue | `glab issue update N` |
| List milestones | `glab milestone list` |

Pass multi-line descriptions via flags or a file per `glab issue create --help`.

## Labels and milestones

```bash
glab label list
glab milestone list
```

Use existing labels and milestones unless the user asks to create new ones.

## Issue dependencies (blockers)

No dedicated `glab` subcommand for blockers — use the API:

```bash
# Issue A blocks issue B (A must complete before B)
glab api projects/:fullpath/issues/A_IID/links \
  --method POST \
  -f target_project_id=":fullpath" \
  -f target_issue_iid=B_IID \
  -f link_type="blocks"
```

`:fullpath` = `namespace%2Frepo` (URL-encoded slash).

Link types: `relates_to` · `blocks` · `is_blocked_by`

Also document blockers in the issue body under **Depends on**.

Check blockers:

```bash
glab api projects/:fullpath/issues/N/links \
  --jq '.[] | select(.link_type=="is_blocked_by") | .iid'
```
