# 💳 Payments Service

A robust, enterprise-grade payments processing service built with **NestJS**, **TypeScript**, and **Temporal** workflow orchestration. Features **MercadoPago** integration, **CQRS** architecture, and comprehensive payment processing workflows.

## 🚀 Features

### Core Payment Processing
- **Multiple Payment Methods**: Credit Card, PIX, and more
- **Real-time Payment Processing**: Asynchronous workflow orchestration with Temporal
- **MercadoPago Integration**: Full Brazilian payment gateway support
- **Payment Validation**: Domain-driven validation with business rules
- **Webhook Support**: Real-time payment status updates

### Architecture & Patterns
- **Clean Architecture**: Domain-driven design with clear separation of concerns
- **CQRS Pattern**: Command Query Responsibility Segregation for scalable operations
- **Event Sourcing**: Comprehensive event handling and audit trails
- **Workflow Orchestration**: Temporal-powered payment processing workflows
- **Repository Pattern**: Abstracted data access with TypeORM

### Infrastructure & DevOps
- **Docker Compose**: Complete development environment setup
- **PostgreSQL**: Primary database with migrations and health checks
- **Temporal Server**: Workflow orchestration with Web UI
- **Redis**: Caching layer for improved performance
- **Health Checks**: Comprehensive monitoring and observability

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │   Application   │    │    Domain       │
│   (Controllers) │◄──►│   (CQRS/Cases)  │◄──►│  (Entities/VOs) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Infrastructure│    │   Temporal     │    │   External      │
│   (Database)    │    │   Workflows    │    │   (MercadoPago) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Technology Stack

- **Framework**: NestJS 11.x with Fastify
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 16 with TypeORM 0.3.x
- **Workflow Engine**: Temporal 1.13.x
- **Payment Gateway**: MercadoPago SDK 2.9.x
- **Architecture**: CQRS + Event Sourcing + Clean Architecture
- **Testing**: Jest with comprehensive coverage
- **Code Quality**: ESLint + Prettier
- **Containerization**: Docker & Docker Compose
- **Caching**: Redis 7.x

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **MercadoPago Account** (for payment processing)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd payments-service
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your MercadoPago credentials
```

### 3. Start Infrastructure
```bash
# Start all services (PostgreSQL, Temporal, Redis)
npm run docker:infrastructure

# Or use the comprehensive development setup
npm run docker:dev
```

### 4. Database Setup
```bash
# Run migrations
npm run migration:run

# Verify database connection
curl http://localhost:3000/health/database
```

### 5. Start Application
```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod
```

### 6. Access Services
- **Application**: http://localhost:3000
- **Temporal Web UI**: http://localhost:8080
- **API Documentation**: http://localhost:3000/api

## 🔧 Development Commands

### Application
```bash
# Development
npm run start:dev          # Start with watch mode
npm run start:debug        # Start with debug mode
npm run start:prod         # Production build

# Building
npm run build              # Build application
npm run lint               # Lint code
npm run format             # Format code
```

### Database Operations
```bash
# Migrations
npm run migration:generate -- MigrationName    # Generate migration
npm run migration:create -- MigrationName      # Create empty migration
npm run migration:run                         # Run pending migrations
npm run migration:revert                      # Revert last migration

# Schema (Development Only)
npm run schema:sync                          # Sync schema (⚠️ Data loss risk)
npm run schema:drop                          # Drop schema (⚠️ Data loss risk)
```

### Docker Services
```bash
# Infrastructure
npm run docker:infrastructure                 # Start PostgreSQL, Temporal, Redis
npm run docker:stop                          # Stop all services

# Development Environment
npm run docker:dev                           # Start dev environment
npm run docker:dev:build                     # Build and start dev environment
npm run docker:dev:down                      # Stop dev environment
npm run docker:dev:logs                      # View dev logs

# Simple Setup
npm run docker:simple                        # Minimal setup
npm run docker:simple:down                   # Stop simple setup
npm run docker:simple:logs                   # View simple logs
```

### Temporal Workflows
```bash
npm run temporal:ui                          # Open Temporal Web UI
npm run temporal:logs                         # View Temporal logs
npm run temporal:health                       # Check Temporal health
npm run temporal:troubleshoot                 # Run troubleshooting script
```

### Testing
```bash
npm run test                                 # Unit tests
npm run test:watch                           # Watch mode
npm run test:cov                             # Coverage report
npm run test:e2e                             # End-to-end tests
npm run test:debug                           # Debug tests
```

### Automation Scripts
```bash
npm run quick-start                          # Complete setup automation
npm run test:payment-flow                    # Test payment processing flow
```

## 📚 API Documentation

### Payment Endpoints

#### Create Payment
```http
POST /payment
Content-Type: application/json

