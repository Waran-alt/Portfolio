# Portfolio Project Architecture

## 🐳 Docker Services Architecture

### Portfolio Services

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         PORTFOLIO DOCKER SERVICES                         │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│     ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│     │     NGINX       │    │    FRONTEND     │    │     BACKEND     │     │
│     │ (Reverse Proxy) │◄──►│   (Next.js)     │◄──►│  (Express API)  │     │
│     │  Port 80/443    │    │  Portfolio App  │    │  Portfolio API  │     │
│     └───────┬─────────┘    └─────────────────┘    └────────┬────────┘     │
│             │                                              │              │
│             │                                              │              │
│             ▼                                              ▼              │
│     ┌─────────────────┐                           ┌─────────────────┐     │
│     │   POSTGRESQL    │                           │     REDIS       │     │
│     │   DATABASE      │                           │   (Optional)    │     │
│     │  (Shared DB)    │                           │                 │     │
│     └─────────────────┘                           └─────────────────┘     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Client Services (Auto-Discovered)

```
┌────────────────────────────────────────────────────┐
│               CLIENT DOCKER SERVICES               │
├────────────────────────────────────────────────────┤
│                                                    │
│  For each client in clients/ directory:            │
│                                                    │
│     ┌─────────────────┐    ┌─────────────────┐     │
│     │  CLIENT-FRONTEND│    │  CLIENT-BACKEND │     │
│     │   (Next.js)     │    │  (Express API)  │     │
│     │  Port: 300X     │    │  Port: 400X     │     │
│     └─────────────────┘    └────────┬────────┘     │
│                                     │              │
│                                     ▼              │
│                            ┌─────────────────┐     │
│                            │   POSTGRESQL    │     │
│                            │  (Shared DB)    │     │
│                            │  Client DB: XXX │     │
│                            └─────────────────┘     │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Complete Architecture with Clients

```
┌─────────────────────────────────────────────────────┐
│                COMPLETE DOCKER STACK                │
├─────────────────────────────────────────────────────┤
│                                                     │
│                  ┌────────────────┐                 │
│                  │     NGINX      │                 │
│                  │ (Reverse Proxy)│                 │
│                  │  Port 80/443   │                 │
│                  └──────┬─────────┘                 │
│                         │                           │
│        ┌────────────────┼─────────────────┐         │
│        │                │                 │         │
│        ▼                ▼                 ▼         │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐   │
│  │Portfolio │      │ Client 1 │      │ Client N │   │
│  │ Frontend │      │ Frontend │      │ Frontend │   │
│  └────┬─────┘      └────┬─────┘      └────┬─────┘   │
│       │                 │                 │         │
│       ▼                 ▼                 ▼         │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐   │
│  │Portfolio │      │ Client 1 │      │ Client N │   │
│  │ Backend  │      │ Backend  │      │ Backend  │   │
│  └────┬─────┘      └────┬─────┘      └────┬─────┘   │
│       │                 │                 │         │
│       └─────────────────┼─────────────────┘         │
│                         │                           │
│                         ▼                           │
│                    ┌──────────┐                     │
│                    │PostgreSQL│                     │
│                    │(Shared)  │                     │
│                    └──────────┘                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key Points:**
- All services run on the same Docker network (`portfolio_network`)
- Nginx routes traffic based on `server_name` (domain/subdomain)
- Each client gets its own frontend and backend containers
- All services share the same PostgreSQL instance (different databases)
- Client services are auto-generated from `clients/` directory

## 📁 Monorepo Structure

