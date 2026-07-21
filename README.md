# Telemodai 🪴

**English** · [Русский](README.ru.md)

**AI moderation for healthy communities**

Self-hosted web admin and Telegram webhooks for AI chat moderation. Rules are configured **per chat** — one bot can use different rule sets in different chats.

Repository: [github.com/telemodai/app](https://github.com/telemodai/app)

## Features

- **AI moderation** — message analysis via an OpenAI-compatible API (OpenAI, OpenRouter, Polza, etc.)
- **Per-chat rules** — a dedicated rule set per chat; presets from a catalog; per-rule delete/ban/warnings
- **Moderator actions** — warnings, deletion, and bans according to each rule
- **Silent mode** — log decisions in the app only, no actions in Telegram
- **Bot team** — owner/manager roles, join via access code
- **Webhooks** — status: Working / Disabled / Problem
- **Logs, statistics, audit** — moderation actions and model decisions per bot
- **en/ru UI** — language switcher in the footer
- **Self-hosted LLM** — model settings at `/settings/llm` (when `LLM_API_KEY` is not set in env)
- **Branding** — product name via `APP_NAME` (default `Telemodai`)

## Data model

```
User (telegram_id) → Bot → bot_members → chats[] → rules[]
```

Public endpoint: `POST /api/telegram/webhook/:botId`. Protection: per-bot `webhook_secret` + `X-Telegram-Bot-Api-Secret-Token`. Sign-in: Telegram OIDC.

## Stack

| Layer | Technologies |
|-------|----------------|
| Runtime | [Bun](https://bun.sh/) |
| App | [Nuxt 4](https://nuxt.com/), [Vue 3](https://vuejs.org/), [Tailwind CSS](https://tailwindcss.com/), [@nuxtjs/i18n](https://i18n.nuxtjs.org/) |
| Database | [PostgreSQL](https://www.postgresql.org/), [Drizzle ORM](https://orm.drizzle.team/) |
| Auth | Telegram OIDC (`TELEGRAM_LOGIN_BOT_ID`, `TELEGRAM_LOGIN_CLIENT_SECRET`) |
| LLM | OpenAI-compatible (`LLM_API_KEY`, optional `LLM_BASE_URL`, `LLM_MODEL`) |

## Quick start (development)

```bash
git clone https://github.com/telemodai/app.git
cd app
bun install
cp .env.example .env
```

Minimum `.env`: `DATABASE_URL`, `TELEGRAM_LOGIN_BOT_ID`, `TELEGRAM_LOGIN_CLIENT_SECRET`, `LLM_API_KEY`, `BASE_URL` (HTTPS for webhooks and OIDC callback).

Optional: `APP_NAME` (UI title), `SETTINGS_ENCRYPTION_KEY` (to store the LLM key in the DB on `/settings/llm`).

**Local PostgreSQL:** `docker compose up -d postgres`

**Dev HTTPS (OIDC + webhook):** `make tunnel` (cloudflared) → `BASE_URL=https://….trycloudflare.com`

```bash
bun run dev   # port 3001, migrations on startup
```

Full variable list: [`.env.example`](.env.example).

After pulling schema changes: **`bun run db:migrate`** (incremental migrations, data preserved). Policy: [.docs/database-migrations.md](.docs/database-migrations.md).

## Commands

```bash
bun run dev          # dev + migrations (port 3001)
bun run build
bun test
bun run db:migrate
bun run db:generate   # after editing Drizzle schema
make docker-build
```

## Production

Image: `ghcr.io/telemodai/app:latest` (CI: git tag `v*` or manual workflow run).

Before the repo move, tags through `v1.3.1` were published as `ghcr.io/tikhomirovv/tg-moderator-ai` — GitHub redirects old links, but update `image:` in compose for deploy.

Short guide: [deploy/README.md](deploy/README.md) · full guide: [.docs/deploy.md](.docs/deploy.md)

Health: `GET /api/health` → `{"ok":true}`. Container listens on port **3000**.

## Documentation

| Document | Description |
|----------|-------------|
| [.docs/project-overview.md](.docs/project-overview.md) | Product, audience, status |
| [.docs/prd.md](.docs/prd.md) | Scenarios, requirements, constraints |
| [.docs/technical-design.md](.docs/technical-design.md) | Stack, API, layout, dev tunnel |
| [.docs/i18n.md](.docs/i18n.md) | Admin UI localization (en/ru) |
| [Production deploy](.docs/deploy.md) | GHCR, env, Traefik, checks |
| [Database migrations](.docs/database-migrations.md) | Incremental migrations |
| [deploy/compose.example.yml](deploy/compose.example.yml) | Traefik compose example |
| [AGENTS.md](AGENTS.md) | Context for AI agents |
| [.docs/logging.md](.docs/logging.md) | Log levels |
| [.docs/archive/SPEC-legacy.md](.docs/archive/SPEC-legacy.md) | Early spec archive (MongoDB) |

## API (summary)

| Method | Path | Description |
|--------|------|-------------|
| `GET/POST` | `/api/bots` | List / create |
| `GET/PUT` | `/api/bots/:id` | Details / update |
| `GET` | `/api/bots/:id/logs`, `.../statistics` | Logs, statistics |
| `GET/POST` | `/api/bots/:id/chats/:chatId/rules` | Chat rules / create |
| `GET/POST` | `/api/bots/:id/chats/:chatId/rule-templates` | Preset catalog / add to chat |
| `POST` | `/api/bots/join` | Join via access code |
| `GET` | `/api/dashboard` | Cross-bot dashboard |
| `GET/PUT` | `/api/settings/llm` | LLM settings (self-hosted) |
| `POST` | `/api/telegram/webhook/:botId` | Telegram webhook |
| `GET` | `/api/auth/telegram` | Start Telegram OIDC |
| `GET` | `/api/auth/session` | Current session |
| `POST` | `/api/auth/sign-out` | Sign out |

## Troubleshooting

- **Webhook / bot Problem** — `BASE_URL` must be public HTTPS
- **Database** — `DATABASE_URL`; after schema changes — `bun run db:migrate` (see [.docs/database-migrations.md](.docs/database-migrations.md))
- **LLM** — `LLM_API_KEY` in env **or** `/settings/llm` (requires `SETTINGS_ENCRYPTION_KEY`); env key wins
- **UI product name** — `APP_NAME` in `.env`; Docker entrypoint maps it to `NUXT_PUBLIC_APP_NAME`
- **Auth** — public HTTPS `BASE_URL` (`make tunnel` in dev); OIDC callback in BotFather

## License

Source code — [PolyForm Noncommercial 1.0.0](LICENSE): noncommercial use, modification, and distribution. Commercial use only under a separate agreement: [COMMERCIAL.md](COMMERCIAL.md).
