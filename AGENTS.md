# AGENTS.md — tg-moderator-ai

Стабильный контекст проекта. Задачи — GitHub Issues. Поведение при разработке — `.cursor/rules/`.

## Проект

Self-hosted админка + Telegram webhook: AI-модерация чатов по настраиваемым правилам (LLM).

**Доменная модель:**

```
User → Workspace (Better Auth Organization) → bots[] → chats[] → rules[] (ID из библиотеки workspace)
```

Правила — в workspace; применяются **на чат** (у одного бота в разных чатах — разные наборы).

Публичный endpoint без session: `POST /api/telegram/webhook/*` (Telegram). Защита: per-bot `webhook_secret` в БД + заголовок `X-Telegram-Bot-Api-Secret-Token`.

## Стек

- Bun, Nuxt 4, Nitro, Vue 3, Tailwind
- PostgreSQL, Drizzle
- Better Auth (email + password; Organization = Workspace в UI)
- LLM: OpenAI-compatible API via `LLM_API_KEY`, optional `LLM_BASE_URL` (OpenRouter/Polza), `LLM_MODEL`, `LLM_PROVIDER`

Код и коммиты: **English**. Общение с пользователем: **RU**.

## Dev-окружение

- App: `bun run dev` → порт **3001** (`nuxt.config.ts`)
- PostgreSQL на Orange Pi: `pi.home` / `192.168.0.200`, порт **54321**, db/user `tgmoderator`
- Mailpit: `pi.home:1025`, UI `https://mail.pi.home/`
- Dev HTTPS tunnel: **localtunnel only** — `bunx localtunnel --port 3001` → `BASE_URL=https://….loca.lt`
- Переменные: `.env.example` → локальный `.env`

## Команды

```bash
bun install
bun run dev
bun run build
bun test
```
