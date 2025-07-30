# NestJS Backend Starter

A comprehensive, modular, and production-ready NestJS backend starter template with inventory management system features.

## Features

- **Modular Structure:** Organized by feature modules for scalability
- **TypeORM Integration:** PostgreSQL support with migration scripts
- **Authentication & Authorization:** JWT-based authentication with Passport strategies and role-based access control
- **User Management:** Complete user system with roles, status enums, and profile management
- **Inventory Management:** Products, collections, warehouses, sales, and commission tracking
- **Validation:** Comprehensive DTOs and global validation pipes
- **Swagger Documentation:** Auto-generated API docs with JWT bearer authentication support
- **Logging:** Winston logger integration with configurable levels
- **Caching:** Redis cache module for performance optimization
- **Rate Limiting:** Built-in throttling for API protection
- **Docker Ready:** Multi-stage Dockerfile and docker-compose for easy deployment
- **Environment Config:** Flexible `.env` configuration for all environments
- **Yarn Support:** Uses [Yarn](https://yarnpkg.com/) for dependency management
- **Database Seeding:** Automated admin user creation and initial data setup

## Prerequisites

- Node.js 20+ 
- Yarn package manager
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (for containerized setup)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/nestjs-backend-starter.git
cd nestjs-backend-starter
```

### 2. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env-example .env
```

**Important:** Update the following variables in your `.env` file:
- `JWT_SECRET` and `JWT_REFRESH_SECRET` - Use strong, unique secrets in production
- `DB_PASSWORD` - Set a secure database password
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` - Configure your admin user credentials
- `REDIS_PASSWORD` - Set if using Redis authentication

### 3. Installation

```bash
yarn install
```

## Running the Application

### Option A: Docker Compose (Recommended)

The easiest way to get started with all services:

```bash
# Start all services (app, PostgreSQL, Redis, Nginx)
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

Services will be available at:
- **API**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Option B: Local Development

For local development with hot reload:

1. **Start PostgreSQL and Redis** (via Docker or locally installed)

```bash
# Using Docker for just the databases
docker run -d --name postgres -e POSTGRES_DB=gelagle-stock-ims -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

2. **Run database migrations**

```bash
yarn migration:run
```

3. **Seed initial data** (optional)

```bash
yarn seed
```

4. **Start the development server**

```bash
yarn start:dev
```

The API will be available at http://localhost:3000

## Database Management

### Migrations

```bash
# Generate a new migration after entity changes
yarn migration:generate --name DescriptiveMigrationName

# Create an empty migration file
yarn migration:create --name CustomMigrationName

# Run pending migrations
yarn migration:run

# Revert the last migration
yarn migration:revert
```

### Seeding

```bash
# Seed the database with initial data (admin user, etc.)
yarn seed
```

## API Documentation

Once the application is running, visit:

- **Swagger UI**: http://localhost:3000/docs
- **API Base URL**: http://localhost:3000/api/v1

### Authentication

The API uses JWT Bearer token authentication. To access protected endpoints:

1. **Login** via `/api/v1/auth/login` with your credentials
2. **Use the returned access token** in the Authorization header: `Bearer <your-token>`
3. **In Swagger UI**, click the "Authorize" button and enter your token

### Default Admin User

After seeding, you can login with:
- **Email**: admin@example.com (or the value from your `.env`)
- **Password**: admin123456 (or the value from your `.env`)

## Building and Testing

### Building the Application

```bash
# Build for production
yarn build

# Start the built application
yarn start:prod
```

### Testing

```bash
# Run unit tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:cov

# Run end-to-end tests
yarn test:e2e

# Debug tests
yarn test:debug
```

### Code Quality

```bash
# Lint and fix code issues
yarn lint

# Format code with Prettier
yarn format
```

## Deployment

### Docker Deployment

#### Building Docker Images

```bash
# Build the application image
yarn docker:build

# Or build manually
docker build -t nestjs-backend-starter .
```

#### Production Deployment with Docker Compose

1. **Prepare your production environment file**:

```bash
cp .env-example .env.production
# Edit .env.production with your production values
```

2. **Deploy with docker-compose**:

```bash
# Start all services in production mode
docker compose -f docker-compose.yml --env-file .env.production up -d

# Scale the application if needed
docker compose up -d --scale app=3
```

3. **Run migrations in production**:

```bash
# Run migrations inside the container
docker compose exec app yarn migration:run

# Seed the database (if needed)
docker compose exec app yarn seed
```

#### Production Services

The docker-compose setup includes:

- **App Container**: NestJS application (port 3000)
- **PostgreSQL**: Database server (port 5432)
- **Redis**: Cache server (port 6379)
- **Nginx**: Reverse proxy and load balancer (ports 80/443)

### Environment Variables

Key environment variables for production:

```env
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Database
DB_HOST=postgres  # Use service name in Docker
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=your_db_name

# JWT (Use strong secrets!)
JWT_SECRET=your-super-strong-jwt-secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-super-strong-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=redis  # Use service name in Docker
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Security
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=warn
```

### Health Checks

The application includes health check endpoints:

- **Health Check**: `GET /health`
- **Database Check**: `GET /health/db`
- **Redis Check**: `GET /health/redis`

### Monitoring and Logs

```bash
# View application logs
docker compose logs -f app

# View all service logs
docker compose logs -f

# Monitor resource usage
docker stats
```

### Backup and Maintenance

```bash
# Backup PostgreSQL database
docker compose exec postgres pg_dump -U $DB_USERNAME $DB_NAME > backup.sql

# Restore database
docker compose exec -i postgres psql -U $DB_USERNAME $DB_NAME < backup.sql

# Update application
git pull
docker compose build app
docker compose up -d app
```

---

## Project Structure

```
src/
  common/         # Shared decorators, enums, guards, etc.
  config/         # Configuration files
  database/       # Base entities, migrations
  modules/        # Feature modules (auth, users, etc.)
  shared/         # Shared modules (logger, cache)
  main.ts         # App entry point
  app.module.ts   # Root module
```

---

## Scripts

| Command                   | Description                       |
|---------------------------|-----------------------------------|
| `yarn start:dev`          | Start in watch mode               |
| `yarn build`              | Build the project                 |
| `yarn migration:generate` | Generate a new migration          |
| `yarn migration:run`      | Run pending migrations            |
| `yarn test`               | Run unit tests                    |
| `docker compose up`       | Start app and DB with Docker      |

---

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/foo`)
3. Commit your changes
4. Push to the branch (`git push origin feature/foo`)
5. Create a new Pull Request

---

## License

MIT

---

**Happy coding!**