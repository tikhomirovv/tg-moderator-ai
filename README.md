# Telemodai (tg-moderator-ai)

**🪴 AI-модерация для здоровья сообществ** · *🪴 AI moderation for healthy communities*

Self-hosted веб-админка и Telegram webhook для AI-модерации чатов. Правила настраиваются **per chat** — у одного бота в разных чатах могут быть разные наборы правил.

Репозиторий: [github.com/telemodai/app](https://github.com/telemodai/app)

## Возможности

- **AI-модерация** — анализ сообщений через OpenAI-compatible API (OpenAI, OpenRouter, Polza и др.)
- **Правила per chat** — свой набор правил на каждый чат; шаблоны из каталога; per-rule delete/ban/warnings
- **Действия модератора** — предупреждения, удаление, бан по настройкам правила
- **Silent mode** — только логи в приложении, без действий в Telegram
- **Команда на боте** — owner/manager, join по access code
- **Webhook под капотом** — статус «Working / Disabled / Problem»
- **Логи, статистика, аудит** — действия модерации и решения модели по боту
- **Интерфейс en/ru** — переключатель языка в футере
- **Self-hosted LLM** — настройки модели в `/settings/llm` (если `LLM_API_KEY` не задан в env)
- **Брендинг** — название продукта через `APP_NAME` (default `Telemodai`)

## Модель данных

```
User (telegram_id) → Bot → bot_members → chats[] → rules[]
```

Публичный endpoint: `POST /api/telegram/webhook/:botId`. Защита: per-bot `webhook_secret` + `X-Telegram-Bot-Api-Secret-Token`. Вход: Telegram OIDC.

## Стек

| Слой | Технологии |
|------|------------|
| Runtime | [Bun](https://bun.sh/) |
| App | [Nuxt 4](https://nuxt.com/), [Vue 3](https://vuejs.org/), [Tailwind CSS](https://tailwindcss.com/), [@nuxtjs/i18n](https://i18n.nuxtjs.org/) |
| БД | [PostgreSQL](https://www.postgresql.org/), [Drizzle ORM](https://orm.drizzle.team/) |
| Auth | Telegram OIDC (`TELEGRAM_LOGIN_BOT_ID`, `TELEGRAM_LOGIN_CLIENT_SECRET`) |
| LLM | OpenAI-compatible (`LLM_API_KEY`, опционально `LLM_BASE_URL`, `LLM_MODEL`) |

## Быстрый старт (разработка)

```bash
git clone https://github.com/telemodai/app.git
cd app
bun install
cp .env.example .env
```

Минимум в `.env`: `DATABASE_URL`, `TELEGRAM_LOGIN_BOT_ID`, `TELEGRAM_LOGIN_CLIENT_SECRET`, `LLM_API_KEY`, `BASE_URL` (HTTPS для webhook и OIDC callback).

Опционально: `APP_NAME` (название в UI), `SETTINGS_ENCRYPTION_KEY` (для сохранения LLM-ключа в БД на `/settings/llm`).

**PostgreSQL локально:** `docker compose up -d postgres`

**Dev HTTPS (OIDC + webhook):** `make tunnel` (cloudflared) → `BASE_URL=https://….trycloudflare.com`

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

Образ: `ghcr.io/telemodai/app:latest` (CI: git tag `v*` или ручной запуск workflow).

До переноса репозитория теги `v1.3.1` и ранее публиковались как `ghcr.io/tikhomirovv/tg-moderator-ai` — GitHub перенаправляет старые ссылки на репозиторий, но для deploy лучше обновить `image:` в compose.

Кратко: [deploy/README.md](deploy/README.md) · полная инструкция: [.docs/deploy.md](.docs/deploy.md)

Health: `GET /api/health` → `{"ok":true}`. В контейнере порт **3000**.

## Документация

| Документ | Описание |
|----------|----------|
| [.docs/project-overview.md](.docs/project-overview.md) | Продукт, аудитория, статус |
| [.docs/prd.md](.docs/prd.md) | Сценарии, требования, ограничения |
| [.docs/technical-design.md](.docs/technical-design.md) | Стек, API, структура, dev tunnel |
| [.docs/i18n.md](.docs/i18n.md) | Локализация admin UI (en/ru) |
| [Production deploy](.docs/deploy.md) | GHCR, env, Traefik, проверки |
| [Database migrations](.docs/database-migrations.md) | Incremental миграции |
| [deploy/compose.example.yml](deploy/compose.example.yml) | Пример Traefik compose |
| [AGENTS.md](AGENTS.md) | Контекст для AI-агентов |
| [.docs/logging.md](.docs/logging.md) | Уровни логирования |
| [.docs/archive/SPEC-legacy.md](.docs/archive/SPEC-legacy.md) | Архив ранней спецификации (MongoDB) |

## API (кратко)

| Метод | Путь | Описание |
|-------|------|----------|
| `GET/POST` | `/api/bots` | Список / создание |
| `GET/PUT` | `/api/bots/:id` | Детали / обновление |
| `GET` | `/api/bots/:id/logs`, `.../statistics` | Логи, статистика |
| `GET/POST` | `/api/bots/:id/chats/:chatId/rules` | Правила чата / создание |
| `GET/POST` | `/api/bots/:id/chats/:chatId/rule-templates` | Каталог пресетов / добавление в чат |
| `POST` | `/api/bots/join` | Join по access code |
| `GET` | `/api/dashboard` | Дашборд по ботам пользователя |
| `GET/PUT` | `/api/settings/llm` | LLM settings (self-hosted) |
| `POST` | `/api/telegram/webhook/:botId` | Webhook Telegram |
| `GET` | `/api/auth/telegram` | Старт Telegram OIDC |
| `GET` | `/api/auth/session` | Текущая сессия |
| `POST` | `/api/auth/sign-out` | Выход |

## Устранение неполадок

- **Webhook / бот Problem** — `BASE_URL` публичный HTTPS
- **БД** — `DATABASE_URL`; после смены схемы — `bun run db:migrate` (см. [.docs/database-migrations.md](.docs/database-migrations.md))
- **LLM** — `LLM_API_KEY` в env **или** `/settings/llm` (нужен `SETTINGS_ENCRYPTION_KEY`); env-ключ имеет приоритет
- **Название в UI** — `APP_NAME` в `.env`; в Docker entrypoint мапит в `NUXT_PUBLIC_APP_NAME`
- **Auth** — `BASE_URL` публичный HTTPS (`make tunnel` в dev); OIDC callback в BotFather

## Лицензия

Исходный код — [PolyForm Noncommercial 1.0.0](LICENSE): некоммерческое использование, изменение и распространение. Коммерческое использование — только по отдельному соглашению: [COMMERCIAL.md](COMMERCIAL.md).