```
Portfolio/
├── 📦 Root Configuration
│   ├── package.json              # Yarn workspaces, root scripts
│   ├── .yarnrc.yml              # Yarn PnP configuration
│   ├── tsconfig.json            # Root TypeScript config
│   ├── eslint.config.js         # ESLint configuration
│   ├── .prettierrc              # Prettier configuration
│   └── commitlint.config.js     # Git commit message rules
│
├── 🐳 Docker & Deployment
│   ├── docker-compose.yml       # Portfolio services (dev)
│   ├── docker-compose.prod.yml  # Production environment
│   ├── .generated/              # Auto-generated configs (gitignored)
│   │   ├── docker-compose.clients.yml  # Client services
│   │   ├── nginx.clients.conf          # Client Nginx config
│   │   ├── clients.json                # Client metadata
│   │   └── database-names.txt          # Database names list
│   ├── Makefile                 # Convenient commands
│   ├── env.example              # Environment template
│   └── DOCKER_README.md         # Docker documentation
│
├── 🎨 Frontend (Next.js 15)
│   └── apps/frontend/
│       ├── src/
│       │   └── app/             # App Router (Next.js 15)
│       │       ├── layout.tsx   # Root layout
│       │       └── page.tsx     # Home page
│       ├── package.json         # Dependencies & scripts
│       ├── next.config.js       # Next.js configuration
│       ├── tailwind.config.js   # Tailwind CSS config
│       └── Dockerfile           # Multi-stage build (dev/prod)
│
├── 🔧 Backend (Express API)
│   └── apps/backend/
│       ├── src/
│       │   └── index.ts         # Express server entry
│       ├── package.json         # Dependencies & scripts
│       ├── tsconfig.json        # TypeScript config
│       └── Dockerfile           # Multi-stage build (dev/prod)
│
├── 📚 Shared Code
│   └── packages/shared/
│       ├── src/
│       │   ├── index.ts         # Main exports
│       │   ├── types.ts         # Shared TypeScript types
│       │   ├── utils.ts         # Utility functions
│       │   └── constants.ts     # Shared constants
│       ├── package.json         # Shared dependencies
│       └── tsconfig.json        # TypeScript config
│
├── 🏢 Client Applications
│   └── clients/                 # Client applications directory
│       ├── client-name/         # Individual client applications
│       │   ├── client.config.json  # Client metadata (required)
│       │   ├── frontend/        # Client frontend (Next.js)
│       │   │   ├── Dockerfile   # Client frontend container
│       │   │   └── package.json
│       │   ├── backend/         # Client backend (Express)
│       │   │   ├── Dockerfile   # Client backend container
│       │   │   └── package.json
│       │   ├── migrations/      # Liquibase database migrations
│       │   └── SETUP.portfolio-generated.md  # Auto-generated by Portfolio root
│       └── README.md            # Client directory documentation
│
├── 🔧 Scripts & Automation
│   └── scripts/
│       ├── discover-clients.ts      # Auto-discovers clients
│       ├── generate-client-setup.ts # Generates SETUP.portfolio-generated.md files
│       ├── check-client-conflicts.ts # Validates client configs
│       ├── run-migrations.ts        # Runs Liquibase migrations
│       └── integrate-clients.sh     # Integration orchestration
│
├── 🌐 Nginx Configuration
│   └── tools/nginx/
│       ├── Dockerfile           # Nginx container
│       ├── nginx.conf           # Main configuration
│       ├── dev.conf             # Development config
│       └── prod.conf            # Production config
│
└── 🗄️ Database Setup
    └── tools/database/
        └── init/
            └── 01-init.sql      # Database initialization
```

## 🛠️ Technology Stack

### Frontend Stack
- **Framework**: Next.js 15.3.5 (App Router)
- **Language**: TypeScript 5.8+
- **Styling**: Tailwind CSS 4.1.11
- **UI Components**: 
  - Framer Motion (animations)
  - Lucide React (icons)
  - React Hook Form (forms)
- **Testing**: 
  - Jest + Testing Library
  - Playwright (E2E)
- **Build Tool**: Webpack (Next.js built-in)

### Backend Stack
- **Runtime**: Node.js 22+
- **Framework**: Express 5.1+
- **Language**: TypeScript 5.8+
- **Database**: PostgreSQL 17 (Alpine)
- **Authentication**: JWT
- **Validation**: Zod
- **Testing**: Mocha + Chai
- **Development**: tsx (hot reload)

### DevOps & Tools
- **Package Manager**: Yarn 4.9.2 (PnP)
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx 1.29 (Alpine)
- **Process Management**: PM2 (production)
- **Code Quality**: 
  - ESLint 9.30+
  - Prettier 3.6+
  - Husky (Git hooks)
  - Commitlint (commit messages)

## 🚀 Development Workflow

### Quick Start Commands
```bash
# Discover and integrate clients
yarn discover:clients        # Auto-discover clients and generate configs
./scripts/integrate-clients.sh  # Full integration (discovery + setup)

# Start all services (Portfolio + Clients)
docker-compose \
  -f docker-compose.yml \
  -f .generated/docker-compose.clients.yml \
  up -d

# Or use Makefile shortcuts
make dev                    # Start development environment
make logs                   # View logs
make down                   # Stop services
make shell-frontend         # Portfolio frontend container
make shell-backend          # Portfolio backend container
make shell-database         # Database shell
```

### Service URLs

**Portfolio Services:**
- **Frontend (via proxy)**: ${NGINX_URL}
- **Backend API (via proxy)**: ${NGINX_URL}/api
- **Direct Frontend (dev only)**: localhost:${FRONTEND_PORT}
- **Direct Backend (dev only)**: localhost:${BACKEND_PORT}

