.PHONY: help install docker-up docker-down docker-logs docker-ps \
        dev dev-api dev-cronjob dev-notification \
        build build-api build-cronjob build-notification build-all \
        prod prod-api prod-cronjob prod-notification \
        migrate migrate-generate migrate-run migrate-revert \
        lint format clean

# Colors
GREEN  := \033[0;32m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
NC     := \033[0m # No Color

# Default target
help:
	@echo ""
	@echo "$(CYAN)=====================================$(NC)"
	@echo "$(CYAN)  Project Management - NestJS Server $(NC)"
	@echo "$(CYAN)=====================================$(NC)"
	@echo ""
	@echo "$(GREEN)Docker Commands:$(NC)"
	@echo "  make docker-up       - Start all Docker containers"
	@echo "  make docker-down     - Stop all Docker containers"
	@echo "  make docker-logs     - View Docker container logs"
	@echo "  make docker-ps       - List running containers"
	@echo "  make docker-restart  - Restart all Docker containers"
	@echo ""
	@echo "$(GREEN)Development Commands:$(NC)"
	@echo "  make install         - Install dependencies"
	@echo "  make dev             - Start all services (dev mode)"
	@echo "  make dev-api         - Start app-api (dev mode)"
	@echo "  make dev-cronjob     - Start cronjob-worker (dev mode)"
	@echo "  make dev-notification - Start notification service (dev mode)"
	@echo ""
	@echo "$(GREEN)Build Commands:$(NC)"
	@echo "  make build-all       - Build all services"
	@echo "  make build-api       - Build app-api"
	@echo "  make build-cronjob   - Build cronjob-worker"
	@echo "  make build-notification - Build notification service"
	@echo ""
	@echo "$(GREEN)Production Commands:$(NC)"
	@echo "  make prod-api        - Start app-api (production)"
	@echo "  make prod-cronjob    - Start cronjob-worker (production)"
	@echo "  make prod-notification - Start notification (production)"
	@echo ""
	@echo "$(GREEN)Database Commands:$(NC)"
	@echo "  make migrate-generate - Generate new migration"
	@echo "  make migrate-run     - Run pending migrations"
	@echo "  make migrate-revert  - Revert last migration"
	@echo ""
	@echo "$(GREEN)Utility Commands:$(NC)"
	@echo "  make lint            - Run ESLint"
	@echo "  make format          - Format code with Prettier"
	@echo "  make clean           - Remove dist folders"
	@echo ""

# Docker Commands

docker-up:
	@echo "$(GREEN)Starting Docker containers...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Containers started!$(NC)"
	@echo "$(YELLOW)Services:$(NC)"
	@echo "  - PostgreSQL: localhost:5434"
	@echo "  - Redis: localhost:6379"
	@echo "  - Kafka: localhost:9092"
	@echo "  - Kafka UI: http://localhost:8080"

docker-down:
	@echo "$(YELLOW)Stopping Docker containers...$(NC)"
	docker-compose down
	@echo "$(GREEN)Containers stopped!$(NC)"

docker-logs:
	docker-compose logs -f

docker-ps:
	docker-compose ps

docker-restart:
	@echo "$(YELLOW)Restarting Docker containers...$(NC)"
	docker-compose down
	docker-compose up -d
	@echo "$(GREEN)Containers restarted!$(NC)"

docker-clean:
	@echo "$(YELLOW)Removing Docker containers and volumes...$(NC)"
	docker-compose down -v
	@echo "$(GREEN)Containers and volumes removed!$(NC)"

# Development Commands

install:
	@echo "$(GREEN)Installing dependencies...$(NC)"
	npm install

dev:
	@echo "$(GREEN)Starting all services in development mode...$(NC)"
	@echo "$(YELLOW)Use 'make dev-api', 'make dev-cronjob', or 'make dev-notification' separately$(NC)"
	npm run start:app-api:dev

dev-api:
	@echo "$(GREEN)Starting app-api in development mode...$(NC)"
	npm run start:app-api:dev

dev-cronjob:
	@echo "$(GREEN)Starting cronjob-worker in development mode...$(NC)"
	npm run start:cronjob-worker:dev

dev-notification:
	@echo "$(GREEN)Starting notification service in development mode...$(NC)"
	npm run start:notification:dev

debug:
	@echo "$(GREEN)Starting app-api in debug mode...$(NC)"
	npm run start:app-api:debug

# Build Commands

build-all: build-api build-cronjob build-notification
	@echo "$(GREEN)All services built!$(NC)"

build-api:
	@echo "$(GREEN)Building app-api...$(NC)"
	npm run build:app-api

build-cronjob:
	@echo "$(GREEN)Building cronjob-worker...$(NC)"
	npm run build:cronjob-worker

build-notification:
	@echo "$(GREEN)Building notification service...$(NC)"
	npm run build:notification

# Production Commands

prod-api: build-api
	@echo "$(GREEN)Starting app-api in production mode...$(NC)"
	npm run start:app-api:prod

prod-cronjob: build-cronjob
	@echo "$(GREEN)Starting cronjob-worker in production mode...$(NC)"
	npm run start:cronjob-worker:prod

prod-notification: build-notification
	@echo "$(GREEN)Starting notification service in production mode...$(NC)"
	npm run start:notification:prod

# Database Migration Commands

migrate-generate:
	@echo "$(GREEN)Generating migration...$(NC)"
	npm run migration:generate

migrate-run:
	@echo "$(GREEN)Running migrations...$(NC)"
	npm run migration:run

migrate-revert:
	@echo "$(YELLOW)Reverting last migration...$(NC)"
	npm run migration:revert

# Utility Commands

lint:
	@echo "$(GREEN)Running ESLint...$(NC)"
	npm run lint

format:
	@echo "$(GREEN)Formatting code with Prettier...$(NC)"
	npm run format

clean:
	@echo "$(YELLOW)Removing dist folders...$(NC)"
	rm -rf dist
	rm -rf apps/app-api/dist
	rm -rf apps/cronjob-worker/dist
	rm -rf apps/notification/dist
	@echo "$(GREEN)Cleaned!$(NC)"

# Quick Start

setup: install docker-up migrate-run
	@echo "$(GREEN)Setup complete!$(NC)"
	@echo "$(YELLOW)Run 'make dev' to start the development server$(NC)"

start: docker-up dev-api
	@echo "$(GREEN)Server started!$(NC)"
