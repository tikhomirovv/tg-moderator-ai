# Issue template reference

Adapt headings to the project's language. Keep titles action-oriented.

## Minimal task

```markdown
## Context
What exists today and why change is needed.

## Goal
1. …

## Acceptance criteria
- [ ] …

## Out of scope
- …

## Depends on
None.

## Related
- #N
```

## Feature (API, UI, data)

Add sections between **Goal** and **Acceptance criteria** as needed:

- **Schema / data model** — tables, fields, indexes, migration notes
- **API** — method, path, request/response
- **UI** — route, components, placement, user-visible strings
- **Tests** — unit/integration checklist

## Chore / policy

- **Changes** — numbered file or area list
- **Policy** — one paragraph the team should follow after merge

## Create vs edit

| Situation | Action |
|-----------|--------|
| Approved spec, no issue yet | Create issue |
| Refinement to placement, wording, AC | Edit same issue |
| Team policy reversed | Edit affected issues; add a chore issue if code/docs must change |
