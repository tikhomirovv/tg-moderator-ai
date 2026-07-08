# Phase 4 — Implementation

Pick an issue, create a branch, implement, test, open a pull/merge request.

## Platform

Platform is detected in `SKILL.md`. Before running any platform commands, read the platform-specific file:

- GitHub → [platforms/github.md](../platforms/github.md)
- GitLab → [platforms/gitlab.md](../platforms/gitlab.md)

These files cover: auth, CLI commands, checking blockers, CI status, and closing keywords. Always discover flag syntax at runtime via `<cli> <command> --help`.

**Closing keywords in PR/MR body:**
- GitHub: `Closes #N`
- GitLab: `Closes #N` (also accepted: `/close #N` in issue/MR comments)

## Role

You are the implementer:
- Read context, pick or accept **one issue at a time**, implement on a **dedicated branch**.
- Ask only **blocking questions** — things you cannot infer from docs, the issue, or the codebase.
- Stop and notify when work is **done** or **paused** (blocked, scope change, awaiting input).
- Leave **brief issue comments** at key stages so progress is visible in the tracker.
- End with a **pull/merge request** (`Closes #N`). Then apply the execution mode gate.

Do not reorganize the backlog, create new milestones, or rewrite product docs unless the issue requires it.

## Sequential Execution (Default)

```
issue #N → branch issue/N-slug → implement → test → PR/MR → merge & close #N → update main → issue #N+1
```

| Rule | Requirement |
|------|-------------|
| One issue | Exactly one issue per branch and per PR/MR (`Closes #N` for a single N). |
| Branch base | Always branch from the updated default branch after the previous issue is merged. |
| Next issue | Start #N+1 only when #N is merged and closed (or user explicitly overrides). |
| Branch cleanup | After merge, delete the feature branch locally and on the remote. |
| No batching | Do not combine multiple issues in one branch/PR/MR unless the user explicitly asks. |
| Dependencies | Never start an issue whose blockers are still open. |

## Execution Modes

At the start of a session, if the user has not chosen a mode, **ask once**:

> How should I handle each PR/MR after CI passes?
> **(A) Autonomous** — merge, close the issue, update the default branch, continue to next task without waiting.
> **(B) Review-driven** — stop after opening the PR/MR; you review and merge when ready.

| Signal | Mode |
|--------|------|
| "auto-merge", "мержи сам", "без ревью", "продолжай сам" | A |
| "жди ревью", "не мержи", "stop after PR", "хочу ревьюить" | B |
| Already stated earlier in the conversation | Do not ask again |
| User refuses to choose | B (safer default) |

## Workflow

```
Orient → Mode (A/B)? → Select issue → Branch → Implement → Verify → PR/MR → Mode gate → (next)
```

Track progress with this checklist:

- [ ] Context read (`.docs/` if present + issue + repo layout + test commands)
- [ ] Execution mode A or B confirmed
- [ ] Issue selected and confirmed not blocked
- [ ] Feature branch created from updated default branch
- [ ] Acceptance criteria implemented
- [ ] Tests added/updated in the same change set
- [ ] Tests pass locally or CI is green after push
- [ ] PR/MR opened (`Closes #N`) + issue comment
- [ ] Mode gate applied
- [ ] Task Completion when issue closes (checkboxes + closure comment)

## Step 1 — Orient

Before writing code:

1. Read `.docs/` if present: `project-overview.md` → `prd.md` → `technical-design.md`.
2. Read `README.md` if present.
3. Inspect the repo — layout, conventions, test commands (Makefile, package scripts, CI config).
4. Read the target issue body and acceptance criteria.
5. Check blockers: all listed blockers must be closed before starting.

## Step 2 — Select Issue

**User specified #N:** use it. If it has open blockers, warn once and stop unless the user overrides.

**User did not specify:**
1. Scope to the current milestone (or the phase the user named).
2. List open issues in that milestone.
3. Exclude any issue with open blockers.
4. Prefer `priority:p0`, then lowest issue number.
5. If everything is blocked, stop and report which blockers must close first — do not pick out-of-order work.

