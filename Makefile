ifneq (,$(wildcard .env))
  include .env
  export
endif

# Portfolio Docker Management Makefile
# This Makefile provides convenient commands for managing the Docker environment

.PHONY: help dev prod build up down restart logs clean install test lint format rebuild prod-rebuild

# Default target
help: ## Show this help message
	@echo "Portfolio Docker Management Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands (uses docker-stack.sh = Portfolio + Clients)
dev: ## Start development environment (Portfolio + clients)
	@echo "Starting development environment..."
	./scripts/docker-stack.sh up -d

dev-pgadmin: ## Start development environment with pgAdmin
	@echo "Starting development environment with pgAdmin..."
	./scripts/docker-stack.sh --profile pgadmin up -d
	@echo "Development environment started!"
	@echo "Frontend: ${NGINX_URL}:${FRONTEND_PORT}"
	@echo "Backend: ${NGINX_URL}:${BACKEND_PORT}"
	@echo "Nginx: ${NGINX_URL}"

dev-build: ## Build and start development environment
	@echo "Building and starting development environment..."
	./scripts/docker-stack.sh up -d --build

dev-logs: ## Follow development logs
	./scripts/docker-stack.sh logs -f

# Production commands
prod: ## Start production environment
	@echo "Starting production environment..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Production environment started!"
	@echo "Application: ${NGINX_URL}"

prod-build: ## Build and start production environment
	@echo "Building and starting production environment..."
	docker-compose -f docker-compose.prod.yml up -d --build

prod-logs: ## Follow production logs
	docker-compose -f docker-compose.prod.yml logs -f

# General Docker commands (full stack = Portfolio + clients)
build: ## Build all Docker images
	./scripts/docker-stack.sh build

up: ## Start all services (development)
	./scripts/docker-stack.sh up -d

down: ## Stop all services
	./scripts/docker-stack.sh down

down-volumes: ## Stop all services and remove volumes (WARNING: Data loss!)
	./scripts/docker-stack.sh down -v
	docker-compose -f docker-compose.prod.yml down -v

restart: ## Restart all services
	./scripts/docker-stack.sh restart

stop: ## Stop all services
	./scripts/docker-stack.sh stop

# Service-specific commands
frontend: ## Start only frontend service
	./scripts/docker-stack.sh up -d frontend

backend: ## Start only backend service
	./scripts/docker-stack.sh up -d backend postgres

database: ## Start only database service
	./scripts/docker-stack.sh up -d postgres

nginx: ## Start only nginx service
	./scripts/docker-stack.sh up -d nginx

# Logging commands
logs: ## Show logs for all services
	./scripts/docker-stack.sh logs

logs-frontend: ## Show frontend logs
	./scripts/docker-stack.sh logs frontend

logs-backend: ## Show backend logs
	./scripts/docker-stack.sh logs backend

logs-database: ## Show database logs
	./scripts/docker-stack.sh logs postgres

logs-nginx: ## Show nginx logs
	./scripts/docker-stack.sh logs nginx

# Database commands
db-shell: ## Access PostgreSQL shell
	./scripts/docker-stack.sh exec postgres psql -U postgres -d portfolio_db

db-backup: ## Create database backup
	@echo "Creating database backup..."
	./scripts/docker-stack.sh exec postgres pg_dump -U postgres portfolio_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup created: backup_$(shell date +%Y%m%d_%H%M%S).sql"

db-restore: ## Restore database from backup (Usage: make db-restore FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then echo "Usage: make db-restore FILE=backup.sql"; exit 1; fi
	@echo "Restoring database from $(FILE)..."
	cat $(FILE) | ./scripts/docker-stack.sh exec -T postgres psql -U postgres -d portfolio_db
	@echo "Database restored!"

db-reset: ## Reset database (WARNING: Data loss!)
	@echo "Resetting database..."
	./scripts/docker-stack.sh down postgres
	docker volume rm portfolio_postgres_data 2>/dev/null || true
	./scripts/docker-stack.sh up -d postgres
	@echo "Database reset complete!"

