# Portfolio Docker Setup

This repository contains a comprehensive Docker setup for a Next.js portfolio application with a multi-service architecture including frontend, backend, database, and reverse proxy.

## 📖 TL;DR - Most Used Commands

### 🚀 Quick Start
```bash
# 1. Integrate clients (first time or after adding a client)
yarn integrate
yarn migrate:clients

# 2. Start everything (Portfolio + Clients)
yarn start

# 3. Check status / view logs
yarn status
yarn logs
```

### 📦 Stack Commands (daily use)
| Command       | Description                               |
|---------------|-------------------------------------------|
| `yarn start`  | Start all services (Portfolio + clients)  |
| `yarn stop`   | Stop all services                         |
| `yarn logs`   | Stream logs from all services             |
| `yarn status` | Show container status                     |

### 🔧 Setup Commands
| Command                                   | Description                                                   |
|-------------------------------------------|---------------------------------------------------------------|
| `yarn integrate`                          | Discover clients + run integration (generates `.generated/`)  |
| `yarn migrate:clients`                    | Run database migrations for all clients                       |
| `yarn discover:clients`                   | Discover clients only (generates compose/nginx configs)       |
| `yarn check:clients`                      | Check for port/subdomain/database conflicts                   |
| `yarn clients:rebuild <id>`               | Rebuild client containers (after Dockerfile/deps changes)     |
| `yarn clients:rebuild <id> -- --restart`  | Rebuild + restart that client                                 |

### 🐳 Docker Commands
| Command                         | Description                       |
|---------------------------------|-----------------------------------|
| `yarn docker:build`             | Build all images                  |
| `yarn docker:rebuild`           | Rebuild images (no cache)         |
| `yarn docker:restart`           | Restart all services              |
| `yarn docker:exec <svc> <cmd>`  | Run command in a container        |
| `yarn docker:portfolio:up`      | Start Portfolio only (no clients) |
| `yarn docker:portfolio:down`    | Stop Portfolio only               |

### 📊 Other Commands
```bash
# Development (without Docker)
yarn dev                  # Start all workspaces
yarn dev:frontend         # Portfolio frontend only
yarn dev:backend          # Portfolio backend only

# Database
yarn db:migrate           # Portfolio migrations
yarn db:seed              # Portfolio seed
yarn db:reset             # Portfolio reset

# Logs for a specific service
./scripts/docker-stack.sh logs -f frontend
./scripts/docker-stack.sh logs -f memoon-card-backend
```

### 🗄️ Database Access
```bash
./scripts/docker-stack.sh exec postgres psql -U postgres -d portfolio_db

# Backup
./scripts/docker-stack.sh exec postgres pg_dump -U postgres portfolio_db > backup.sql
```

> **Note:** `start`, `stop`, `logs`, `status` and `docker:*` use `scripts/docker-stack.sh`, which automatically includes client services when `.generated/docker-compose.clients.yml` exists (created by `yarn integrate`).

---

## 🏗️ Architecture Overview

The application consists of **Portfolio services** and **Client services** (auto-discovered):

### Portfolio Services
- **Frontend**: Next.js application with TypeScript
- **Backend**: Node.js/Express API server with TypeScript
- **Database**: PostgreSQL with initialization scripts
- **Reverse Proxy**: Nginx for routing and SSL termination

### Client Services (Auto-Discovered)
- Each client in `clients/` directory gets:
  - **Client Frontend**: Next.js application
  - **Client Backend**: Express API server
  - **Client Database**: Separate database in shared PostgreSQL instance

### Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     NGINX (Port 80/443)                        │
│                   (Routes by server_name)                      │
└──────────────┬──────────────────────────────┬──────────────────┘
               │                              │
       ┌───────┴────────┐           ┌─────────┴──────────┐
       │                │           │                    │
       ▼                ▼           ▼                    ▼
