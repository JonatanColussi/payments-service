# Payments Service

A payments service built with NestJS framework using TypeScript, PostgreSQL, and TypeORM.

## Description

This is a modern NestJS application with TypeScript, designed for payment processing services. It includes TypeORM integration with PostgreSQL, Docker Compose setup, database migrations, and follows NestJS best practices for enterprise applications.

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL (if running locally without Docker)

## Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` file with your configuration if needed (default values work with Docker Compose).

## Database Setup

### Using Docker Compose (Recommended)

1. Start the database services:
   ```bash
   docker-compose up -d
   ```

2. Run database migrations:
   ```bash
   npm run migration:run
   ```

3. Verify the setup by checking database connection:
   ```bash
   # The application should connect successfully
   npm run start:dev
   
   # Test the health endpoint
   curl http://localhost:3000/health/database
   ```

### Manual PostgreSQL Setup

If you prefer to use a local PostgreSQL installation:

1. Create a database:
   ```sql
   CREATE DATABASE payments_db;
   ```

2. Update `.env` file with your database credentials.

3. Run migrations:
   ```bash
   npm run migration:run
   ```

## Running the Application

```bash
# development with watch mode
npm run start:dev

# production mode
npm run start:prod

# debug mode
npm run start:debug
```

The application will be available at `http://localhost:3000`

## Database Operations

### Migrations

```bash
# Generate a new migration
npm run migration:generate -- src/database/migrations/MigrationName

# Create an empty migration
npm run migration:create -- src/database/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert
```

### Schema Operations (Development Only)

```bash
# Synchronize schema (WARNING: may cause data loss)
npm run schema:sync

# Drop entire schema (WARNING: will delete all data)
npm run schema:drop
```

## Docker Services

The `docker-compose.yml` includes:

- **PostgreSQL 16**: Main database server with health checks and persistent storage

## API Endpoints

### Health Checks
- `GET /health` - Application health status
- `GET /health/database` - Database connection status

### Application
- `GET /` - Returns a welcome message

## Project Structure

```
src/
├── config/
│   ├── database.base.ts       # Shared database configuration builder
│   └── database.config.ts     # NestJS TypeORM configuration
├── database/
│   ├── data-source.ts         # TypeORM DataSource for CLI
│   └── migrations/            # Database migration files
├── entities/
│   ├── payment.entity.ts      # Payment entity model
│   └── index.ts              # Entity exports
├── health/
│   ├── health.controller.ts   # Health check endpoints
│   ├── health.service.ts      # Health check logic
│   └── health.module.ts       # Health module
├── app.controller.ts          # Main application controller
├── app.module.ts              # Root application module
├── app.service.ts             # Main application service
└── main.ts                   # Application entry point

docker-compose.yml             # Docker services configuration
typeorm.config.ts              # TypeORM CLI configuration
scripts/
└── init-db.sql               # Database initialization script
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Application port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_NAME` | Database name | `payments_db` |
| `DATABASE_USER` | Database user | `postgres` |
| `DATABASE_PASSWORD` | Database password | `password` |
| `DATABASE_SSL` | Enable SSL connection | `false` |
| `DATABASE_LOGGING` | Enable query logging | `true` |
| `DATABASE_SYNCHRONIZE` | Auto-sync schema (dev only) | `false` |
| `DATABASE_MIGRATIONS_RUN` | Auto-run migrations | `false` |

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov

# test in watch mode
npm run test:watch
```

## Technology Stack

- **Framework**: NestJS 11.x with Fastify
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 16 with TypeORM 0.3.x
- **Testing**: Jest
- **Code Quality**: ESLint + Prettier
- **Containerization**: Docker & Docker Compose

## Database Configuration Architecture

The database configuration uses a modular approach to eliminate code duplication:

### DatabaseConfigBuilder Class

- **Location**: `src/config/database.base.ts`
- **Purpose**: Centralized database configuration logic
- **Benefits**: Single source of truth, type-safe parsing, environment validation

### Configuration Types

- **CLI Configuration**: Used by TypeORM CLI for migrations
- **NestJS Configuration**: Used by the application runtime
- **Base Configuration**: Shared configuration logic

### Environment Parsing

- Automatic type conversion for integers and booleans
- Fallback defaults for all configuration values
- SSL and connection pool configuration management

## Database Schema

### Payment Entity

The `Payment` entity represents payment transactions with the following fields:

- `id` (UUID, Primary Key)
- `userId` (String, Indexed)
- `amount` (Decimal, Precision: 10, Scale: 2)
- `currency` (String, 3 characters)
- `status` (Enum: pending, processing, completed, failed, cancelled, refunded)
- `paymentMethod` (Enum: credit_card, debit_card, bank_transfer, digital_wallet, cryptocurrency)
- `externalTransactionId` (String, Optional)
- `description` (String, Optional)
- `metadata` (JSONB, Optional)
- `failureReason` (String, Optional)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

## Security Considerations

- Database connections use connection pooling with configurable limits
- SSL support for production database connections
- Environment variables for sensitive configuration
- Input validation and TypeORM query builders prevent SQL injection
- Health checks don't expose sensitive information

## Development Workflow

1. Start database: `docker-compose up -d`
2. Run migrations: `npm run migration:run`
3. Start development server: `npm run start:dev`
4. Make your changes
5. Generate migrations if schema changes: `npm run migration:generate -- MigrationName`
6. Test your changes
7. Commit and push

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database credentials
3. Set `DATABASE_SSL=true` for secure connections
4. Set `DATABASE_SYNCHRONIZE=false` (always false in production)
5. Run migrations: `npm run migration:run`
6. Start application: `npm run start:prod`

## Troubleshooting

### Database Connection Issues

1. Verify Docker services are running:

   ```bash
   docker-compose ps
   ```

2. Check database logs:

   ```bash
   docker-compose logs postgres
   ```

3. Test direct database connection:

   ```bash
   docker-compose exec postgres psql -U postgres -d payments_db -c "SELECT 1;"
   ```

4. Verify environment variables are loaded correctly in the application.

### Migration Issues

1. Check migration status:

   ```bash
   npm run typeorm -- migration:show -d src/database/data-source.ts
   ```

2. If migrations are out of sync, you may need to manually mark them as run or revert and re-run them.

## License

This project is [MIT licensed](LICENSE).
