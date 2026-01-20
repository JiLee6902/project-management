#!/bin/sh
set -e

echo "=========================================="
echo "  Database Migration Runner"
echo "=========================================="

# Validate required environment variables
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ]; then
    echo "Error: DB_HOST and DB_NAME environment variables are required"
    exit 1
fi

echo "Database: $DB_HOST:${DB_PORT:-5432}/$DB_NAME"
echo ""

# Wait for database to be ready
echo "Waiting for database connection..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if node -e "
        const { Client } = require('pg');
        const client = new Client({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        client.connect()
            .then(() => { client.end(); process.exit(0); })
            .catch(() => process.exit(1));
    " 2>/dev/null; then
        echo "Database is ready!"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for database... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "Error: Could not connect to database after $MAX_RETRIES attempts"
    exit 1
fi

echo ""
echo "Running migrations..."
echo "------------------------------------------"

node ./node_modules/typeorm/cli.js migration:run -d dist/libs/entity/data-source.js

EXIT_CODE=$?

echo "------------------------------------------"
if [ $EXIT_CODE -eq 0 ]; then
    echo "Migrations completed successfully!"
else
    echo "Migration failed with exit code: $EXIT_CODE"
fi
echo "=========================================="

exit $EXIT_CODE