┌──────────────┐  ┌──────────┐   ┌──────────┐      ┌──────────┐
│  Portfolio   │  │ Client 1 │   │ Client 2 │ ...  │ Client N │
│  Frontend    │  │ Frontend │   │ Frontend │      │ Frontend │
└──────┬───────┘  └────┬─────┘   └────┬─────┘      └─────┬────┘
       │               │              │                  │
       ▼               ▼              ▼                  ▼
┌──────────────┐  ┌──────────┐   ┌──────────┐      ┌──────────┐
│  Portfolio   │  │ Client 1 │   │ Client 2 │ ...  │ Client N │
│  Backend     │  │ Backend  │   │ Backend  │      │ Backend  │
└──────┬───────┘  └────┬─────┘   └─────┬────┘      └─────┬────┘
       │               │               │                 │
       └───────────────┼───────────────┼─────────────────┘
                       │               │
                       ▼               ▼
                  ┌─────────────────────────┐
                  │   PostgreSQL (Shared)   │
                  │  - portfolio_db         │
                  │  - client1_db           │
                  │  - client2_db           │
                  │  - ...                  │
                  └─────────────────────────┘
```

**Key Points:**
- All services run on the same Docker network (`portfolio_network`)
- Nginx routes traffic based on domain/subdomain (`server_name`)
- Each client has its own frontend and backend containers
- All services share the same PostgreSQL instance (different databases)
- Client services are auto-generated from `clients/` directory

## 📋 Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)
- Git
- 8GB+ RAM recommended
- 10GB+ free disk space

## 🚀 Quick Start

### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd Portfolio

# Copy environment file from documentation and configure
cp documentation/env-templates/env.example .env
# Or use the helper: make setup-env
# Edit .env with your configuration
```

### 2. Discover and Integrate Clients

```bash
# Full integration (discovery + setup + verification)
yarn integrate

# This generates:
# - .generated/docker-compose.clients.yml (client services)
# - .generated/nginx.clients.conf (client routing)
# - .generated/clients.json (client metadata)
# - .generated/database-names.txt (database list)
```

### 3. Development Setup

```bash
# Start all services (Portfolio + Clients)
yarn start

# View logs
yarn logs

# View logs for specific service
./scripts/docker-stack.sh logs -f frontend
./scripts/docker-stack.sh logs -f memoon-card-frontend

# Access the application
# Portfolio Frontend (via proxy): ${NGINX_URL}
# Portfolio Backend API (via proxy): ${NGINX_URL}/api
# Client Frontend (via proxy): https://${client.subdomain}.${BASE_DOMAIN}
# Client Backend API (via proxy): https://${client.subdomain}.${BASE_DOMAIN}/api
# Direct Portfolio Frontend (dev only): localhost:${FRONTEND_PORT}
# Direct Portfolio Backend (dev only): localhost:${BACKEND_PORT}
# Direct Client Frontend (dev only): localhost:${client.ports.frontend}
# Direct Client Backend (dev only): localhost:${client.ports.backend}
```

### 4. Production Setup

```bash
# Ensure clients are discovered and integrated
yarn discover:clients
./scripts/integrate-clients.sh

# Build and start production services (Portfolio + Clients)
docker-compose \
  -f docker-compose.prod.yml \
  -f .generated/docker-compose.clients.yml \
  up -d

# View production logs
docker-compose \
  -f docker-compose.prod.yml \
  -f .generated/docker-compose.clients.yml \
  logs -f
```

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory with the following variables (example values shown):

```bash
# Database
POSTGRES_DB=portfolio_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Backend
JWT_SECRET=your_super_secret_jwt_key_32_chars_min
NODE_ENV=development
BACKEND_PORT=4000

# Frontend
# Set NGINX_URL to your proxy origin once, then derive API URL from it
NGINX_URL=https://localhost
NEXT_PUBLIC_API_URL=${NGINX_URL}/api
```

See `env.example` for complete configuration options.

## 🛠️ Development Workflow

### Starting Development Environment

