# AGENTS.md — tg-moderator-ai

Стабильный контекст проекта. Задачи — GitHub Issues. Поведение при разработке — `.cursor/rules/`.

## Проект

Self-hosted админка + Telegram webhook: AI-модерация чатов по настраиваемым правилам (LLM).

**Доменная модель:**

```
User (telegram_id)
  → Bot (owner_user_id)
      → bot_members (owner | manager)
      → bot_access_codes (invite)
      → rules (per bot)
      → chats → moderation
```

Правила хранятся **per bot**; пресеты — константы в `rule-templates.ts`, добавляются по одному из библиотеки на странице правил. Доступ к боту: owner или manager через `bot_members`; join по access code.

Публичный endpoint без session: `POST /api/telegram/webhook/*` (Telegram). Защита: per-bot `webhook_secret` в БД + заголовок `X-Telegram-Bot-Api-Secret-Token`.

## Стек

- Bun, Nuxt 4, Nitro, Vue 3, Tailwind
- PostgreSQL, Drizzle
- Telegram OIDC login (`TELEGRAM_LOGIN_BOT_ID`, `TELEGRAM_LOGIN_CLIENT_SECRET`, `BASE_URL`)
- LLM: OpenAI-compatible API via `LLM_API_KEY`, optional `LLM_BASE_URL` (OpenRouter/Polza), `LLM_MODEL`

Код и коммиты: **English**. Общение с пользователем: **RU**.

## Коммуникация с пользователем

Агент объясняет так, будто говорит с **джуниор-разработчиком**, который хорошо знает основы, но не погружён в контекст этого проекта.

**Как писать:**

- **Человеческий язык** — полные предложения, без телеграфного стиля и сухих списков без пояснений.
- **Подробно** — не ограничиваться одной строкой «можно взять #19». Объяснять, *что* за задача, *зачем* она, *что примерно придётся делать*, *есть ли подводные камни*.
- **Контекст** — если упоминаешь файл, API, issue или термин проекта — кратко поясни, что это и почему важно. Не предполагай, что пользователь уже читал issue или помнит прошлый разговор.
- **Структура** — сначала короткий вывод (1–2 предложения), потом детали. Сложное — простыми словами; жаргон — с расшифровкой при первом упоминании.
- **Практичность** — в конце ответа по возможности: что из этого следует, с чего логичнее начать, если пользователь хочет продолжить.

**Чего избегать:**

- Скупых ответов вроде «4 actionable, бери #19» без объяснения.
- Каскадов аббревиатур и имён файлов без контекста.
- Отсылок «как в прошлый раз» без напоминания сути.

Персона (лёгкий, дружелюбный тон) сохраняется, но **ясность важнее краткости**.

## Dev-окружение

- App: `bun run dev` → порт **3001** (`nuxt.config.ts`)
- PostgreSQL на Orange Pi: `pi.home` / `192.168.0.200`, порт **54321**, db/user `tgmoderator`
- Dev HTTPS tunnel: `make tunnel` (cloudflared, HTTP/2) → `BASE_URL=https://….trycloudflare.com`
- Переменные: `.env.example` → локальный `.env`

## Команды

```bash
bun install
bun run dev
bun run build
bun test
bun run db:migrate
```

## Миграции БД

Только **incremental** Drizzle migrations (`db:generate` → `db:migrate`). **Запрещено:** `DROP SCHEMA`, truncate, `db:reset`. Политика: [`.docs/database-migrations.md`](.docs/database-migrations.md).

## Логирование

Уровни и правила: [`docs/logging.md`](docs/logging.md). Переменная `LOG_LEVEL` (`info` по умолчанию, `debug` для отладки).

## Релизы и release notes

Два артефакта — **разная аудитория, не смешивать содержимое**:

| Аудитория | Где | Содержание |
|-----------|-----|------------|
| **Пользователь** | `data/releases/vX.Y.Z.md` → страница `/release-notes` в приложении | **Русский, человеческий язык** — что изменилось в продукте (боты, правила, модерация, UI). Без API, таблиц БД, миграций, CI, имён файлов, номеров issue |
| **Разработчики** | `.docs/releases/` (archive + `github-v*.md`), **git tag**, **GitHub Release** | **English** — conventional commits, linked hashes/issues; GitHub file **без frontmatter** |

Файлы в `data/releases/` — **только при публикации релиза** (тег `v*` + коммит). До первого релиза страница пустая.

Сбор черновиков: `bun run release:notes vX.Y.Z --write`. User-файл **переписать вручную**; если для пользователя нечего конкретного — нейтральное описание (см. skill). Technical — в репо, на GitHub Release и в аннотацию тега.

Процесс: [`.agents/skills/release/SKILL.md`](.agents/skills/release/SKILL.md).
