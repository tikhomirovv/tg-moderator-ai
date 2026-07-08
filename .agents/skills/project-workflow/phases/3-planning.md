# Phase 3 — Planning

Decompose work into issues, set milestones, establish dependencies. Works with any issue tracker — GitHub or GitLab.

## Platform

Platform is detected in `SKILL.md`. Before running any tracker commands, read the platform-specific file:

- GitHub → [platforms/github.md](../platforms/github.md)
- GitLab → [platforms/gitlab.md](../platforms/gitlab.md)

These files cover: auth, CLI commands, issue dependency API calls, boards, and tier limitations. Always discover flag syntax at runtime via `<cli> <command> --help`.

## Entity Roles

| Entity | Role |
|--------|------|
| **Issues** | Atomic work items: features, bugs, tasks, spikes. Include title, description, and acceptance criteria. |
| **Labels** | Categories and filters: type (`feature`, `bug`, `chore`), area, priority. |
| **Milestones** | Phase or release groupings. Map to project stages (e.g. MVP, v1.1). Track progress toward a goal. |
| **Projects / Boards** | Visual views over issues — board, table, or roadmap. Use when milestones and labels are not enough. |
| **Pull Requests / Merge Requests** | Code changes linked to issues. Used for review, CI checks, and merge. |

## Typical Workflow

1. **Plan** — break work from `.docs/prd.md` or discussion into issues. Group under a milestone. Set dependencies and priority labels.
2. **Track** — create/link a project board; add all milestone issues.
3. **Hand off** — pass to [Phase 4](4-implementation.md): one issue → one branch → one PR/MR per cycle.
4. **Close** — merged PR/MR with closing keyword closes the issue; verify on the board.

## When to Use What

- **Issues only** — sufficient for small projects or early stages.
- **Issues + milestones** — when work is grouped into phases or releases.
- **Issues + milestones + board** — when you need visual progress tracking or custom fields.

Start simple. Add boards when milestones and labels are no longer enough.

## Decomposition Guidelines

Each issue must be a **complete, reviewable unit of value** — not a fragment that only makes sense with the next 2–3 issues.

| Good | Bad |
|------|-----|
| "Domain model + repository interfaces" — builds, testable | "Empty scaffold" with no runnable module or entry point |
| "Config loader + default config + tests" | "Add config file" without wiring (useless alone) |
| "Auth API + persistence + tests" — one vertical slice | Three micro-issues that only make sense if merged together |

**Rule:** If issue A is not worth merging on its own (broken build, no testable behavior, pure placeholder), either merge A+B into one issue, or make B explicitly blocked by A — and ensure A still leaves the repo in a valid state.

**Target:** one PR/MR ≈ one coherent change reviewable in 15–30 minutes.

## Issue Checklist (every new issue)

- [ ] **Title** — verb + scope (e.g. "Add filesystem-backed job store").
- [ ] **Acceptance criteria** — concrete checkboxes; no vague "implement X".
- [ ] **Milestone** — assign to a phase (MVP, v0.2, etc.).
- [ ] **Labels** — `type:*`, `area:*`, and `priority:p0` (critical path) or `priority:p1` (deferrable).
- [ ] **Dependencies** — link every prerequisite as a blocker; add `## Depends on` section in body for human readability.

## Issue Dependencies

Every new issue must declare what it depends on. This is required, not optional.

### Why Dependencies Matter

- Agents should pick only issues whose blockers are closed.
- Milestones alone do not enforce execution order; dependency links do.
- Parallel work stays possible when dependencies are explicit (e.g. two issues both blocked only by #1).

### Dependency Design Rules

- **Root tasks** (e.g. repo scaffold) have no blockers.
- **Infrastructure** (CI, lint) may depend only on scaffold — can run in parallel with domain work once scaffold exists.
- **Domain layers** follow technical design order: ports/entities → persistence → use cases → adapters → CLI/UI.
- **Cross-cutting features** (auth, payments, notifications) depend on the core they integrate with, not the reverse.
- **Next milestone** issues should be blocked by the last deliverable of the previous phase.
- Mark critical-path issues `priority:p0`; deferrable work `priority:p1`.

### Setting Dependencies

Use the platform-specific file for exact API calls and CLI commands:
- GitHub: see `Issue Dependencies` section in [platforms/github.md](../platforms/github.md)
- GitLab: see `Issue Dependencies` section in [platforms/gitlab.md](../platforms/gitlab.md)

Always document the dependency in the issue body as a `## Depends on` section listing issue numbers — native links are the source of truth, body text is for human readability.

### How Agents Pick Work

1. Scope to the current milestone (or the phase the user asked for).
2. List open issues in that milestone.
3. Skip any issue with open blockers — all blockers must be closed.
4. Prefer `priority:p0`, then lowest issue number.
5. If everything is blocked, stop and report which blockers must close first. Do not start out-of-order work unless the user explicitly overrides.

## After Creating Issues

1. **Verify dependency graph** — no orphan order; entry issues have no blockers.
2. **Link repository to project board** if one is being used — so the board appears under the repo's Projects tab.
3. **Add all issues to the board** for the current milestone.
4. Post a short **execution order table** in chat (issue # → title → blocked by #) for the current milestone.

## Boundaries

- Do not store product requirements long-term in issues — keep durable context in `.docs/`; issues reference that context.
- Do not create micro-issues that force the implementer to batch work — size each issue for one PR/MR.
- Do not skip dependency links when creating issues — planning is incomplete without the dependency graph.
- Do not duplicate the roadmap in markdown when the issue tracker can hold it.
