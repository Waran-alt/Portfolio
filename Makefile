ifneq (,$(wildcard .env))
  include .env
  export
endif

# Portfolio Docker Management Makefile
# This Makefile provides convenient commands for managing the Docker environment

.PHONY: help dev prod build up down restart logs clean install test lint format

# Default target
help: ## Show this help message
	@echo "Portfolio Docker Management Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment
	@echo "Starting development environment..."
	docker-compose up -d
	@echo "Development environment started!"
	@echo "Frontend: http://localhost:$(or $(FRONTEND_PORT),3000)"
	@echo "Backend: http://localhost:$(or $(BACKEND_PORT),4000)"
	@echo "Nginx: http://localhost"

dev-build: ## Build and start development environment
	@echo "Building and starting development environment..."
	docker-compose up -d --build

dev-logs: ## Follow development logs
	docker-compose logs -f

# Production commands
prod: ## Start production environment
	@echo "Starting production environment..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Production environment started!"
	@echo "Application: https://localhost"

prod-build: ## Build and start production environment
	@echo "Building and starting production environment..."
	docker-compose -f docker-compose.prod.yml up -d --build

prod-logs: ## Follow production logs
	docker-compose -f docker-compose.prod.yml logs -f

# General Docker commands
build: ## Build all Docker images
	docker-compose build

up: ## Start all services (development)
	docker-compose up -d

down: ## Stop all services
	docker-compose down

down-volumes: ## Stop all services and remove volumes (WARNING: Data loss!)
	docker-compose down -v
	docker-compose -f docker-compose.prod.yml down -v

restart: ## Restart all services
	docker-compose restart

stop: ## Stop all services
	docker-compose stop

# Service-specific commands
frontend: ## Start only frontend service
	docker-compose up -d frontend

backend: ## Start only backend service
	docker-compose up -d backend postgres

database: ## Start only database service
	docker-compose up -d postgres

nginx: ## Start only nginx service
	docker-compose up -d nginx

# Logging commands
logs: ## Show logs for all services
	docker-compose logs

logs-frontend: ## Show frontend logs
	docker-compose logs frontend

logs-backend: ## Show backend logs
	docker-compose logs backend

logs-database: ## Show database logs
	docker-compose logs postgres

logs-nginx: ## Show nginx logs
	docker-compose logs nginx

# Database commands
db-shell: ## Access PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d portfolio_db

db-backup: ## Create database backup
	@echo "Creating database backup..."
	docker-compose exec postgres pg_dump -U postgres portfolio_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup created: backup_$(shell date +%Y%m%d_%H%M%S).sql"

db-restore: ## Restore database from backup (Usage: make db-restore FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then echo "Usage: make db-restore FILE=backup.sql"; exit 1; fi
	@echo "Restoring database from $(FILE)..."
	cat $(FILE) | docker-compose exec -T postgres psql -U postgres -d portfolio_db
	@echo "Database restored!"

db-reset: ## Reset database (WARNING: Data loss!)
	@echo "Resetting database..."
	docker-compose down postgres
	docker volume rm portfolio_postgres_data
	docker-compose up -d postgres
	@echo "Database reset complete!"

# Development utilities
install: ## Install dependencies in containers
	@echo "Installing frontend dependencies..."
	docker-compose exec frontend yarn install
	@echo "Installing backend dependencies..."
	docker-compose exec backend yarn install

install-frontend: ## Install frontend dependencies
	docker-compose exec frontend yarn install

install-backend: ## Install backend dependencies
	docker-compose exec backend yarn install

# Shell access
shell-frontend: ## Access frontend container shell
	docker-compose exec frontend sh

shell-backend: ## Access backend container shell
	docker-compose exec backend sh

shell-database: ## Access database container shell
	docker-compose exec postgres sh

shell-nginx: ## Access nginx container shell
	docker-compose exec nginx sh

# Testing commands
test: ## Run all tests
	@echo "Running frontend tests..."
	docker-compose exec frontend yarn test
	@echo "Running backend tests..."
	docker-compose exec backend yarn test

test-frontend: ## Run frontend tests
	docker-compose exec frontend yarn test

test-backend: ## Run backend tests
	docker-compose exec backend yarn test

test-e2e: ## Run end-to-end tests
	docker-compose exec frontend yarn test:e2e

