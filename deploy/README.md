# Deploy tg-moderator-ai (GHCR + Traefik)

Self-hosted production setup. PostgreSQL and Traefik are **not** included — connect your own database via `DATABASE_URL`.

## 1. Pull image from GHCR

Images are published by GitHub Actions on push to `master` and on git tags `v*`:

```bash
docker pull ghcr.io/tikhomirovv/tg-moderator-ai:latest
```

For a public repository the package is public by default. If pull fails with `denied`, open **GitHub → Packages → tg-moderator-ai → Package settings → Change visibility → Public**.

Tagged releases: `ghcr.io/tikhomirovv/tg-moderator-ai:v1.0.0`

## 2. Environment file (on server)

Create `.env` next to `compose.yml`:

```env
# Public HTTPS URL — required for Telegram webhooks and Better Auth
BASE_URL=https://moderator.example.com
BETTER_AUTH_URL=https://moderator.example.com

# Optional if reverse proxy / origins differ from auto-detect
# BETTER_AUTH_TRUSTED_ORIGINS=https://moderator.example.com

DATABASE_URL=postgresql://user:pass@db-host:5432/tgmoderator
BETTER_AUTH_SECRET=generate-with-openssl-rand-base64-32
LLM_API_KEY=sk-...

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_FROM=noreply@example.com

PORT=3000
```

On container start:

1. Database migrations run **before** the app accepts traffic (`docker/entrypoint.sh`).
2. Active bots get webhooks registered/reconciled (`setupWebhooks` on Nitro startup).

## 3. Docker Compose + Traefik

```bash
cp deploy/compose.example.yml compose.yml
# edit Host(`moderator.example.com`) in labels
docker network create traefik   # if not exists
docker compose up -d
```

Health check: `curl -fsS https://moderator.example.com/api/health` → `{"ok":true}`

## 4. Local image build (without CI)

```bash
make docker-build TAG=local
docker run --rm -p 3000:3000 --env-file .env ghcr.io/tikhomirovv/tg-moderator-ai:local
```

## Notes

- Dev app port remains **3001** (`bun run dev`). Container default port is **3000**.
- `docker-compose.yml` in repo root is for **local PostgreSQL** only, not production Traefik stack.
