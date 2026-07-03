# Task Platform — CLAUDE.md

## Project Overview

Two independently deployable microservices built with TypeScript / Node.js following hexagonal architecture (ports and adapters).

- **identity-service** — User registration, login, JWT issuance
- **task-service** — Authenticated task CRUD, JWT validation middleware

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
- **Testing:** Vitest (unit), Supertest (integration)
- **OpenAPI:** @fastify/swagger + @fastify/swagger-ui
- **Containerisation:** Docker + docker-compose

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

## Running Locally

```bash
docker-compose up --build
```

Identity service: http://localhost:3001
Task service: http://localhost:3002

## Test Commands

```bash
# From within each service directory
npm run test           # unit tests
npm run test:integration  # integration tests
npm run test:all       # full suite
```
