# NestJS Backend Starter

A comprehensive, modular, and production-ready NestJS backend starter template.

## Features

- **Modular Structure:** Organized by feature modules for scalability.
- **TypeORM Integration:** PostgreSQL support with migration scripts.
- **Authentication:** JWT-based authentication with Passport strategies.
- **User Management:** User module with roles and status enums.
- **Validation:** DTOs and global validation pipes.
- **Swagger:** Auto-generated API docs with JWT bearer support.
- **Logging:** Winston logger integration.
- **Caching:** Redis cache module.
- **Docker Ready:** Dockerfile and docker-compose for easy setup.
- **Environment Config:** `.env` support for all configuration.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/nestjs-backend-starter.git
cd nestjs-backend-starter
```

### 2. Install dependencies

```bash
pnpm install
# or
npm install
```

### 3. Configure Environment

Copy `.env-example` to `.env` and update values as needed:

```bash
cp .env-example .env
```

### 4. Run with Docker (Recommended)

```bash
docker compose up -d
```

This will start both the backend and a PostgreSQL database.

### 5. Run Locally

Make sure PostgreSQL and Redis are running and `.env` is configured.

```bash
pnpm start:dev
# or
npm run start:dev
```

### 6. Database Migrations

Generate a migration after changing entities:

```bash
pnpm migration:generate
```

Run migrations:

```bash
pnpm migration:run
```

### 7. API Documentation

Visit [http://localhost:3000/docs](http://localhost:3000/docs) for Swagger UI.

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
| `pnpm start:dev`          | Start in watch mode               |
| `pnpm build`              | Build the project                 |
| `pnpm migration:generate` | Generate a new migration          |
| `pnpm migration:run`      | Run pending migrations            |
| `pnpm test`               | Run unit tests                    |
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