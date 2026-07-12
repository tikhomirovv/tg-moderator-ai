# syntax=docker/dockerfile:1

FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
RUN bun run build

FROM node:22-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output
COPY --from=build /app/server/database/migrations ./server/database/migrations
COPY --from=build /app/data/releases ./data/releases
COPY scripts/db-migrate.mjs ./scripts/db-migrate.mjs
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ARG PORT=3000
ENV HOST=0.0.0.0
ENV PORT=${PORT}

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/api/health" || exit 1

ENTRYPOINT ["/entrypoint.sh"]
