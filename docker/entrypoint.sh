#!/bin/sh
set -e

echo "Applying database migrations..."
node scripts/db-migrate.mjs

echo "Starting application..."
exec node .output/server/index.mjs