```bash
# Start all services (Portfolio + Clients)
docker-compose \
  -f docker-compose.yml \
  -f .generated/docker-compose.clients.yml \
  up -d

# Start specific Portfolio service
docker-compose up -d frontend
docker-compose up -d backend
docker-compose up -d postgres
docker-compose up -d nginx

# Start specific client service
docker-compose -f .generated/docker-compose.clients.yml up -d memoon-card-frontend
docker-compose -f .generated/docker-compose.clients.yml up -d memoon-card-backend
```

### Working with Individual Services

#### Frontend Development
```bash
# Access frontend container
docker-compose exec frontend sh

# Install new dependencies
docker-compose exec frontend yarn add package-name

# Run specific commands
docker-compose exec frontend yarn build
docker-compose exec frontend yarn test
```

#### Backend Development
```bash
# Access backend container
docker-compose exec backend sh

# Install new dependencies
docker-compose exec backend yarn add package-name

# Debug the backend
docker-compose exec backend yarn debug
```

#### Database Operations
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d portfolio_db

# Backup database
docker-compose exec postgres pg_dump -U postgres portfolio_db > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d portfolio_db
```

### Hot Reloading

Both Portfolio and Client services support hot reloading in development:

- **Portfolio Frontend**: Next.js hot reloading via webpack-dev-server
- **Portfolio Backend**: tsx watches for TypeScript changes with hot reload
- **Client Frontends**: Same Next.js hot reloading
- **Client Backends**: Same tsx hot reloading
- **File watching**: Uses polling for cross-platform compatibility (CHOKIDAR_USEPOLLING=1)
- **Volume mounts**: Source code mounted for live updates

### Debugging

#### Frontend Debugging
- React DevTools: Available in browser
- Next.js debugging: Built-in development tools

#### Backend Debugging
```bash
# Start backend with debug mode
docker-compose exec backend yarn debug
```

## 🏭 Production Deployment

### Building for Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production environment
docker-compose -f docker-compose.prod.yml up -d
```

### Production Features

- **Multi-stage builds**: Optimized Docker images
- **Health checks**: All services have health monitoring
- **Resource limits**: Memory and CPU constraints
- **SSL/TLS**: Nginx with SSL termination
- **Security headers**: Production-ready security configuration
- **Caching**: Aggressive caching for static assets
- **Compression**: Gzip compression enabled
- **Rate limiting**: API and web request limiting

### SSL Configuration

For production SSL:

1. Replace self-signed certificates in `nginx/ssl/`
2. Update `nginx/prod.conf` with your domain
3. Use Let's Encrypt or your SSL provider

### Environment Variables for Production

```bash
# Production environment variables
NODE_ENV=production
DEBUG=false
LOG_LEVEL=error

# Your domain configuration
NGINX_URL=https://focus-on-pixel.com
NEXT_PUBLIC_API_URL=${NGINX_URL}/api
# If you need an explicit public-only URL in the client, keep NEXT_PUBLIC_FRONTEND_URL aligned
NEXT_PUBLIC_FRONTEND_URL=${NGINX_URL}
# Server-side-only URL if needed in backend config
FRONTEND_URL=${NGINX_URL}
```

## 📊 Monitoring and Logging

### Health Checks

All services (Portfolio and Clients) include health checks:

```bash
# Check all service health
docker-compose \
  -f docker-compose.yml \
  -f .generated/docker-compose.clients.yml \
  ps

# View health status for specific service
docker inspect --format='{{.State.Health.Status}}' portfolio_frontend_dev
docker inspect --format='{{.State.Health.Status}}' portfolio_memoon-card_frontend_dev

# Check health endpoints
curl http://localhost/health                    # Nginx
curl http://localhost:${FRONTEND_PORT}/health   # Portfolio Frontend
curl http://localhost:${BACKEND_PORT}/api/health # Portfolio Backend
curl http://localhost:3002/health               # Client Frontend (example)
curl http://localhost:4002/api/health           # Client Backend (example)
```

### Logging

