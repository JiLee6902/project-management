# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments
ARG APP_NAME=app-api

# Build the application
RUN npm run build:${APP_NAME}

# Compile migration data-source separately (webpack bundles to single file, migration CLI needs individual files)
RUN npx tsc libs/entity/src/data-source.migration.ts libs/entity/src/migrations/*.ts \
    --outDir dist --rootDir . --module commonjs --target ES2023 \
    --esModuleInterop --experimentalDecorators --emitDecoratorMetadata \
    --skipLibCheck --resolveJsonModule

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/false nestjs

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --legacy-peer-deps --omit=dev && \
    npm cache clean --force

# Build arguments
ARG APP_NAME=app-api
ARG APP_PORT=3000

# Copy built application
COPY --from=builder /app/dist ./dist

# Set environment variables (ARG -> ENV for runtime)
ENV NODE_ENV=production
ENV PORT=${APP_PORT}
ENV APP_NAME=${APP_NAME}

# Change ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE ${APP_PORT}

# Health check - using /api endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api || exit 1

# Start the application directly (shell form to expand $APP_NAME)
CMD ["sh", "-c", "node dist/apps/$APP_NAME/main.js"]
