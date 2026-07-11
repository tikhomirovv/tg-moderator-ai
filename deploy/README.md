# Deploy (GHCR + Traefik)

Краткая шпаргалка. **Полная production-инструкция:** [.docs/deploy.md](../.docs/deploy.md)

```bash
docker pull ghcr.io/tikhomirovv/tg-moderator-ai:latest
cp deploy/compose.example.yml compose.yml
# .env + docker compose up -d
```

Health: `GET /api/health` → `{"ok":true}`