**Client Services (per client):**
- **Client Frontend (via proxy)**: https://${client.subdomain}.${BASE_DOMAIN}
- **Client Backend API (via proxy)**: https://${client.subdomain}.${BASE_DOMAIN}/api
- **Direct Client Frontend (dev only)**: localhost:${client.ports.frontend}
- **Direct Client Backend (dev only)**: localhost:${client.ports.backend}

**Shared Services:**
- **Nginx Proxy**: ${NGINX_URL} (Portfolio) or client subdomains
- **Database**: localhost:${POSTGRES_PORT}

### Code Quality Commands
```bash
make lint                  # Run linting
make lint-fix              # Fix linting issues
make type-check            # TypeScript validation
make test                  # Run all tests
make test-frontend         # Frontend tests only
make test-backend          # Backend tests only
make test-e2e              # End-to-end tests
```

## 🔄 Data Flow

### Portfolio Request Flow
```
1. User Request → https://${NGINX_URL}
   ↓
2. Nginx (Port 443) matches server_name
   ↓
3. Route to Portfolio Frontend (Port ${FRONTEND_PORT}) or Backend (Port ${BACKEND_PORT})
   ↓
4. Frontend makes API calls to Portfolio Backend
   ↓
5. Backend processes request and queries PostgreSQL (portfolio_db)
   ↓
6. Response flows back through the chain
```

### Client Request Flow
```
1. User Request → https://${client.subdomain}.${BASE_DOMAIN}
   ↓
2. Nginx (Port 443) matches client server_name
   ↓
3. Route to Client Frontend (Port ${client.ports.frontend}) or Backend (Port ${client.ports.backend})
   ↓
4. Client Frontend makes API calls to Client Backend
   ↓
5. Client Backend processes request and queries PostgreSQL (${client.database.name})
   ↓
6. Response flows back through the chain
```

### Nginx Routing Logic
- **Portfolio**: Routes based on main domain (`server_name ${NGINX_URL}`)
- **Clients**: Routes based on subdomain (`server_name ${client.subdomain}.${BASE_DOMAIN}`)
- **Service Discovery**: Docker DNS resolves service names (e.g., `memoon-card-backend`)
- **All services**: Share the same `portfolio_network` bridge network

## 🏭 Production Features

### Security
- **SSL/TLS**: Nginx with SSL termination
- **Security Headers**: Helmet.js configuration
- **Rate Limiting**: Express rate limiting
- **CORS**: Configured for production domains
- **Environment Variables**: Secure configuration management

### Performance
- **Multi-stage Docker builds**: Optimized images
- **Static Asset Caching**: Nginx caching rules
- **Database Connection Pooling**: PostgreSQL optimization
- **Health Checks**: All services monitored
- **Resource Limits**: Memory and CPU constraints

### Monitoring
- **Health Endpoints**: /api/health for backend
- **Logging**: Winston logger with structured logs
- **Error Tracking**: Centralized error handling
- **Metrics**: Performance monitoring ready

## 🎯 Key Features

### Development Experience
- **Hot Reloading**: Both frontend and backend
- **Type Safety**: Full TypeScript coverage
- **Debugging**: VS Code debugging support
- **Code Quality**: Automated linting and formatting
- **Testing**: Unit, integration, and E2E tests

### Production Ready
- **Containerized**: Docker for consistent deployments
- **Scalable**: Microservices architecture
- **Secure**: Production-grade security measures
- **Monitored**: Health checks and logging
- **Optimized**: Performance and caching strategies

### Developer Tools
- **Makefile**: 20+ convenient commands
- **Git Hooks**: Automated code quality checks
- **Commit Standards**: Conventional commit messages
- **Documentation**: Comprehensive setup guides
- **Environment Management**: Flexible configuration

### Client Management
- **Auto-Discovery**: Clients automatically detected from `clients/` directory
- **Zero Configuration**: Add `client.config.json` → automatically integrated
- **Docker Integration**: Client services auto-generated in `.generated/docker-compose.clients.yml`
- **Nginx Integration**: Client routing auto-generated in `.generated/nginx.clients.conf`
- **Database Management**: Each client gets its own database (shared PostgreSQL instance)
- **Migration System**: Liquibase migrations per client
- **Validation**: Conflict checking (ports, subdomains, database names)

See [`CENTRALIZED_CLIENT_ARCHITECTURE.md`](./CENTRALIZED_CLIENT_ARCHITECTURE.md) for detailed client architecture documentation.