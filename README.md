# Project Management System

A full-stack project management application with multiple backend implementations.

## Tech Stack

### Client
- **React 19** with Vite
- **TailwindCSS** for styling
- **Redux Toolkit** for state management
- **Clerk** for authentication
- **React Router** for navigation
- **Recharts** for data visualization

### Server NestJS (Microservices)
- **NestJS** framework with monorepo structure
- **TypeORM** with PostgreSQL
- **Redis** for caching
- **BullMQ** for job queue
- **AWS S3** for file storage
- **JWT** authentication
- **Swagger** API documentation

#### Microservices:
- `app-api` - Main API service (port 3000)
- `cronjob-worker` - Background job processing (port 3001)
- `notification` - Notification service (port 3002)

#### Features:
- Project & Task Management
- Workspace & Team Management
- Role-based Permissions (RBAC)
- Audit Logging
- Recurring Tasks
- Webhooks
- Data Import/Export
- Advanced Reports
- Global Search

## Project Structure

```
project-management/
├── client/                 # React frontend
└── server-nestjs/          # NestJS microservices backend
    ├── apps/
    │   ├── app-api/        # Main API
    │   ├── cronjob-worker/ # Background jobs
    │   └── notification/   # Notifications
    └── libs/               # Shared libraries
        ├── entity/         # Database entities
        ├── external-infra/ # Redis, BullMQ, S3
        └── shared-libs/    # Guards, decorators, utils
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis
- Docker (optional)

### Installation

#### Client
```bash
cd client
npm install
npm run dev
```

#### Server NestJS
```bash
cd server-nestjs
npm install
npm run start:app-api:dev
```

### Docker
```bash
cd server-nestjs
docker-compose up -d
```

## Deployment

### Nginx Configuration
Copy `server-nestjs/nginx.conf` to `/etc/nginx/sites-available/` on your server:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/api
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Environment Variables

Each service requires its own `.env` file. Refer to the PDF documentation for detailed setup instructions.

## License

UNLICENSED