## Step 3 — Branch

Always create a new branch before writing any code. Never commit implementation work directly on `main` / `master`.

1. Ensure a clean working tree (stash only with user awareness).
2. Branch from the default branch (`main` or `master`) — must be up to date.
3. Naming: `issue/<number>-<short-slug>` (e.g. `issue/3-add-auth`).
4. All commits for **this issue only** stay on this branch.

```bash
git fetch origin
git checkout main   # or master
git pull --ff-only
git checkout -b issue/3-add-auth
```

## Step 4 — Implement

Follow the issue acceptance criteria and technical design doc.

- Match existing project conventions (structure, naming, error handling).
- Keep changes scoped to the issue — no drive-by refactors.
- Separate domain/business logic from delivery layers when the repo already does — follow local patterns.
- Tests are **mandatory** for changed business logic — include them in the same PR/MR, not a follow-up.

### Questions Policy

- Do not ask for decisions already documented in repo docs or the issue.
- Do not ask for permission to proceed with the obvious implementation path.
- Ask only when missing information **blocks** progress (e.g. missing credentials with no stub path, contradictory acceptance criteria).
- Ask one focused question at a time. While waiting, stop work and report paused state.
- Post the same blocking question on the issue — chat alone is not enough.

### Issue Comments (Key Stages)

Post brief comments on the issue via the CLI. Short — a few bullets, not a verbose log.

