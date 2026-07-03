# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Task Platform

## Project Overview

Two independently deployable microservices built with TypeScript / Node.js following hexagonal architecture (ports and adapters).

- **identity-service** — User registration, login, JWT issuance (port 3001)
- **task-service** — Authenticated task CRUD, JWT validation middleware (port 3002)

## Architecture Principles

### Hexagonal Architecture — Strict Dependency Rule
The dependency arrow always points inward:

```
Adapters (HTTP, DB) → Ports (interfaces) ← Application (use cases) → Domain
```

- Domain layer has ZERO external imports
- Application layer imports only domain and port interfaces
- Adapters import application layer and implement port interfaces
- Infrastructure wires everything together (dependency injection)

### Layer Responsibilities

| Layer | Location | Rule |
|---|---|---|
| Domain | `src/domain/` | Pure business logic, no frameworks |
| Application | `src/application/use-cases/` | Orchestrates domain via port interfaces |
| Ports | `src/ports/` | TypeScript interfaces only — no implementations |
| Adapters | `src/adapters/` | Implements ports; HTTP controllers, DB repos |
| Infrastructure | `src/infrastructure/` | DI container, server bootstrap, config |

## Stack

- **Runtime:** Node.js 20 LTS
- **Language:** TypeScript (strict mode)
- **Framework:** Fastify
- **Auth:** JWT HS256 (jsonwebtoken), Argon2 for password hashing
- **ORM:** Prisma
- **DB:** PostgreSQL (pluggable — in-memory adapter for tests)
- **Testing:** Vitest
- **OpenAPI:** @fastify/swagger + @fastify/swagger-ui
- **Containerisation:** Docker + docker-compose

## Commands

```bash
# Run both services (from repo root)
docker-compose up --build

# From within each service directory (identity-service/ or task-service/)
npm run dev              # hot-reload via tsx watch
npm run build            # tsc compile to dist/

npm run test             # unit tests (tests/unit/)
npm run test:integration # integration tests (tests/integration/)
npm run test:all         # full suite

# Run a single test file
npx vitest run tests/unit/RegisterUser.test.ts
```

## Testing Patterns

**Unit tests** use in-memory adapters directly — no mocking library. Hand-written fakes live inside test files:
- `FakePasswordHasher` — trivially computes `hashed:<plaintext>` for hash and verify
- `FakeTokenService` — returns `token:<sub>` as the signed token string
- In-memory repos (`InMemoryUserRepository`, `InMemoryTaskRepository`) expose a `clear()` helper; `beforeEach` creates fresh instances for isolation

**Integration tests** use Fastify's `app.inject()` — no HTTP port binds and Supertest is not needed (ignore the `supertest` dependency). Real adapters (Argon2, JWT) are used. The task-service integration tests pre-sign a JWT at module level for reuse across test cases.

## Known Gaps (Work in Progress)

- **No Prisma adapters yet** — `PrismaUserRepository` and `PrismaTaskRepository` don't exist; both `infrastructure/server.ts` files have `// TODO` comments and use `InMemoryXRepository` everywhere including in docker-compose.
- **No Prisma schema** — `prisma/schema.prisma` doesn't exist in either service yet.
- **OpenAPI not wired** — `@fastify/swagger` and `@fastify/swagger-ui` are installed but not registered in either `server.ts`.
- **Auth middleware bypasses port** — `task-service/src/adapters/http/authMiddleware.ts` verifies JWTs inline with `jsonwebtoken` rather than through a port interface, which is an architecture inconsistency.

## Prompting Strategy (AI-in-SDLC)

Follow TDD order strictly in prompts:

1. Prompt for domain model and port interfaces first
2. Prompt for use case with failing tests
3. Prompt for adapter implementation to make tests pass
4. Prompt for integration test
5. Prompt for OpenAPI annotations

### Prompt Patterns Used

- **Test-first:** "Write a failing unit test for [use case], then implement the use case to pass it"
- **Port-first:** "Define the TypeScript interface (port) for [dependency] before any implementation"
- **Refactor prompt:** "Refactor this to ensure the domain layer has no imports outside its own folder"
- **Security prompt:** "Review this JWT handling for security issues and suggest fixes"

## Environment Variables

See `.env.example` in each service. Never commit `.env` files.
