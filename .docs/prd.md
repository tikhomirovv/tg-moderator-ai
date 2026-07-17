# PRD — tg-moderator-ai

## Scope

Web application to manage Telegram moderation bots: connect bot token, configure chats, rules, team access, and review moderation outcomes. Runtime moderation runs on incoming Telegram webhooks.

**In scope:** bot CRUD, rules, rule presets, chat binding, webhook lifecycle, team join, dashboard, audit, release notes page.

**Out of scope (current):** multi-region, non-Telegram channels, end-user facing signup outside Telegram.

**Billing:** SaaS mode (`DEPLOYMENT_MODE=saas`) — per-bot credits, YooKassa checkout, purchase promo codes. Self-hosted default — BYOK, billing no-op. See `.docs/billing-design.md`, `.docs/billing-economics.md`.

## User flows

### Login

1. User opens app → redirected to `/login` if no session
2. «Войти через Telegram» → Telegram OIDC → session cookie
3. Post-login redirect preserves `returnTo` (e.g. invite link `/join?code=…` → join modal on `/bots`)

### Bot lifecycle

1. Create bot (name + moderation bot token from BotFather)
2. Enable bot → webhook registered at `{BASE_URL}/api/telegram/webhook/{botId}`
3. Add chats (Telegram chat id), pick rules per chat, optional silent mode
4. Messages in bound chats → LLM analysis → warn/delete/ban per rule settings

### Rules

1. Start with empty rule list per bot
2. **Rule library** — add presets one by one (commercial ads, politics, aggression, religion, spam, scams, gambling, DM offers, …)
3. **Custom rules** — CRUD on `/bots/:id/rules`
4. Assign rule IDs to each chat on bot detail page

### Team

1. **Owner** generates access code on bot detail → shares link or code
2. **Manager** logs in via Telegram → joins with code (`POST /api/bots/join` or `/join?code=…`)
3. Owner and manager share operational access (chats, rules, moderation, activate, templates, enable/disable). **Owner only:** delete bot, access codes, remove managers. Manager sees read-only team list. The owner row in `bot_members` cannot be removed

### Dashboard

Aggregated KPIs and activity across all bots the user can access (owner or manager).

## Requirements

| Area | Requirement |
|------|-------------|
| Auth | Telegram OIDC only; session in httpOnly cookie |
| Webhook security | Per-bot `webhook_secret`; header `X-Telegram-Bot-Api-Secret-Token` |
| Rules | Stored per `bot_id`; presets are catalog in code, copied into DB on add |
| Moderation | OpenAI-compatible LLM; configurable model via env |
| Data retention | Moderation decisions/messages per retention policy (see `server/core/retention-policy.ts`) |
| Migrations | Incremental Drizzle only; no destructive reset in production |

## Constraints

- `BASE_URL` must be **public HTTPS** for webhooks and OIDC callback
- Dev on `localhost` is insufficient for Telegram login — use **cloudflared** tunnel (`make tunnel`)
- BotFather Web Login redirect URI: `{BASE_URL}/api/auth/telegram/callback`

## Non-goals

- Email/password authentication
- Organization/workspace multi-tenancy layer
- Automatic application of all rule presets on bot creation

## Open questions

- ~~User-facing release notes for v1.0.0 still describe pre-refactor model~~ — resolved in #109: archive banner on `data/releases/v1.0.0.md`; full rewrite on next published release
- Optional: E2E tests for OIDC flow in CI
