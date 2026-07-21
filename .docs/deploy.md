# Production deploy — tg-moderator-ai

Self-hosted production guide. Образ приложения в Docker; PostgreSQL и Traefik — **снаружи**, настраиваются администратором.

См. также: [deploy/compose.example.yml](../deploy/compose.example.yml) — пример Traefik compose.

## 1. Обзор

| Компонент | Где живёт |
|-----------|-----------|
| Nuxt 4 / Nitro app | Docker-контейнер из GHCR |
| PostgreSQL | Ваш сервер / managed DB (`DATABASE_URL`) |
| HTTPS / reverse proxy | Traefik (или аналог) |
| SMTP | Не используется (вход через Telegram OIDC) |
| LLM API | OpenAI-compatible (`LLM_API_KEY`, опционально `LLM_BASE_URL`) |
| Telegram | Webhook на публичный `BASE_URL` |

При старте контейнера:

1. **Миграции БД** (`docker/entrypoint.sh`)
2. Запуск Nitro на порту **3000** (зашит в Docker-образе, не в `.env`)
3. **`setupWebhooks()`** — reconcile webhook для active-ботов

## 2. Требования

- VPS Linux **amd64** (образ собирается под `linux/amd64` в CI)
- Домен с **HTTPS** (Let's Encrypt через Traefik или иной способ)
- PostgreSQL 14+ (доступен из сети контейнера)
- Traefik уже настроен (external network `traefik`)
- API-ключ LLM; Telegram Web Login credentials (`TELEGRAM_LOGIN_*`)

## 3. Образ GHCR

```
ghcr.io/telemodai/app:latest   # git tag v* или ручной workflow
ghcr.io/telemodai/app:v1.3.1   # git tag v1.3.1
```

Ранее (до переноса репозитория): `ghcr.io/tikhomirovv/tg-moderator-ai` — теги до смены CI остаются там; в `compose.yml` обновите `image:` на новый путь.

CI: workflow [`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml) — **только** push тега `v*` или **Run workflow** в Actions. Push в `master` образ не собирает.

### Публикация нового образа

```bash
git tag v1.2.3
git push origin v1.2.3
```

Или: GitHub → **Actions** → **Publish Docker image** → **Run workflow** (соберёт `latest` + `sha-…` с текущего ref).

### `docker pull` denied

Для публичного репозитория пакет обычно public. Если pull падает:

**GitHub → Packages → tg-moderator-ai → Package settings → Change visibility → Public**

## 4. Переменные окружения

Создайте `.env` рядом с `compose.yml` на сервере (**не коммитить**).

| Переменная | Обязательно | Назначение |
|------------|-------------|------------|
| `BASE_URL` | да | Публичный HTTPS URL (Telegram webhook + OIDC callback) |
| `TELEGRAM_LOGIN_BOT_ID` | да | Numeric bot id из BotFather Web Login |
| `TELEGRAM_LOGIN_CLIENT_SECRET` | да | Web Login secret (не moderation bot token) |
| `DATABASE_URL` | да | PostgreSQL connection string |
| `APP_NAME` | нет | Название продукта в UI (шапка, заголовки, login bot); default `Telemodai` |
| `LLM_API_KEY` | да | Ключ LLM API |
| `LLM_BASE_URL` | нет | OpenRouter / Polza / custom gateway |
| `LLM_MODEL` | нет | Модель (default в `.env.example`) |
| `LOG_LEVEL` | нет | `info` / `debug` |

В production обычно:

```env
BASE_URL=https://moderator.example.com
TELEGRAM_LOGIN_BOT_ID=123456789
TELEGRAM_LOGIN_CLIENT_SECRET=...
```

Redirect URI в BotFather: `{BASE_URL}/api/auth/telegram/callback`

## 5. Деплой с Traefik (пошагово)

```bash
# на сервере
mkdir -p ~/tg-moderator && cd ~/tg-moderator
cp /path/to/repo/deploy/compose.example.yml compose.yml
nano compose.yml   # Host(`moderator.example.com`) в labels
nano .env          # переменные из раздела 4

docker network create traefik   # если ещё нет
docker compose pull
docker compose up -d
```

Пример compose: [deploy/compose.example.yml](../deploy/compose.example.yml).

## 6. Проверка после деплоя

```bash
curl -fsS https://moderator.example.com/api/health
# → {"ok":true}
```

Чеклист:

1. **Health** — `GET /api/health` → `{"ok":true}`
2. **Auth** — логин через Telegram в админке
3. **Бот** — Enable → в логах `Webhook set for bot …`
4. **Telegram** — тестовое сообщение в чат с правилами

## 7. Обновление версии

```bash
docker compose pull
docker compose up -d
```

Откат: зафиксируйте тег образа (`v1.0.0`) в `compose.yml` вместо `latest`, затем `pull && up -d`.

## 8. Локальная сборка (без CI)

```bash
make docker-build TAG=local
docker run --rm -p 3000:3000 --env-file .env ghcr.io/telemodai/app:local
```

## 9. Troubleshooting

| Симптом | Что проверить |
|---------|----------------|
| Бот «Problem», webhook не ставится | `BASE_URL` — публичный HTTPS; совпадает с URL в Telegram |
| Auth redirect loop | `BASE_URL` = URL в браузере; OIDC callback в BotFather совпадает |
| `pull denied` | Видимость GHCR package → Public |
| Миграции / БД | `DATABASE_URL` доступен; логи entrypoint при старте |
| LLM не отвечает | `LLM_API_KEY`, при gateway — `LLM_BASE_URL` + `LLM_MODEL` |

## 10. Operator CLI (SaaS)

When `DEPLOYMENT_MODE=saas`, run maintenance commands inside the running app container. The binary is **`cli`** on `PATH` (`/usr/local/bin/cli`).

**Promo codes** — create purchase discount codes:

```bash
docker compose exec -it app cli promo create
```

`-it` is required for interactive prompts. `DATABASE_URL` is already in the container env.

Non-interactive example:

```bash
docker compose exec app cli promo create --code LAUNCH20 --percent 20
```

Local dev (with `.env`):

```bash
bun run cli -- promo create --code DEV10 --percent 15
bun run cli -- --help
```

Not operator CLI: `scripts/db-migrate.mjs` (container entrypoint / `bun run db:migrate`), `bun run release:notes` (release workflow).

See [billing-design.md](billing-design.md) for promo redemption and checkout behavior. Future subcommands (e.g. `cli credits grant`) land in follow-up issues.

## Порты

| Окружение | Порт приложения |
|-----------|-----------------|
| Dev (`bun run dev`) | **3001** |
| Docker / production | **3000** |

Корневой `docker-compose.yml` в репозитории — **только локальный PostgreSQL** для разработки, не production stack.

## Dev HTTPS (cloudflared)

Для локальной разработки webhook и Telegram OIDC нужен публичный HTTPS:

```bash
bun run dev          # порт 3001
make tunnel          # cloudflared → скопировать URL в BASE_URL
```

Подробнее: [technical-design.md](technical-design.md#dev-https-tunnel). **localtunnel не используем.**
