# tg-moderator-ai

Self-hosted веб-админка и Telegram webhook для AI-модерации чатов. Правила настраиваются в workspace и применяются **на чат** — у одного бота в разных чатах могут быть разные наборы правил.

Репозиторий: [github.com/tikhomirovv/tg-moderator-ai](https://github.com/tikhomirovv/tg-moderator-ai)

## Возможности

- **AI-модерация** — анализ сообщений через OpenAI-compatible API (OpenAI, OpenRouter, Polza и др.)
- **Правила в workspace** — библиотека правил; в чате выбирается подмножество; per-rule delete/ban/warnings/whitelist
- **Действия модератора** — предупреждения, удаление, бан по настройкам правила
- **Silent mode** — только логи в приложении, без действий в Telegram
- **Мульти-tenant** — workspace (Better Auth Organization), приглашения участников
- **Webhook под капотом** — статус «Working / Disabled / Problem»
- **Логи и статистика** — действия модерации по боту

## Модель данных

```
User → Workspace → bots[] → chats[] → rules[] (id из библиотеки workspace)
```

Публичный endpoint: `POST /api/telegram/webhook/:botId`. Защита: per-bot `webhook_secret` + `X-Telegram-Bot-Api-Secret-Token`.

## Стек

| Слой | Технологии |
|------|------------|
| Runtime | [Bun](https://bun.sh/) |
| App | [Nuxt 4](https://nuxt.com/), [Vue 3](https://vuejs.org/), [Tailwind CSS](https://tailwindcss.com/) |
| БД | [PostgreSQL](https://www.postgresql.org/), [Drizzle ORM](https://orm.drizzle.team/) |
| Auth | [Better Auth](https://www.better-auth.com/) |
| LLM | OpenAI-compatible (`LLM_API_KEY`, опционально `LLM_BASE_URL`) |

## Быстрый старт (разработка)

```bash
git clone https://github.com/tikhomirovv/tg-moderator-ai.git
cd tg-moderator-ai
bun install
cp .env.example .env
```

Минимум в `.env`: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `LLM_API_KEY`, `BASE_URL` (HTTPS для webhook), `SMTP_*`.

**PostgreSQL локально:** `docker compose up -d postgres`

**Dev HTTPS (webhook):** `bunx localtunnel --port 3001` → `BASE_URL=https://….loca.lt`

```bash
bun run dev   # порт 3001, миграции автоматически
```

Полный список переменных — в [`.env.example`](.env.example).

После pull со сменой схемы: **`bun run db:migrate`** (incremental миграции, данные сохраняются). Политика: [.docs/database-migrations.md](.docs/database-migrations.md).

## Команды

```bash
bun run dev          # dev + миграции (порт 3001)
bun run build
bun test
bun run db:migrate
bun run db:generate   # после правки Drizzle schema
make docker-build
```

## Production

Образ: `ghcr.io/tikhomirovv/tg-moderator-ai:latest` (CI: git tag `v*` или ручной запуск workflow).

Кратко: [deploy/README.md](deploy/README.md) · полная инструкция: [.docs/deploy.md](.docs/deploy.md)

Health: `GET /api/health` → `{"ok":true}`. В контейнере порт **3000**.

## Дополнительные документы

| Документ | Описание |
|----------|----------|
| [Production deploy](.docs/deploy.md) | Пошаговый production deploy (GHCR, env, Traefik, проверки) |
| [Database migrations](.docs/database-migrations.md) | Incremental миграции, политика no data loss |
| [Release notes](/release-notes) | История релизов для пользователей (после публикации тега) |
| [deploy/compose.example.yml](deploy/compose.example.yml) | Пример Traefik compose |
| [AGENTS.md](AGENTS.md) | Контекст для разработки |
| [.docs/SPEC.md](.docs/SPEC.md) | Спецификация (может отставать от кода) |

## API (кратко)

| Метод | Путь | Описание |
|-------|------|----------|
| `GET/POST` | `/api/bots` | Список / создание |
| `GET/PUT` | `/api/bots/:id` | Детали / обновление |
| `GET` | `/api/bots/:id/logs`, `.../statistics` | Логи, статистика |
| `GET/POST` | `/api/config/rules` | Список / создание |
| `PUT/DELETE` | `/api/config/rules/:id` | Обновление / удаление |
| `POST` | `/api/telegram/webhook/:botId` | Webhook Telegram |
| `*` | `/api/auth/*` | Better Auth |

## Устранение неполадок

- **Webhook / бот Problem** — `BASE_URL` публичный HTTPS
- **БД** — `DATABASE_URL`; после смены схемы — `bun run db:migrate` (см. [.docs/database-migrations.md](.docs/database-migrations.md))
- **LLM** — `LLM_API_KEY`, при gateway — `LLM_BASE_URL` + `LLM_MODEL`
- **Auth** — `BETTER_AUTH_URL` совпадает с URL в браузере

## Лицензия

[CC-BY-NC-4.0](LICENSE)
