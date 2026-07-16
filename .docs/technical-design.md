# Technical design — tg-moderator-ai

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| App | Nuxt 4, Nitro, Vue 3, Tailwind, **@nuxtjs/i18n** (en + ru admin UI) |
| Database | PostgreSQL, Drizzle ORM |
| Auth | Custom Telegram OIDC (PKCE + `jose` JWT verify) — **not** Better Auth |
| LLM | OpenAI-compatible client (`LLM_API_KEY`, optional `LLM_BASE_URL`, `LLM_MODEL`) |
| Logging | Pino (`LOG_LEVEL`) |

## Key decisions

1. **Bot-centric domain** — no workspace/org tables; access via `bot_members`
2. **Telegram OIDC** — login bot separate from moderation bots (`TELEGRAM_LOGIN_*`)
3. **Rule presets in code** — `RULE_TEMPLATES` catalog; DB stores copies per bot with UUID `rule.id`
4. **Webhook per bot** — `POST /api/telegram/webhook/:botId` + secret token header
5. **Incremental migrations only** — see [database-migrations.md](database-migrations.md)
6. **Admin UI i18n** — `@nuxtjs/i18n`, `no_prefix`, lazy `i18n/locales/`; browser locale + footer switcher; see [i18n.md](i18n.md)

## Core entities (PostgreSQL)

| Table / concept | Purpose |
|-----------------|---------|
| `users` | `telegram_id`, profile from OIDC |
| `sessions` | Session token for cookie auth |
| `bots` | Moderation bot config + token |
| `bot_members` | `owner` / `manager` per user per bot |
| `bot_access_codes` | Invite codes for managers |
| `rules` | Per-bot moderation rules |
| `chats`, `chat_rules` | Telegram chats and assigned rules |
| `moderation_actions`, `moderation_decisions` | Audit trail |
| `chat_statistics` | Aggregated stats |

## API surface (authenticated unless noted)

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/health` | Public |
| `GET` | `/api/auth/telegram` | Start OIDC; optional `returnTo` |
| `GET` | `/api/auth/telegram/callback` | OIDC callback |
| `GET` | `/api/auth/session` | Current user |
| `POST` | `/api/auth/sign-out` | Clear session |
| `GET/POST` | `/api/bots` | List / create |
| `POST` | `/api/bots/join` | Join by access code |
| `GET/PUT` | `/api/bots/:id` | Detail includes `my_role` |
| `GET/POST` | `/api/bots/:id/rules` | Rule CRUD |
| `GET/POST` | `/api/bots/:id/rule-templates` | Preset catalog / add |
| `GET` | `/api/bots/:id/team/*` | Access code, members |
| `GET` | `/api/bots/:id/logs`, `statistics`, `decisions` | Observability |
| `GET` | `/api/dashboard` | Cross-bot dashboard |
| `POST` | `/api/telegram/webhook/:botId` | **Public** (secret header) |

## Project structure (high level)

```
pages/           # Nuxt UI (bots, rules, login, dashboard)
i18n/locales/    # en.json, ru.json — admin UI strings
composables/     # useAppLocale, usePageBreadcrumbs, …
components/      # layout, dashboard, bots
server/api/      # Nitro routes
server/core/     # Moderation, dashboard, bot lifecycle
server/database/ # Drizzle schema, repositories, migrations
lib/             # Isomorphic helpers (e.g. auth returnTo, APP_LINKS)
middleware/      # Global auth redirect
```

## Engineering rules

- **Package manager:** Bun only (`bun install`, `bun test`, `bun run dev`)
- **Commits / code / comments:** English
- **User communication:** Russian
- **Env:** `.env` local only; `.env.example` committed
- **Bot route param:** use `requireBotIdParam(event)` from `server/utils/get-bot-id-param.ts`
- **Tests:** unit tests under `tests/unit/`; run `bun test` after `server/**` changes
- **Admin UI strings:** no hardcoded copy in pages/components — use `$t()` / keys in `i18n/locales/`; see [i18n.md](i18n.md)

## Dev HTTPS tunnel

Telegram requires HTTPS for webhooks and OIDC. On dev machine:

```bash
# terminal 1
bun run dev

# terminal 2
make tunnel
# copy https://….trycloudflare.com into .env as BASE_URL
```

`make tunnel` runs `cloudflared` with `TUNNEL_TRANSPORT_PROTOCOL=http2` (QUIC often blocked on LAN).

**Do not use localtunnel** — deprecated in this project.

## Ports

| Environment | Port |
|-------------|------|
| `bun run dev` | 3001 |
| Docker / production | 3000 |

## Security notes

- `returnTo` after login validated in `lib/auth-return-to.ts` (same-origin paths only)
- API routes (except auth start/callback, webhook, health) require session via `server/middleware/api-auth.ts`
- Bot operations require `bot_members` membership (`requireBotAccess`). Owner and manager share operational parity (chats, rules, moderation); **owner only** for bot delete, access codes, and team membership changes. The owner row cannot be removed from the team
