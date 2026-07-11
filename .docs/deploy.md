# Production deploy — tg-moderator-ai

Self-hosted production guide. Образ приложения в Docker; PostgreSQL, Traefik и SMTP — **снаружи**, настраиваются администратором.

См. также: [deploy/compose.example.yml](../deploy/compose.example.yml) — пример Traefik compose.

## 1. Обзор

| Компонент | Где живёт |
|-----------|-----------|
| Nuxt 4 / Nitro app | Docker-контейнер из GHCR |
| PostgreSQL | Ваш сервер / managed DB (`DATABASE_URL`) |
| HTTPS / reverse proxy | Traefik (или аналог) |
| SMTP | Prod-почта (verify, reset, invitations) |
| LLM API | OpenAI-compatible (`LLM_API_KEY`, опционально `LLM_BASE_URL`) |
| Telegram | Webhook на публичный `BASE_URL` |

При старте контейнера:

1. **Миграции БД** (`docker/entrypoint.sh`)
2. Запуск Nitro на `PORT` (по умолчанию **3000**)
3. **`setupWebhooks()`** — reconcile webhook для active-ботов

## 2. Требования

- VPS Linux **amd64** (образ собирается под `linux/amd64` в CI)
- Домен с **HTTPS** (Let's Encrypt через Traefik или иной способ)
- PostgreSQL 14+ (доступен из сети контейнера)
- Traefik уже настроен (external network `traefik`)
- API-ключ LLM, SMTP для auth-писем

## 3. Образ GHCR

```
ghcr.io/tikhomirovv/tg-moderator-ai:latest   # push в master
ghcr.io/tikhomirovv/tg-moderator-ai:v1.0.0   # git tag v*
```

CI: workflow [`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml) на push в `master` и теги `v*`.

### `docker pull` denied

Для публичного репозитория пакет обычно public. Если pull падает:

**GitHub → Packages → tg-moderator-ai → Package settings → Change visibility → Public**

## 4. Переменные окружения

Создайте `.env` рядом с `compose.yml` на сервере (**не коммитить**).

| Переменная | Обязательно | Назначение |
|------------|-------------|------------|
| `BASE_URL` | да | Публичный HTTPS URL (Telegram webhook) |
| `BETTER_AUTH_URL` | да | Тот же URL, что открывают пользователи в браузере |
| `BETTER_AUTH_SECRET` | да | `openssl rand -base64 32` |
| `DATABASE_URL` | да | PostgreSQL connection string |
| `LLM_API_KEY` | да | Ключ LLM API |
| `LLM_BASE_URL` | нет | OpenRouter / Polza / custom gateway |
| `LLM_MODEL` | нет | Модель (default в `.env.example`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | да (prod) | Почта; dev — Mailpit |
| `PORT` | нет | В контейнере: `3000` |
| `BETTER_AUTH_TRUSTED_ORIGINS` | нет | Доп. origins через запятую, если прокси/домен нестандартный |

В production обычно:

```env
BASE_URL=https://moderator.example.com
BETTER_AUTH_URL=https://moderator.example.com
```

`BETTER_AUTH_TRUSTED_ORIGINS` — когда браузер ходит с origin, отличного от `BETTER_AUTH_URL` (localtunnel в dev, кастомный proxy host).

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
2. **Auth** — логин в админку, email verify работает (SMTP)
3. **Бот** — Enable → в логах `Webhook set for bot …`
4. **Telegram** — тестовое сообщение в чат с правилами

`GET /api/auth/ok` — встроенный health Better Auth.

## 7. Обновление версии

```bash
docker compose pull
docker compose up -d
```

Откат: зафиксируйте тег образа (`v1.0.0`) в `compose.yml` вместо `latest`, затем `pull && up -d`.

## 8. Локальная сборка (без CI)

```bash
make docker-build TAG=local
docker run --rm -p 3000:3000 --env-file .env ghcr.io/tikhomirovv/tg-moderator-ai:local
```

## 9. Troubleshooting

| Симптом | Что проверить |
|---------|----------------|
| Бот «Problem», webhook не ставится | `BASE_URL` — публичный HTTPS; совпадает с URL в Telegram |
| Auth redirect loop | `BETTER_AUTH_URL` = URL в браузере; `BETTER_AUTH_SECRET` задан |
| `pull denied` | Видимость GHCR package → Public |
| Миграции / БД | `DATABASE_URL` доступен; логи entrypoint при старте |
| LLM не отвечает | `LLM_API_KEY`, при gateway — `LLM_BASE_URL` + `LLM_MODEL` |

## Порты

| Окружение | Порт приложения |
|-----------|-----------------|
| Dev (`bun run dev`) | **3001** |
| Docker / production | **3000** |

Корневой `docker-compose.yml` в репозитории — **только локальный PostgreSQL** для разработки, не production stack.
