# Task Platform

Two independently deployable microservices following hexagonal architecture.

## Services

| Service | Port | Responsibility |
|---|---|---|
| identity-service | 3001 | User registration, login, JWT issuance |
| task-service | 3002 | Authenticated task CRUD |

## Quick Start

```bash
# Copy env files
cp identity-service/.env.example identity-service/.env
cp task-service/.env.example task-service/.env

# Start all services
docker-compose up --build
```

## Running Tests

```bash
# Identity service
cd identity-service
npm install
npm run test:all

# Task service
cd task-service
npm install
npm run test:all
```

## Architecture

Both services follow hexagonal (ports and adapters) architecture:

```
src/
├── domain/          # Pure business logic — no external dependencies
├── application/     # Use cases orchestrating domain via port interfaces
├── ports/           # TypeScript interfaces (contracts)
├── adapters/        # Implementations: HTTP controllers, repositories
└── infrastructure/  # Server bootstrap and dependency wiring
```

The dependency rule is strictly enforced: domain ← application ← adapters.

## AI-in-SDLC Approach

All code was generated via Claude Code using prompt-powered programming. Key patterns:

- **TDD-first prompts:** tests written before implementation
- **Port-first prompts:** interfaces defined before concrete adapters
- **Security review prompts:** JWT and auth flows reviewed explicitly
- **Refactor prompts:** enforcing clean layer boundaries

See `CLAUDE.md` for the full prompt strategy.

## Assumptions

- JWT signing uses HS256 with a shared secret (RS256 deferred — call out in showcase as a production consideration)
- In-memory repositories used in tests; Prisma/Postgres adapters are the TODO for full persistence
- Services share the JWT secret via environment variable (in production, use a secrets manager)
