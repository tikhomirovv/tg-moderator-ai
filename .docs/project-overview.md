# Project overview — tg-moderator-ai

## What

Self-hosted web admin + Telegram webhook service for **AI chat moderation**. Operators connect moderation bots, define rules (custom or presets), attach rule sets per chat, and review logs and audit decisions.

## For whom

- Community or business chat admins who want configurable LLM moderation without building their own stack
- Self-hosters who need control over data, models, and deployment

## Problem

Manual moderation does not scale; generic bot filters miss context. Teams need per-chat policies, explainable actions, and a simple admin UI.

## Value

- **Per-bot rule library** with presets (ads, politics, aggression, scams, etc.)
- **Per-chat rule subsets** — same bot, different chats, different policies
- **Actions:** warn / delete / ban per rule; silent mode for dry-run logging
- **Team access:** owner + managers via access codes; Telegram login (no separate passwords)
- **Observability:** dashboard, bot statistics, moderation audit trail
- **i18n:** English default admin UI + Russian; browser locale detection; footer language switcher

## Domain model

```
User (telegram_id)
  → Bot (owner_user_id)
      → bot_members (owner | manager)
      → bot_access_codes (invite)
      → rules[] (per bot)
      → chats[] → moderation
```

## Status

- **Architecture:** bot-centric (post–issue #72 refactor); no workspaces / Better Auth
- **Auth:** Telegram OIDC (`TELEGRAM_LOGIN_*` + `BASE_URL`)
- **Rules:** code presets in `server/database/rule-templates.ts`; add via Rule library UI
- **Production:** Docker image on GHCR; PostgreSQL and Traefik external to the app container

## Related docs

| Document | Purpose |
|----------|---------|
| [prd.md](prd.md) | Scope, flows, requirements |
| [technical-design.md](technical-design.md) | Stack, API, engineering rules |
| [i18n.md](i18n.md) | Admin UI locales, keys, conventions |
| [deploy.md](deploy.md) | Production deployment |
| [database-migrations.md](database-migrations.md) | Drizzle migration policy |
| [SPEC.md](SPEC.md) | **Archived** early spec (MongoDB era) |
