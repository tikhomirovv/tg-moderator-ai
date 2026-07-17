#!/bin/sh
set -e

# Nuxt reads runtimeConfig.public.appName from NUXT_PUBLIC_APP_NAME at container start.
if [ -n "${APP_NAME:-}" ]; then
  export NUXT_PUBLIC_APP_NAME="${APP_NAME}"
fi

echo "Applying database migrations..."
node scripts/db-migrate.mjs

echo "Starting application..."
exec node .output/server/index.mjs