```bash
# View all logs (Portfolio + Clients)
docker-compose \
  -f docker-compose.yml \
  -f .generated/docker-compose.clients.yml \
  logs -f

# View specific Portfolio service logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f nginx

# View specific client service logs
docker-compose -f .generated/docker-compose.clients.yml logs -f memoon-card-frontend
docker-compose -f .generated/docker-compose.clients.yml logs -f memoon-card-backend

# Follow logs with timestamps
docker-compose logs -f -t
```

### Log Management

- **Development**: Logs output to console
- **Production**: Logs stored in volumes
  - Backend logs: `backend_logs` volume
  - Nginx logs: `nginx_logs` volume

## 🔍 Troubleshooting

### Common Issues

#### 1. Services Not Starting

```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs service_name

# Restart services
docker-compose restart
```

#### 2. Database Connection Issues

```bash
# Check database is running
docker-compose exec postgres pg_isready -U postgres

# Verify database credentials
docker-compose exec postgres psql -U postgres -d portfolio_db -c "\l"

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### 3. Port Conflicts

```bash
# Check what's using Portfolio ports
netstat -tulpn | grep :${FRONTEND_PORT}
netstat -tulpn | grep :${BACKEND_PORT}

# Check client ports (example for memoon-card)
netstat -tulpn | grep :3002  # Client frontend port
netstat -tulpn | grep :4002  # Client backend port

# Validate client configurations for conflicts
yarn check:client-conflicts

# Change ports in client.config.json if needed
# Then regenerate: yarn discover:clients
```

#### 4. Client Services Not Starting

```bash
# Check if clients were discovered
cat .generated/clients.json

# Verify client configuration
yarn check:client-conflicts

# Regenerate client configurations
yarn discover:clients

# Check client service logs
docker-compose -f .generated/docker-compose.clients.yml logs memoon-card-frontend
docker-compose -f .generated/docker-compose.clients.yml logs memoon-card-backend

# Verify Nginx includes client configs
docker-compose exec nginx ls -la /etc/nginx/conf.d/
```

## 🏢 Client Management

### Rebuilding a Client

When you change a client's Dockerfile, dependencies, or config, rebuild that client:

```bash
# From Portfolio root
yarn clients:rebuild memoon-card
yarn clients:rebuild memoon-card -- --restart   # Rebuild + restart

# From within the client folder (clients/memoon-card/ or clients/memoon-card/frontend/)
../../scripts/rebuild-client.sh
../../scripts/rebuild-client.sh --restart

# Using Make
make rebuild-client CLIENT=memoon-card
make rebuild-client-restart CLIENT=memoon-card
```

Source changes (no Dockerfile/dep changes) use hot reload via volume mounts; restart if needed: `./scripts/docker-stack.sh restart memoon-card-backend memoon-card-frontend`.

### Adding a New Client

1. **Create client directory structure:**
   ```bash
   mkdir -p clients/my-client/{frontend,backend,migrations/changesets}
   ```

2. **Create `client.config.json`:**
   ```json
   {
     "id": "my-client",
     "name": "My Client",
     "subdomain": "my-client",
     "ports": {
       "frontend": 3003,
       "backend": 4003
     },
     "database": {
       "name": "my_client_db"
     },
     "enabled": true
   }
   ```

3. **Discover and integrate:**
   ```bash
   yarn discover:clients
   ./scripts/integrate-clients.sh
   ```

4. **Start client services:**
   ```bash
   docker-compose \
     -f docker-compose.yml \
     -f .generated/docker-compose.clients.yml \
     up -d
   ```

### Client Configuration

Each client requires:
- `client.config.json` with metadata (ports, subdomain, database name)
- `frontend/Dockerfile` for frontend container
- `backend/Dockerfile` for backend container
- `migrations/changelog.xml` for database migrations

See [`CENTRALIZED_CLIENT_ARCHITECTURE.md`](./CENTRALIZED_CLIENT_ARCHITECTURE.md) for detailed client setup instructions.