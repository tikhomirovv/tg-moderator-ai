IMAGE ?= ghcr.io/tikhomirovv/tg-moderator-ai
TAG   ?= local
DEV_PORT ?= 3001

.PHONY: docker-build tunnel

docker-build:
	docker build -t $(IMAGE):$(TAG) .

# HTTPS tunnel for Telegram OIDC / webhooks (HTTP/2 — QUIC often blocked on local networks).
tunnel:
	TUNNEL_TRANSPORT_PROTOCOL=http2 bunx cloudflared tunnel --url http://localhost:$(DEV_PORT)
