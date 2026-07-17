# Deploy (GHCR + Traefik)

Краткая шпаргалка. **Полная production-инструкция:** [.docs/deploy.md](../.docs/deploy.md)

Образ в GHCR: после `git tag v1.2.3 && git push origin v1.2.3` или **Actions → Publish Docker image → Run workflow**.

```bash
docker pull ghcr.io/telemodai/app:latest
cp deploy/compose.example.yml compose.yml
# .env + docker compose up -d
```

Health: `GET /api/health` → `{"ok":true}`
