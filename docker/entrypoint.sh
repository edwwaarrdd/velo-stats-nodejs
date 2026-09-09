#!/usr/bin/env bash
set -e

# The environment file and SQLite database live in a bind-mounted directory, so
# make sure both exist and are current before the app or a worker starts.
if [ ! -f /app/.env ]; then
    cp /app/.env.example /app/.env
fi

mkdir -p /app/database
touch /app/database/database.sqlite
npm run --silent migration:run

exec "$@"