# Code quality commands
lint: ## Run linting for all services
	@echo "Linting frontend..."
	docker-compose exec frontend yarn lint
	@echo "Linting backend..."
	docker-compose exec backend yarn lint

lint-fix: ## Fix linting issues
	@echo "Fixing frontend linting issues..."
	docker-compose exec frontend yarn lint:fix
	@echo "Fixing backend linting issues..."
	docker-compose exec backend yarn lint:fix

format: ## Format code
	@echo "Formatting frontend code..."
	docker-compose exec frontend npx prettier --write .
	@echo "Formatting backend code..."
	docker-compose exec backend npx prettier --write .

type-check: ## Run TypeScript type checking
	@echo "Type checking frontend..."
	docker-compose exec frontend yarn type-check
	@echo "Type checking backend..."
	docker-compose exec backend yarn type-check

# Cleanup commands
clean: ## Clean up Docker system
	@echo "Cleaning up Docker system..."
	docker system prune -f
	docker image prune -f
	@echo "Cleanup complete!"

clean-all: ## Clean up everything (WARNING: Removes all Docker data!)
	@echo "WARNING: This will remove ALL Docker containers, images, volumes, and networks!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker system prune -a -f --volumes; \
		echo "Complete cleanup finished!"; \
	else \
		echo "Cleanup cancelled."; \
	fi

# Health and status commands
status: ## Show status of all services
	docker-compose ps

health: ## Check health of all services
	@echo "Checking service health..."
	@for service in frontend backend postgres nginx; do \
		echo "$$service: $$(docker inspect --format='{{.State.Health.Status}}' portfolio_$${service}_dev 2>/dev/null || echo 'not running')"; \
	done

# Environment setup
setup: ## Initial setup - create env files and start development
	@echo "Setting up environment files..."
	./scripts/setup-env.sh
	@echo "Please edit the .env.* files with your configuration"
	@echo "Starting development environment..."
	$(MAKE) dev

setup-env: ## Set up environment files from templates
	@echo "Setting up environment files from templates..."
	./scripts/setup-env.sh

setup-env-force: ## Force update all environment files from templates
	@echo "Force updating environment files from templates..."
	./scripts/setup-env.sh --force

setup-env-light: ## Light update environment files (preserve existing variables)
	@echo "Light updating environment files (preserving existing variables)..."
	./scripts/setup-env.sh --light

setup-env-dry-run: ## Show what environment files would be created/updated
	@echo "Dry run - showing what would be done..."
	./scripts/setup-env.sh --dry-run

# Update commands
update: ## Update Docker images
	@echo "Updating Docker images..."
	docker-compose pull
	docker-compose -f docker-compose.prod.yml pull
	@echo "Images updated!"

# Monitoring
monitor: ## Monitor resource usage
	docker stats

# SSL Certificate Management
ssl-setup: ## Set up SSL certificates for development
	@echo "Setting up SSL certificates for development..."
	@if [ ! -f tools/nginx/ssl/cert.pem ]; then \
		echo "Creating self-signed certificates..."; \
		mkdir -p tools/nginx/ssl; \
		openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
			-keyout tools/nginx/ssl/key.pem \
			-out tools/nginx/ssl/cert.pem \
			-subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"; \
		echo "Self-signed certificates created!"; \
	else \
		echo "SSL certificates already exist"; \
	fi

ssl-renew: ## Renew SSL certificates (production)
	@echo "Renewing SSL certificates..."
	./scripts/renew-certs.sh

# Project utilities
logs-all: ## Show logs for all environments
	@echo "=== Development Logs ==="
	$(MAKE) logs
	@echo ""
	@echo "=== Production Logs ==="
	$(MAKE) prod-logs

restart-all: ## Restart all environments
	@echo "Restarting development environment..."
	$(MAKE) restart
	@echo "Restarting production environment..."
	docker-compose -f docker-compose.prod.yml restart

# Quick development commands
quick-dev: ## Quick development start (setup + dev)
	@echo "Quick development setup..."
	$(MAKE) setup-env
	$(MAKE) dev

quick-prod: ## Quick production start (setup + prod)
	@echo "Quick production setup..."
	$(MAKE) setup-env
	$(MAKE) prod-build 