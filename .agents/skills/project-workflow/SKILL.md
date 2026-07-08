---
name: project-workflow
description: Universal project workflow — brainstorming, documentation, task planning, and implementation. Works with GitHub and GitLab. Use when starting a new project, discussing a feature, updating project docs, decomposing work into issues, or implementing tasks from a backlog. Triggers on "project workflow", "start project", "update docs", "create issues", "implement task", "take issue", "work on feature", or when the user wants end-to-end project support at any stage.
---

# Project Workflow

End-to-end skill for software projects — from first idea to shipped feature. Works at any project stage with GitHub or GitLab.

## How Phases Work

All four phases are **independently enterable at any time**. Sequential order is a recommendation for new projects — not a constraint.

The user can jump to any phase at any moment:
- discussed a feature in chat → go straight to Phase 3 to create issues
- backlog exists → go straight to Phase 4 to implement
- docs are stale → go straight to Phase 2 to update them
- idea needs thinking through → go to Phase 1 even mid-project

**Sequential flow is the default only when starting a greenfield project** or when the user explicitly says to go step by step. In all other cases, go directly to the requested phase.

## Entry Point

Read the repository state first, then pick the phase based on the user's explicit request — or, if none, based on context signals below.

**User's explicit request always takes priority over context signals.**

| Signal | Phase |
|--------|-------|
| "brainstorm / discuss / think through / let's explore" | [1 — Brainstorm](phases/1-brainstorm.md) |
| "update docs / update README / fix documentation" | [2 — Docs](phases/2-docs.md) |
| "create issues / decompose / plan / add to backlog" | [3 — Planning](phases/3-planning.md) |
| "implement / execute / take issue / issue #N" | [4 — Implementation](phases/4-implementation.md) |
| Empty repo, user wants to explore an idea (no explicit phase) | [1 — Brainstorm](phases/1-brainstorm.md) |
| Code exists but `.docs/` is missing or incomplete (no explicit phase) | [2 — Docs](phases/2-docs.md) |
| `.docs/` exists, no issues in tracker yet (no explicit phase) | [3 — Planning](phases/3-planning.md) |
| Backlog exists, user wants to build (no explicit phase) | [4 — Implementation](phases/4-implementation.md) |

If context is still ambiguous, ask once before proceeding.

## Sequential Flow (New Project or Feature)

When starting from scratch — or when the user wants to go step by step — run phases in natural order:

```
Phase 1 → Phase 2 → Phase 3 → Phase 4
```

Each phase produces artifacts that feed the next:
- **Phase 1** outputs: validated concept, requirements, design decisions
- **Phase 2** outputs: `.docs/` files, `README.md`
- **Phase 3** outputs: issues with milestones and dependency graph
- **Phase 4** outputs: branches, pull/merge requests, merged features

After completing a phase, suggest the next one — but do not force it. The user decides whether to continue or stop.

## Orientation Before Any Phase

Before entering any phase, orient yourself:
1. Check for `.docs/` — read `project-overview.md` → `prd.md` → `technical-design.md` if present.
2. Read `README.md` if present.
3. Check issue tracker for open issues, milestones, and blockers.
4. Use whatever is found as context. Do not re-run earlier phases unless the user asks.

## Platform Detection

Detect the hosting platform from git remotes:

```bash
git remote -v
```

- Remote contains `github.com` → **GitHub**. CLI: `gh`. Read [platforms/github.md](platforms/github.md) before running any platform-specific commands.
- Remote contains `gitlab.com` or a known GitLab host → **GitLab**. CLI: `glab`. Read [platforms/gitlab.md](platforms/gitlab.md) before running any platform-specific commands.

Read only the file that matches the detected platform. Do not load both.

Always discover command syntax at runtime via `<cli> <command> --help`. Do not rely on memorized flags.

## Phases

Read the relevant phase file when entering that phase:

- [Phase 1 — Brainstorm & PRD](phases/1-brainstorm.md)
- [Phase 2 — Documentation](phases/2-docs.md)
- [Phase 3 — Planning](phases/3-planning.md)
- [Phase 4 — Implementation](phases/4-implementation.md)