{
  "cpf": "12345678901",
  "description": "Payment for services",
  "amount": 100.50,
  "paymentMethod": "CREDIT_CARD",
  "payer": {
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Get Payment
```http
GET /payment/{id}
```

#### List Payments
```http
GET /payment?cpf=12345678901&status=PENDING
```

#### Update Payment Status
```http
PATCH /payment/{id}/status
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

### Webhook Endpoints

#### MercadoPago Webhook
```http
POST /webhook/mercadopago
Content-Type: application/json
```

### Health Checks
```http
GET /health                    # Application health
GET /health/database          # Database connection status
```

## 🏛️ Project Structure

```
src/
├── application/                    # Application Layer (CQRS)
│   ├── commands/                  # Command definitions
│   ├── queries/                   # Query definitions
│   ├── handlers/                  # Command/Query handlers
│   ├── events/                    # Domain events
│   └── interfaces/                # Application interfaces
├── domain/                        # Domain Layer
│   ├── entities/                  # Domain entities
│   ├── value-objects/             # Value objects (CPF, Money)
│   ├── services/                  # Domain services
│   └── interfaces/                # Domain interfaces
├── infrastructure/                # Infrastructure Layer
│   ├── database/                  # Database configuration
│   ├── external/                  # External services (MercadoPago)
│   ├── temporal/                  # Temporal workflows & activities
│   └── repositories/              # Data access implementations
├── presentation/                  # Presentation Layer
│   ├── controllers/               # REST controllers
│   └── dto/                       # Data Transfer Objects
├── config/                        # Configuration
├── health/                        # Health check module
└── main.ts                        # Application entry point
```

## 🔄 Payment Processing Flow

### Credit Card Payments (Temporal Workflow)
1. **Payment Creation**: User creates payment via API
2. **Workflow Start**: Temporal workflow orchestrates the process
3. **MercadoPago Integration**: Creates payment preference
4. **Status Monitoring**: Polls for payment status updates
5. **Webhook Processing**: Handles real-time status updates
6. **Completion**: Updates payment status and triggers events

### PIX Payments (Direct Processing)
1. **Payment Creation**: User creates PIX payment
2. **Direct Processing**: Immediate processing without workflow
3. **Status Updates**: Real-time status management
4. **Completion**: Direct status updates

## 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Application port | `3000` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `DATABASE_HOST` | PostgreSQL host | `localhost` | No |
| `DATABASE_PORT` | PostgreSQL port | `5432` | No |
| `DATABASE_NAME` | Database name | `payments_db` | No |
| `DATABASE_USER` | Database user | `postgres` | No |
| `DATABASE_PASSWORD` | Database password | `password` | No |
| `MERCADOPAGO_ACCESS_TOKEN` | MercadoPago access token | - | **Yes** |
| `MERCADOPAGO_WEBHOOK_URL` | Webhook URL for notifications | - | **Yes** |
| `PAYMENT_SUCCESS_URL` | Success redirect URL | - | No |
| `PAYMENT_FAILURE_URL` | Failure redirect URL | - | No |
| `PAYMENT_PENDING_URL` | Pending redirect URL | - | No |
| `TEMPORAL_ADDRESS` | Temporal server address | `localhost:7233` | No |
| `REDIS_HOST` | Redis host | `localhost` | No |
| `REDIS_PORT` | Redis port | `6379` | No |

## 🐳 Docker Services

The `docker-compose.yml` includes:

- **PostgreSQL 16**: Main application database
- **Temporal PostgreSQL**: Temporal workflow database
- **Temporal Server**: Workflow orchestration engine
- **Temporal Web UI**: Workflow monitoring interface
- **Redis 7**: Caching and session storage

### Service Ports
- **Application**: 3000
- **PostgreSQL**: 5432
- **Temporal PostgreSQL**: 5433
- **Temporal Server**: 7233 (gRPC), 7234 (Membership), 7235 (History), 7239 (Worker)
- **Temporal Web UI**: 8080
- **Redis**: 6379

## 🧪 Testing

### Test Structure
- **Unit Tests**: Individual component testing
- **Integration Tests**: Service integration testing
- **E2E Tests**: Full application flow testing
- **Workflow Tests**: Temporal workflow testing

### Running Tests
```bash
# All tests
npm run test

# Specific test suites
npm run test -- --testNamePattern="Payment"
npm run test -- --testPathPattern="handlers"

# Coverage
npm run test:cov
```

### Test Data
- Mock MercadoPago responses
- Test payment scenarios
- Workflow state testing
- Database transaction testing

## 🔒 Security Features

- **Input Validation**: Comprehensive DTO validation
- **SQL Injection Prevention**: TypeORM query builders
- **Environment Variables**: Secure configuration management
- **Connection Pooling**: Database connection security
- **SSL Support**: Production database encryption
- **Webhook Verification**: MercadoPago signature validation

## 📊 Monitoring & Observability

### Health Checks
- Application health status
- Database connectivity
- External service availability
- Temporal workflow status

### Logging
- Structured logging with context
- Request/response logging
- Workflow execution logs
- Error tracking and reporting

### Metrics
- Payment processing metrics
- Workflow execution statistics
- Database performance metrics
- External API call metrics

## 🚀 Production Deployment

### Prerequisites
1. Set `NODE_ENV=production`
2. Configure production database credentials
3. Set up MercadoPago production credentials
4. Configure SSL certificates
5. Set up monitoring and logging

### Deployment Steps
```bash
# Build application
npm run build

# Run migrations
npm run migration:run

# Start production server
npm run start:prod
```

### Production Considerations
- **Database SSL**: Enable SSL connections
- **Connection Pooling**: Configure appropriate pool sizes
- **Monitoring**: Set up application monitoring
- **Logging**: Configure structured logging
- **Backup**: Set up database backups
- **Scaling**: Configure horizontal scaling

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check Docker services
docker-compose ps

# Check database logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U postgres -d payments_db -c "SELECT 1;"
```

#### Temporal Workflow Issues
```bash
# Check Temporal health
npm run temporal:health

# View Temporal logs
npm run temporal:logs

# Run troubleshooting
npm run temporal:troubleshoot
```

#### Migration Issues
```bash
# Check migration status
npm run typeorm -- migration:show -d src/database/data-source.ts

# Reset migrations (⚠️ Data loss risk)
npm run migration:revert
npm run migration:run
```

### Debug Mode
```bash
# Start with debug mode
npm run start:debug

# Debug tests
npm run test:debug
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines
- Follow Clean Architecture principles
- Write comprehensive tests
- Use TypeScript strict mode
- Follow ESLint and Prettier configurations
- Document new features and APIs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Check Temporal Web UI for workflow issues

---

**Built with ❤️ using NestJS, TypeScript, and Temporal**
