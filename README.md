# Payments Service

A payments service built with NestJS framework using TypeScript.

## Description

This is a modern NestJS application with TypeScript, designed for payment processing services. It includes all the essential configuration and structure following NestJS best practices.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Project Structure

```
src/
├── app.controller.ts      # Main application controller
├── app.controller.spec.ts # Controller unit tests
├── app.module.ts          # Root application module
├── app.service.ts         # Main application service
└── main.ts               # Application entry point

test/
├── app.e2e-spec.ts       # End-to-end tests
└── jest-e2e.json         # E2E test configuration
```

## API Endpoints

- `GET /` - Returns a welcome message
- `GET /health` - Health check endpoint

## Technology Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **Testing**: Jest
- **Code Quality**: ESLint + Prettier
- **HTTP**: Fastify (high-performance HTTP platform)

## Development

1. Start the development server:
   ```bash
   npm run start:dev
   ```

2. The application will be available at `http://localhost:3000`

3. Health check endpoint: `http://localhost:3000/health`

## License

This project is [MIT licensed](LICENSE).