# Development utilities
install: ## Install dependencies in containers
	@echo "Installing frontend dependencies..."
	./scripts/docker-stack.sh exec frontend yarn install
	@echo "Installing backend dependencies..."
	./scripts/docker-stack.sh exec backend yarn install

install-frontend: ## Install frontend dependencies
	./scripts/docker-stack.sh exec frontend yarn install

install-backend: ## Install backend dependencies
	./scripts/docker-stack.sh exec backend yarn install

# Shell access
shell-frontend: ## Access frontend container shell
	./scripts/docker-stack.sh exec frontend sh

shell-backend: ## Access backend container shell
	./scripts/docker-stack.sh exec backend sh

shell-database: ## Access database container shell
	./scripts/docker-stack.sh exec postgres sh

shell-nginx: ## Access nginx container shell
	./scripts/docker-stack.sh exec nginx sh

# Testing commands
test: ## Run all tests
	@echo "Running frontend tests..."
	./scripts/docker-stack.sh exec frontend yarn test
	@echo "Running backend tests..."
	./scripts/docker-stack.sh exec backend yarn test

test-frontend: ## Run frontend tests
	./scripts/docker-stack.sh exec frontend yarn test

test-backend: ## Run backend tests
	./scripts/docker-stack.sh exec backend yarn test

test-e2e: ## Run end-to-end tests
	./scripts/docker-stack.sh exec frontend yarn test:e2e

# Code quality commands
lint: ## Run linting for all services
	@echo "Linting frontend..."
	./scripts/docker-stack.sh exec frontend yarn lint
	@echo "Linting backend..."
	./scripts/docker-stack.sh exec backend yarn lint

lint-fix: ## Fix linting issues
	@echo "Fixing frontend linting issues..."
	./scripts/docker-stack.sh exec frontend yarn lint:fix
	@echo "Fixing backend linting issues..."
	./scripts/docker-stack.sh exec backend yarn lint:fix

format: ## Format code
	@echo "Formatting frontend code..."
	./scripts/docker-stack.sh exec frontend npx prettier --write .
	@echo "Formatting backend code..."
	./scripts/docker-stack.sh exec backend npx prettier --write .

type-check: ## Run TypeScript type checking
	@echo "Type checking frontend..."
	./scripts/docker-stack.sh exec frontend yarn type-check
	@echo "Type checking backend..."
	./scripts/docker-stack.sh exec backend yarn type-check

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
	./scripts/docker-stack.sh ps

health: ## Check health of all services
	@echo "Checking service health..."
	@for service in frontend backend postgres nginx; do \
		echo "$$service: $$(docker inspect --format='{{.State.Health.Status}}' portfolio_$${service}_dev 2>/dev/null || echo 'not running')"; \
	done

# Client integration
integrate: ## Discover and integrate client projects
	@echo "Discovering and integrating clients..."
	yarn integrate
	@echo "Run 'yarn migrate:clients' if clients have database migrations"

# Rebuild a specific client (Usage: make rebuild-client CLIENT=memoon-card)
rebuild-client: ## Rebuild client containers (CLIENT=memoon-card)
	@if [ -z "$(CLIENT)" ]; then echo "Usage: make rebuild-client CLIENT=memoon-card"; exit 1; fi
	./scripts/rebuild-client.sh $(CLIENT)

# Rebuild and restart a specific client
rebuild-client-restart: ## Rebuild and restart client (CLIENT=memoon-card)
	@if [ -z "$(CLIENT)" ]; then echo "Usage: make rebuild-client-restart CLIENT=memoon-card"; exit 1; fi
	./scripts/rebuild-client.sh $(CLIENT) --restart

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
			-subj "/C=US/ST=State/L=City/O=Organization/CN=${NGINX_URL}"; \
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

rebuild: ## Rebuild all Docker images without cache
	./scripts/docker-stack.sh build --no-cache

prod-rebuild: ## Rebuild production Docker images without cache
	docker-compose -f docker-compose.prod.yml build --no-cache 