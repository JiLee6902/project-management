#!/bin/sh
set -e

echo "Starting ${APP_NAME}..."

# Hybrid mode: Run migrations only if RUN_MIGRATIONS=true
# - CI/CD: Set RUN_MIGRATIONS=false (migrations run separately)
# - Local/Dev: Set RUN_MIGRATIONS=true (migrations run in entrypoint)
if [ "$RUN_MIGRATIONS" = "true" ] && [ "$APP_NAME" = "app-api" ]; then
    echo "Running database migrations..."
    node ./node_modules/typeorm/cli.js migration:run -d dist/libs/entity/data-source.js
    echo "Migrations completed."
fi

echo "Starting application..."
exec node dist/apps/${APP_NAME}/main.js
