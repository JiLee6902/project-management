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
- **Kafka** for message queue
- **AWS S3** for file storage
- **JWT** authentication
- **Swagger** API documentation

#### Microservices:
- `app-api` - Main API service
- `cronjob-worker` - Background job processing
- `notification` - Notification service

## Project Structure

```
project-management/
├── client/                 # React frontend
└── server-nestjs/          # NestJS microservices backend
    ├── apps/
    │   ├── app-api/
    │   ├── cronjob-worker/
    │   └── notification/
    └── libs/               # Shared libraries
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis (for NestJS server)
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

## Environment Variables

Each service requires its own `.env` file. Refer to the PDF documentation for detailed setup instructions.

## License

UNLICENSED