| Stage | Comment? | Example |
|-------|----------|---------|
| Branch created | Yes | Branch name, brief plan |
| Major milestone reached | Yes, if non-obvious | "Schema migration added", "API port wired" |
| Blocked — need human input | **Required** | Question + what is done + branch |
| PR/MR opened | **Required** | Summary + PR/MR link + test status |
| Issue merged/closed | **Required** | Done summary — see [Task Completion](#task-completion) |

**Blocked comment template:**
```markdown
⏸ **Paused** — need input

**Branch:** `issue/N-slug`
**Done so far:** [1–2 bullets]
**Blocker:** [one focused question]
```

**PR opened comment:**
```markdown
✅ **Ready for review**

**Branch:** `issue/N-slug`
**PR/MR:** #M (or full URL)

- [acceptance criterion → what was done]
- Tests: [test command] — pass
```

## Task Completion

Whenever an issue is finished — MR merged, user asks to merge/close, or confirms the task is done (GitHub and GitLab alike):

1. **Re-read the issue** if criteria or checkbox state are not fresh in context (`gh issue view N` / `glab issue view N`).
2. **Tick all done checkboxes** in the description — read body first, only change `- [ ]` → `- [x]` for completed items (edit commands: [github.md](../platforms/github.md) / [gitlab.md](../platforms/gitlab.md)).
3. **Post a closure comment** on the issue — required; chat alone is not enough.
4. **Board/labels** → Done; remove in-progress labels if the project uses them.

**Closure comment:**
```markdown
✅ **Done**

**PR/MR:** #M or URL

- [criterion → what was delivered]
- Tests: [command] — pass
```

## Keeping Issue State Current

Maintain accurate issue state throughout implementation — not only at the end.

| Stage | Action |
|-------|--------|
| Branch created, work started | Set issue status to **In Progress** on the board (if one exists) |
| Acceptance criterion completed | Tick the corresponding checkbox in the issue description |
| PR/MR opened | Set status to **In Review** if the board has that state |
| Merged/closed | Run [Task Completion](#task-completion) |

### Checkboxes in Issue Description

Tick criteria as you complete them during work. Before closing the issue, re-read the body and ensure **all done items are checked** — see Task Completion.

### Labels

Keep labels in sync with reality:
- Add `status:in-progress` (or equivalent) when you start work, remove it when done.
- If the issue turns out to be a bug rather than a feature, fix the type label.
- Do not accumulate stale labels — remove them when they no longer apply.

### Board Status

If the project has a board with status columns (To Do / In Progress / In Review / Done), move the issue card at each transition. Do not leave cards in "To Do" while the branch is active, or in "In Progress" after the PR is merged.

## Step 5 — Verify

1. Run the project's documented test command locally when the toolchain is available.
2. If local tools are unavailable, push and wait for CI; report status.
3. Fix failures before proceeding.
4. Review the diff against acceptance criteria — every criterion met or explicitly deferred with user approval.

## Step 6 — PR/MR

1. Commit on the feature branch with clear messages.
2. Push the branch.
3. Create the PR/MR via CLI — discover flags via `--help`.

PR/MR body:
```markdown
## Summary
[1–3 bullets: what changed and why]

## Issue
Closes #N

## Test plan
- [ ] [project test command from CI/Makefile]
- [ ] [manual steps if relevant]

## Notes
[optional: follow-ups, deferred items]
```

### After PR/MR — Mode Gate

**Mode A (Autonomous):**
1. Merge the PR/MR.
2. Verify the issue is closed (auto-closes via `Closes #N` on merge). If still open, close manually.
3. Run [Task Completion](#task-completion).
4. Update local default branch: `git checkout main && git pull --ff-only`.
5. **Delete the merged feature branch** — local and remote (see [Branch cleanup after merge](#branch-cleanup-after-merge)).
6. Continue to the next issue.

**Mode B (Review-driven):**
1. Notify the user with PR/MR link and short summary.
2. Do not merge the PR/MR.
3. Do not close the issue manually — it closes when the user merges.
4. Do not start the next issue until the user merges (or explicitly says to continue).
5. When the user confirms the PR/MR is merged (or you resume after their merge): run [Task Completion](#task-completion), update default branch, then **delete the merged feature branch** locally and on the remote.

### Branch cleanup after merge

After a successful merge into the default branch, remove **only** the feature branch for that issue (`issue/N-slug`). Do not delete `main`, `master`, or any other branch.

1. Check out the default branch and pull (if not already done).
2. Delete the local branch (safe delete — only if fully merged):
   ```bash
   git branch -d issue/N-slug
   ```
3. Delete the remote branch (skip if the platform already removed it when merging the PR/MR):
   ```bash
   git push origin --delete issue/N-slug
   ```
4. If local delete fails with "not fully merged", verify the PR/MR actually merged into the default branch before using `-D`.

Do not leave merged feature branches on the remote or in the local repo unless the user explicitly asks to keep them.

## Done / Paused Templates

### Done (to user)
```markdown
## Issue #N — ready for review

**Branch:** `issue/N-slug`
**PR/MR:** [link]
**Issue:** [title](link)

### Done
- [bullets mapped to acceptance criteria]

### Tests
- [test command] — pass

### Next
- **Mode B:** review the PR/MR; merge when satisfied (issue closes on merge).
- **Mode A:** (agent continues to next issue.)
```

### Paused (to user)
```markdown
## Issue #N — paused

**Branch:** `issue/N-slug` (WIP committed / uncommitted: state which)

### Progress
- [what is done]

### Blocker
- [single blocking question or external dependency]

### Needed from you
- [specific answer or action]
```

## Boundaries

| Do | Don't |
|----|-------|
| One issue per branch and per PR/MR | Pack multiple issues into one PR/MR without explicit user request |
| Work sequentially from updated default branch | Start #N+1 before #N is merged (unless user overrides) |
| Ask execution mode (A/B) once per session | Assume mode without asking |
| Read `.docs/` and `README.md` before coding | Store long-term requirements only in issues |
| Add tests with feature code | Defer tests to a follow-up PR/MR |
| Comment on issue at key stages (incl. closure) | Skip issue comments at PR open or close |
| Commit on feature branch | Commit directly on main/master |
| Delete merged feature branch (local + remote) | Leave merged `issue/*` branches around |
| Respect issue dependencies | Start blocked issues without override |
