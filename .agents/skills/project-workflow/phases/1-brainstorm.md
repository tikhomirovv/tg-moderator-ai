# Phase 1 — Brainstorm & PRD

Explore the idea, align on requirements, and produce a validated design before any documentation or code is written.

## When to Use

- Starting a new project from scratch
- Discussing a feature or major change before planning
- Requirements are vague and need clarification
- User wants to think through options and trade-offs

## Hard Gate

Do NOT proceed to Phase 2 until the user has approved the design. This applies even for seemingly simple projects — unexamined assumptions cause the most wasted work.

## Process

Work through these steps in order:

1. **Explore context** — check existing files, `.docs/`, `README.md`, recent commits if any are present.
2. **Assess scope** — if the request describes multiple independent subsystems, decompose into sub-projects first. Brainstorm one sub-project at a time.
3. **Ask clarifying questions** — one question at a time. Prefer multiple-choice when possible. Focus on: purpose, constraints, success criteria, non-goals.
4. **Propose 2–3 approaches** — with trade-offs and a clear recommendation. Lead with your recommendation and explain why.
5. **Present design** — section by section, get approval after each. Cover: problem, solution, user flows, requirements, non-goals, technical approach, risks.
6. **Hand off** — once approved, move to [Phase 2](2-docs.md) to write `.docs/prd.md` and related files.

## Requirements Quality

Use concrete, measurable criteria. Avoid "fast", "easy", "intuitive".

```diff
# Bad (vague)
- The search should be fast and return relevant results.
- The UI must look modern and be easy to use.

# Good (concrete)
+ Search must return results within 200ms for a 10k record dataset.
+ UI must achieve 100% Lighthouse Accessibility score.
+ Search algorithm must achieve >= 85% Precision@10 in benchmark evals.
```

## Design Structure

When presenting the design, cover these sections (scale each to its complexity):

### Executive Summary
- **Problem**: 1–2 sentences on the pain point.
- **Solution**: 1–2 sentences on the fix.
- **Success criteria**: 3–5 measurable KPIs.

### User Experience
- **Personas**: Who is this for?
- **User stories**: `As a [user], I want to [action] so that [benefit].`
- **Acceptance criteria**: Concrete "done" checkboxes per story.
- **Non-goals**: What are we NOT building?

### Technical Approach
- Architecture overview, key components, data flow.
- Integration points (APIs, DBs, auth).
- Technical risks and mitigations.

### Phased Rollout
- MVP → v1.1 → v2.0 (or equivalent phases).
- What is deferred and why.

## Key Principles

- **One question at a time** — never stack multiple questions in one message.
- **YAGNI ruthlessly** — remove unnecessary features from all designs.
- **Always propose alternatives** — never present a single option without trade-offs.
- **Incremental validation** — present one section, get approval, then continue.
- **Design for isolation** — each component should have one clear purpose and well-defined interfaces.

## Output

Approved design → hand off to [Phase 2](2-docs.md) to write or update:
- `.docs/project-overview.md`
- `.docs/prd.md`
- `.docs/technical-design.md`
