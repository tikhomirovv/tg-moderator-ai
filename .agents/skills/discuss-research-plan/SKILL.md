---
name: discuss-research-plan
description: Guides discussion and codebase research before backlog work, then creates or updates tracker issues when explicitly asked. Use when the user explores ideas, asks how something works, compares options, says "answer only", "create an issue", "update the issue", or refines requirements without implementing yet.
---

# Discuss → Research → Plan

Pre-implementation workflow: understand the question, ground answers in the repository, capture decisions in the issue tracker **only when the user asks**.

Does not cover implementation. When the user moves to coding, stop this skill and follow the project's implementation workflow.

## Mode detection

| User intent | Mode | Do |
|-------------|------|-----|
| Question, exploration, "how does X work", tradeoffs | **Discuss** | Research + answer. No code. No issues. |
| "answer only", "no task yet", "don't create an issue" | **Discuss (strict)** | Same; do not offer or create issues. |
| "create an issue", "add to backlog", "file a task" | **Plan** | Create tracker issue(s). |
| "clarify in the issue", "update the task", "amend #N" | **Plan (refine)** | Edit existing issue; prefer update over duplicate. |
| "implement", "build it", "take issue #N", code changes | **Out of scope** | Switch to implementation; do not edit code under this skill unless the user explicitly changes mode. |

**Default is Discuss.** Planning requires an explicit user request.

## Orientation (both modes)

Before answering or planning:

1. Read project orientation docs if present (`README`, `AGENTS.md`, contribution guides, `.docs/`). Prefer live code over stale specs.
2. Search and read **relevant source** — not assumptions.
3. List or view related tracker issues for context and duplicates.
4. Run commands yourself — do not ask the user to investigate for you.

## Platform detection

Detect the hosting platform from git remotes:

```bash
git remote -v
```

| Remote | Platform | CLI |
|--------|----------|-----|
| contains `github.com` | GitHub | `gh` |
| contains `gitlab.com` or a known GitLab host | GitLab | `glab` |

Before any tracker command, read the matching platform file in this skill:

- GitHub → [platforms/github.md](platforms/github.md)
- GitLab → [platforms/gitlab.md](platforms/gitlab.md)

Read only the file that matches the detected platform. Do not load both.

Discover flag syntax at runtime: `<cli> <command> --help`. Do not rely on memorized flags.

---

## Discuss phase

### Research first (mandatory)

Inspect what actually exists: modules, APIs, schema, UI, tests, config, and open issues tied to the topic.

### Answer style

- Reply in the **user's language** unless they prefer otherwise.
- Match project conventions for issue/commit/code language when mentioning them.
- Be concrete: cite files, symbols, current behavior, gaps.
- Separate **what exists today** vs **what would need to change**.
- If comparing approaches, recommend one with short tradeoffs — do not implement.

### Discuss boundaries

- **No** file edits, commits, or PRs/MRs unless the user explicitly pivots to implementation.
- **No** new issues, even as a "helpful" follow-up, unless asked.
- **No** full issue drafts in chat when the user only wanted an answer.

---

## Plan phase

Triggered only by explicit user request to add or update backlog items.

### Before writing

1. Carry over decisions already made in the conversation (policies, UX placement, tech choices).
2. Scan related open and closed issues; update or link instead of duplicating.
3. Use labels, milestones, and priorities consistent with the repository.

### Issue shape

Use the structure in [issue-template.md](issue-template.md). Adapt section titles to the project's language if needed.

Every issue should include:

- **Context** — current state from research
- **Goal** — numbered outcomes
- **Technical detail** — as much as implementers need without re-discovery (APIs, schema, UI behavior, etc.)
- **Acceptance criteria** — checkbox list, testable
- **Out of scope** — explicit boundaries
- **Depends on** — issue numbers or "none"; add native blocker links when order matters
- **Related** — non-blocking links

### Planning principles

- **Conversation is the spec** — if the user approved it in chat, it belongs in the issue.
- **Propose technical detail** — tables, endpoints, copy, diagrams in text; the user steers in chat.
- **One issue ≈ one reviewable PR/MR** — avoid micro-tasks that only make sense merged together.
- **User-facing vs internal** — where humans read output, prefer readable labels; keep stable internal IDs in storage and contracts unless the issue says otherwise.
- **Refine in place** — UX tweaks ("put the button in section X") → edit the same issue, not a new one.
- **Align with project policy** — if the team forbids destructive data ops or mandates migration style, reflect that; do not embed repo-specific policies unless they came up in discussion or project docs.
- **Clean stale issues** — when guidance changes, search existing issues for obsolete instructions and edit them; remove wrong text without restating obvious defaults.

### Tracker metadata

Use the project's label and milestone scheme. Typical patterns:

- Type: `feature`, `bug`, `chore`, `enhancement`
- Area or component labels when the repo uses them
- Priority: `p0` / `p1` or equivalent

Set **blockers** when execution order matters (see platform file for syntax).

### After creating or updating

- Return the issue URL and a short summary (3–5 lines), not the full body.
- On user refinement, **edit the issue** — do not only acknowledge in chat.

---

## Handoff to implementation

When the user asks to build:

1. Pick work with **no open blockers** unless the user overrides order.
2. Follow the project's implementation rules and coding standards.
3. If work was discussed but never tracked and the user expected a ticket, confirm once — then create or update an issue if they want it tracked.

---

## Quick checklist

**Discuss**
- [ ] Read code and tracker, not docs alone
- [ ] Answer: current state vs desired state
- [ ] No code, no issues unless asked

**Plan**
- [ ] User explicitly requested backlog change
- [ ] Correct platform CLI and platform file read
- [ ] Context, AC, out of scope, dependencies
- [ ] Labels / milestone / blockers as appropriate
- [ ] Return URL; edit on refinement

## Additional resources

- Issue body patterns: [issue-template.md](issue-template.md)
