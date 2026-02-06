# Project Management System

A production-ready, microservices-based project management platform built with NestJS and React. Designed for teams to manage projects, tasks, sprints, and collaborate in real-time.

## Architecture Overview

```
                        ┌──────────────┐
                        │   Nginx      │
                        │   Reverse    │
                        │   Proxy      │
                        └──────┬───────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
       ┌──────▼──────┐ ┌──────▼──────┐ ┌───────▼───────┐
       │  App API    │ │ Notification│ │ Cronjob       │
       │  :3000      │ │ :3002       │ │ Worker :3003  │
       └──────┬──────┘ └──────┬──────┘ └───────┬───────┘
              │                │                │
    ┌─────────┼────────────────┼────────────────┤
    │         │                │                │
┌───▼───┐ ┌──▼───┐ ┌─────▼─────┐ ┌─────▼─────┐
│ Postgres│ │Redis │ │  Kafka    │ │  BullMQ   │
│   15   │ │  7   │ │ (Events)  │ │  (Jobs)   │
└────────┘ └──────┘ └───────────┘ └───────────┘
```

## Tech Stack

### Backend (NestJS Monorepo)

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 with CQRS pattern |
| Database | PostgreSQL 15 + TypeORM |
| Cache | Redis 7 (ioredis) |
| Message Broker | Apache Kafka (kafkajs) |
| Job Queue | BullMQ |
| Real-time | Socket.io (WebSocket) |
| Auth | JWT + Passport (Google OAuth, GitHub OAuth) |
| Storage | AWS S3 |
| Email | Nodemailer (Gmail SMTP) |
| Docs | Swagger / OpenAPI |
| Rate Limiting | @nestjs/throttler |

### Frontend (React SPA)

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 7 |
| Styling | TailwindCSS 4 |
| State | Redux Toolkit |
| Routing | React Router 7 |
| HTTP | Axios |
| Real-time | Socket.io Client |
| Charts | Recharts |
| DnD | @dnd-kit |

## Microservices

| Service | Port | Responsibility |
|---------|------|---------------|
| `app-api` | 3000 | REST API, authentication, business logic |
| `notification` | 3002 | Email notifications, real-time push via WebSocket |
| `cronjob-worker` | 3003 | Scheduled tasks, recurring jobs, background processing |

## Features

- **Project & Task Management** - Kanban boards, sprints, labels, custom fields, drag-and-drop
- **Workspace & Team** - Multi-workspace support, team management, member invitations
- **Role-based Access Control** - Granular permissions per workspace/project
- **Real-time Collaboration** - Live updates via WebSocket
- **Recurring Tasks** - Automated task creation on schedule
- **Time Tracking** - Track time spent on tasks
- **Automation & Webhooks** - Event-driven workflows and external integrations
- **Reports & Analytics** - Project progress, team workload, burndown charts
- **Data Import/Export** - Bulk operations for project data
- **Project & Task Templates** - Reusable templates for quick setup
- **Audit Logging** - Track all changes for compliance
- **Global Search** - Search across projects, tasks, and comments
- **File Attachments** - Upload to AWS S3 with size limits
- **OAuth Login** - Google and GitHub single sign-on

## Project Structure

```
project-management/
├── .github/workflows/          # CI/CD pipelines
│   ├── build.yml
│   ├── deploy.yml
│   └── rollback.yml
│
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route pages
│   │   ├── features/           # Feature modules
│   │   ├── services/           # API service layer
│   │   ├── hooks/              # Custom React hooks
│   │   ├── context/            # Auth context
│   │   └── utils/              # Utilities
│   └── package.json
│
└── server-nestjs/              # NestJS monorepo
    ├── apps/
    │   ├── app-api/            # Main API service
    │   │   └── src/domain/     # Domain modules
    │   │       ├── auth/
    │   │       ├── workspace/
    │   │       ├── project/
    │   │       ├── task/
    │   │       ├── sprint/
    │   │       ├── comment/
    │   │       ├── notification/
    │   │       ├── report/
    │   │       ├── webhook/
    │   │       └── ...         # 28 domain modules
    │   ├── cronjob-worker/     # Background job service
    │   └── notification/       # Notification service
    │
    ├── libs/
    │   ├── entity/             # TypeORM entities & migrations
    │   ├── external-infra/     # Infrastructure adapters
    │   │   ├── redis/
    │   │   ├── bullmq/
    │   │   ├── kafka/
    │   │   ├── s3/
    │   │   ├── email/
    │   │   └── websocket/
    │   ├── enum/               # Shared enumerations
    │   ├── logger/             # Centralized logging
    │   └── shared-libs/        # Guards, decorators, interceptors
    │
    ├── docker-compose.yml      # Development environment
    ├── docker-compose.prod.yml # Production environment
    └── nginx.conf              # Reverse proxy config
```

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL 15
- Redis 7
- Docker & Docker Compose (recommended)

### Development Setup

**1. Clone the repository**

```bash
git clone https://github.com/JiLee6902/project-management.git
cd project-management
```

**2. Start infrastructure with Docker**

```bash
cd server-nestjs
docker compose up -d postgres redis
```

**3. Configure environment**

```bash
# Client
cp client/.env.example client/.env

# Server
cp server-nestjs/.env.example server-nestjs/.env
```

**4. Install dependencies and run**

```bash
# Terminal 1 - Backend
cd server-nestjs
npm install
npm run migration:run
npm run start:app-api:dev

# Terminal 2 - Frontend
cd client
npm install
npm run dev
```

### Available Scripts

```bash
# Server
npm run start:app-api:dev          # Start API in dev mode
npm run start:cronjob-worker:dev   # Start cronjob worker
npm run start:notification:dev     # Start notification service
npm run build:app-api              # Build for production
npm run migration:generate         # Auto-generate migration
npm run migration:run              # Run pending migrations
npm run migration:revert           # Revert last migration

# Client
npm run dev                        # Start dev server
npm run build                      # Production build
```

## Production Deployment

### Infrastructure (Docker Compose)

```bash
cd server-nestjs

# Run migrations first
docker compose -f docker-compose.prod.yml run --rm migration

# Deploy all services
REGISTRY=your-registry VERSION=latest \
  docker compose -f docker-compose.prod.yml up -d
```

### Resource Allocation

| Service | CPU | Memory |
|---------|-----|--------|
| PostgreSQL | 0.5 | 192 MB |
| Redis | 0.25 | 64 MB |
| Kafka | 0.5 | 160 MB |
| Zookeeper | 0.25 | 96 MB |
| App API | 0.5 | 192 MB |
| Notification | 0.25 | 96 MB |
| Cronjob Worker | 0.5 | 128 MB |

### Nginx Reverse Proxy

```bash
sudo cp server-nestjs/nginx.conf /etc/nginx/sites-available/api
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### CI/CD

The project includes GitHub Actions workflows for automated build, deploy, and rollback:

- **build.yml** - Build and push Docker images on push to main
- **deploy.yml** - Deploy to production server
- **rollback.yml** - Rollback to previous version

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` / `production` |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (default: 5432) |
| `DB_USERNAME` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port (default: 6379) |
| `REDIS_PASSWORD` | Redis password |
| `KAFKA_BROKERS` | Kafka broker addresses |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `GMAIL_USER` | SMTP email address |
| `GMAIL_APP_PASS` | Gmail app password |
| `AWS_REGION` | AWS region for S3 |
| `AWS_S3_BUCKET` | S3 bucket name |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret |
| `FRONTEND_URL` | Frontend URL for CORS |

## License

UNLICENSED
