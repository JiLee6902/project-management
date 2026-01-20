#!/bin/sh
set -e

echo "Starting ${APP_NAME}..."

# Only run migrations for app-api to avoid race conditions
if [ "$APP_NAME" = "app-api" ]; then
    echo "Running database migrations..."
    node ./node_modules/typeorm/cli.js migration:run -d dist/libs/entity/data-source.js
    echo "Migrations completed."
fi

echo "Starting application..."
exec node dist/apps/${APP_NAME}/main.js
