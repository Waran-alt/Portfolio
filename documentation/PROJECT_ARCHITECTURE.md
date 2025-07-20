# Portfolio Project Architecture

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PORTFOLIO MONOREPO                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│      ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│      │   DEVELOPMENT   │    │   PRODUCTION    │    │   SHARED CODE   │      │
│      │   ENVIRONMENT   │    │   ENVIRONMENT   │    │                 │      │
│      └─────────────────┘    └─────────────────┘    └─────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🐳 Docker Services Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              DOCKER COMPOSE                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│     ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│     │     NGINX       │    │    FRONTEND     │    │     BACKEND     │      │
│     │ (Reverse Proxy) │◄──►│   (Next.js)     │◄──►│  (Express API)  │      │
│     │                 │    │                 │    │                 │      │
│     └───────┬─────────┘    └─────────────────┘    └────────┬────────┘      │
│             │                                              │               │
│             │                                              │               │
│             ▼                                              ▼               │
│     ┌─────────────────┐                           ┌─────────────────┐      │
│     │   POSTGRESQL    │                           │     REDIS       │      │
│     │   DATABASE      │                           │   (Optional)    │      │
│     │                 │                           │                 │      │
│     └─────────────────┘                           └─────────────────┘      │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

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
│   ├── docker-compose.yml       # Development environment
│   ├── docker-compose.prod.yml  # Production environment
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
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.8+
- **Styling**: Tailwind CSS 4.1+
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
- **Database**: PostgreSQL 15 (Alpine)
- **Authentication**: JWT
- **Validation**: Zod
- **Testing**: Mocha + Chai
- **Development**: tsx (hot reload)

### DevOps & Tools
- **Package Manager**: Yarn 4.9+ (PnP)
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Process Management**: PM2 (production)
- **Code Quality**: 
  - ESLint 9.30+
  - Prettier 3.6+
  - Husky (Git hooks)
  - Commitlint (commit messages)

## 🚀 Development Workflow

### Quick Start Commands
```bash
make dev                    # Start development environment
make logs                   # View logs
make down                   # Stop services
make shell-frontend         # Frontend container
make shell-backend          # Backend container
make shell-database         # Database shell
```

### Service URLs
- **Frontend**: ${NGINX_URL}:${FRONTEND_PORT}
- **Backend API**: ${NGINX_URL}:${BACKEND_PORT}
- **Nginx Proxy**: ${NGINX_URL}
- **Database**: ${NGINX_URL}:${POSTGRES_PORT}

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

```
1. User Request
   ↓
2. Nginx (Port 80/443)
   ↓
3. Route to Frontend (Port ${FRONTEND_PORT}) or Backend (Port ${BACKEND_PORT})
   ↓
4. Frontend makes API calls to Backend
   ↓
5. Backend processes request and queries PostgreSQL
   ↓
6. Response flows back through the chain
```

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