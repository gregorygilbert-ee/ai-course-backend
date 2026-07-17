.PHONY: dev-identity dev-task test test-identity test-task coverage lint build docker-up docker-down docker-rebuild

# Development
dev-identity:
	cd identity-service && npm run dev

dev-task:
	cd task-service && npm run dev

# Testing
test:
	cd identity-service && npm run test:all
	cd task-service && npm run test:all

test-identity:
	cd identity-service && npm run test:all

test-task:
	cd task-service && npm run test:all

# Coverage
coverage:
	cd identity-service && npm run test:coverage
	cd task-service && npm run test:coverage

# Linting
lint:
	cd identity-service && npm run lint
	cd task-service && npm run lint

# Build
build:
	cd identity-service && npm run build
	cd task-service && npm run build

# Docker
docker-up:
	docker-compose up

docker-down:
	docker-compose down -v

docker-rebuild:
	docker-compose down -v && docker system prune -f && docker-compose up --build
