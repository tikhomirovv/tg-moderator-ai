# Phase 2 — Documentation

Maintain project documentation. Keep `.docs/` and `README.md` accurate and current at any project stage.

## Document Set

All project docs live in `.docs/` at the repository root, plus `README.md` in the root.

| File | Purpose | Audience |
|------|---------|----------|
| `.docs/project-overview.md` | What the project is, who it is for, the problem it solves, current status. Short — readable in 1–2 minutes. | Agent context |
| `.docs/prd.md` | Living product spec: scope, user flows, requirements, constraints, non-goals, open questions, planned expansions. | Agent context |
| `.docs/technical-design.md` | Stack, technical decisions, core entities, project structure, engineering rules. | Agent context |
| `README.md` | Public-facing: project description, quickstart, installation, usage, configuration, contributing, license. | Repository visitors |

**README vs project-overview:** `README.md` is for humans visiting the repository — it explains how to get started with the project. `project-overview.md` is internal agent context — it explains the product vision, audience, and current status. They may share a brief description but serve different purposes. Do not collapse them into one.

## Before Any Project Work

1. Check whether `.docs/` exists. If not, create it and scaffold the three files with minimal section headers.
2. Read in order: `project-overview.md` → `prd.md` → `technical-design.md`.
3. Read `README.md` if present.
4. Treat these files as source of truth for product and technical context.

## When to Update

Update during discussions — not only after implementation.

| Change type | Update |
|-------------|--------|
| Product vision, audience, value proposition | `project-overview.md` |
| Scope, requirements, user flows, non-goals | `prd.md` |
| Stack, architecture, entities, engineering rules | `technical-design.md` |
| Installation, usage, configuration, contributing | `README.md` |

After updating, keep sections consistent across all files. Remove contradictions inline.

## Updating from Context

If the user asks to "update docs" or "update documentation" without specifying which file:
1. Explore the repository — code structure, recent commits, existing docs.
2. Identify what is outdated or missing across all four documents.
3. Report gaps to the user. Offer to fill them in **wizard mode**: one focused question at a time, updating the relevant doc after each answer.
4. For `README.md`, infer what belongs there from the actual project state: how it runs, how it's configured, what the entry points are.

Do not block unrelated work — mention gaps once, then proceed if the user prefers.

## Gap Detection

After reading docs, check for:
- Empty or placeholder sections (`TBD`, `TODO`, `???`)
- Missing scope boundaries or non-goals
- Undocumented open questions
- Conflicts between files
- `README.md` missing or describing an outdated setup

## Scaffolding Templates

When creating missing files, use these minimal structures.

### project-overview.md

```markdown
# Обзор проекта

## Что это
## Для кого
## Проблема
## Ценность
## Текущий статус
```

### prd.md

```markdown
# PRD

## Текущий scope
## Пользовательские сценарии
## Требования
## Ограничения
## Non-goals
## Открытые вопросы
## Запланированные расширения
```

### technical-design.md

```markdown
# Technical Design

## Стек
## Ключевые решения
## Основные сущности
## Структура проекта
## Инженерные правила
```

### README.md

```markdown
# Project Name

Short description of what the project does and the problem it solves.

## Getting Started

### Prerequisites

### Installation

### Configuration

## Usage

## Contributing

## License
```

## Update Rules

- Edit existing docs in place. Do not create parallel "draft" or "temp" files for the same purpose.
- Keep `project-overview.md` short. Put detailed requirements in `prd.md`.
- Record decisions with brief rationale in `technical-design.md`.
- When a decision replaces an old one, update or remove the old text — do not leave conflicting versions.
- Keep `README.md` installation and usage steps in sync with the actual project state.

## Language

All content in `.docs/` and `README.md` must be written in **Russian**.

## Boundaries

This phase only maintains documentation. It does not:
- Create or manage issues, milestones, or project boards — that is [Phase 3](3-planning.md).
- Implement code changes — that is [Phase 4](4-implementation.md).
