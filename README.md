# Portfolio - Personal Developer Portfolio Website

A modern, full-stack portfolio website built with Next.js, Express.js, and PostgreSQL. Features a monorepo architecture with Docker containerization, hot reloading, and production-ready deployment.

> **🎓 Learning Project**: This portfolio is intentionally over-engineered for educational purposes. It explores enterprise-level architecture patterns, modern DevOps practices, and comprehensive development workflows that you'd typically see in larger applications.

[![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)](https://www.docker.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-green?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 Features

- **🚀 Modern Stack**: Next.js 15, Express.js, TypeScript, PostgreSQL
- **🏗️ Monorepo Architecture**: Yarn workspaces with shared packages
- **🐳 Docker Containerization**: Full development and production environments
- **⚡ Hot Reloading**: Real-time development with automatic code updates
- **🔒 Production Ready**: Security, monitoring, and deployment configurations
- **📱 Responsive Design**: Mobile-first approach with Tailwind CSS
- **🎨 Component Library**: Storybook integration for UI development
- **🧪 Testing**: Comprehensive test suite with Jest and Playwright
- **📊 Analytics**: Performance monitoring and user analytics
- **🔍 SEO Optimized**: Meta tags, structured data, and sitemap generation

## 🎓 Why Over-Engineered?

This portfolio intentionally implements enterprise-level patterns that might seem excessive for a simple portfolio site. Here's why:

### **Learning Objectives**
- **🏗️ Architecture Patterns**: Exploring monorepo structure, microservices, shared packages
- **🐳 DevOps Practices**: Learning Docker containerization, CI/CD pipelines, environment management
- **🔒 Security**: Understanding JWT authentication, rate limiting, SSL/TLS, security headers
- **📊 Monitoring**: Implementing health checks, logging, analytics, performance tracking
- **🧪 Testing**: Practicing unit, integration, and E2E testing strategies
- **📚 Documentation**: Creating comprehensive setup guides and architecture documentation

### **Skills Being Developed**
- **Full-Stack Development**: Working with frontend, backend, database, and infrastructure
- **Modern Tooling**: Learning TypeScript, Yarn PnP, Docker, Nginx, PostgreSQL
- **Development Workflows**: Implementing hot reloading, linting, formatting, Git hooks
- **Production Readiness**: Understanding security, performance, monitoring, deployment
- **System Design**: Learning scalable architecture, service communication, data flow

### **Learning Context**
While this level of complexity isn't necessary for a simple portfolio, it helps me learn:
- How enterprise software architecture works
- What production-ready systems look like
- Modern development practices and tools
- Complex deployment scenarios
- Industry-standard patterns and approaches

## 🚀 Quick Start

### Prerequisites

- **Docker** (20.10+) and **Docker Compose** (2.0+)
- **Node.js** 22+ and **Yarn** 4.9+
- **8GB+ RAM** and **10GB+ free disk space**

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd Portfolio

# Setup environment files (recommended)
make setup-env

# Or manually
./scripts/setup-env.sh
```

### 2. Start Development Environment

```bash
# Start all services (portfolio via Docker)
yarn start
# or: make dev

# Stop: yarn stop  |  Logs: yarn logs  |  Status: yarn status
```

### Development
```bash
# Docker (portfolio)
yarn start          # Start containers
yarn stop           # Stop containers
yarn logs           # Stream logs
yarn status         # Container status

# Without Docker (local dev servers)
yarn dev            # All workspaces
yarn dev:frontend   # Portfolio frontend only
yarn dev:backend    # Portfolio backend only

# Access services
- **Frontend**: ${NGINX_URL}:${FRONTEND_PORT}
- **Backend API**: ${NGINX_URL}:${BACKEND_PORT}
```

## 📁 Project Structure

```
Portfolio/
├── 🎨 Frontend (Next.js 15)
│   └── apps/frontend/
│       ├── src/app/            # App Router (Next.js 15)
│       ├── components/         # React components
│       ├── styles/             # Tailwind CSS styles
│       └── Dockerfile          # Multi-stage build
│
├── 🔧 Backend (Express API)
│   └── apps/backend/
│       ├── src/                # Express server code
│       ├── config/             # Configuration files
│       └── Dockerfile          # Multi-stage build
│
├── 📚 Shared Code
│   └── packages/shared/
│       ├── src/                # Shared utilities and types
│       └── constants.ts        # Application constants
│
├── 🌐 Infrastructure
│   ├── tools/nginx/            # Nginx configuration
│   └── tools/database/         # Database setup
│
├── 📖 Documentation
│   ├── SETUP_GUIDE.md          # Detailed setup instructions
│   ├── DOCKER_README.md        # Docker deployment guide
│   └── ENVIRONMENT_SETUP.md    # Environment configuration
│
└── 🐳 Docker & Deployment
    ├── docker-compose.yml          # Development environment
    ├── docker-compose.prod.yml     # Full production stack (API + Postgres)
    ├── docker-compose.deploy.yml   # Public landing only (Next.js)
    └── Makefile                    # Convenient commands
```

## 🛠️ Development Commands

### Using Makefile (Recommended)

```bash
# Development
make dev              # Start all services
make dev-build        # Build and start development
make logs             # View all logs
make down             # Stop all services
make restart          # Restart services

# Individual services
make frontend         # Start frontend only
make backend          # Start backend only
make database         # Start database only
make nginx            # Start nginx only

# Container access
make shell-frontend   # Access frontend container
make shell-backend    # Access backend container
make shell-database   # Access database shell
make shell-nginx      # Access nginx container

# Database operations
make db-shell         # PostgreSQL shell
make db-backup        # Create backup
make db-restore       # Restore from backup
make db-reset         # Reset database (WARNING: Data loss!)

# Code quality
make lint             # Run linting
make lint-fix         # Fix linting issues
make format           # Format code
make type-check       # TypeScript validation
make test             # Run all tests
```

### Using Yarn

```bash
# Install dependencies
yarn install

# Development
yarn dev              # Start all services
yarn dev:frontend     # Start frontend only
yarn dev:backend      # Start backend only

# Testing
yarn test             # Run all tests
yarn test:watch       # Run tests in watch mode
yarn test:coverage    # Run tests with coverage

# Code quality
yarn lint             # Run linting
yarn lint:fix         # Fix linting issues
yarn type-check       # TypeScript validation
yarn format           # Format code

# Building
yarn build            # Build all packages
yarn build:frontend   # Build frontend
yarn build:backend    # Build backend
```

### Using Docker Compose

```bash
# Development
docker-compose up -d          # Start all services
docker-compose up -d frontend # Start specific service
docker-compose logs -f        # View logs
docker-compose down           # Stop all services

# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f

# Container management
docker-compose exec frontend sh  # Access frontend container
docker-compose exec backend sh   # Access backend container
docker-compose exec postgres psql -U postgres -d portfolio_db  # Database access
```

## 🏗️ Technology Stack

### Frontend
- **Framework**: [Next.js 15.3.5](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5.8+](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4.1.11](https://tailwindcss.com/)
- **UI Components**: 
  - [Framer Motion](https://www.framer.com/motion/) (animations)
  - [Lucide React](https://lucide.dev/) (icons)
  - [React Hook Form](https://react-hook-form.com/) (forms)
- **Testing**: 
  - [Jest](https://jestjs.io/) + [Testing Library](https://testing-library.com/)
  - [Playwright](https://playwright.dev/) (E2E)

> **💡 Learning Note**: This stack helps me explore modern React development with TypeScript, comprehensive testing strategies, and production-ready tooling.

### Backend
- **Runtime**: [Node.js 22+](https://nodejs.org/)
- **Framework**: [Express.js 5.1.0](https://expressjs.com/)
- **Language**: [TypeScript 5.8+](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL 17](https://www.postgresql.org/) (Alpine)
- **Authentication**: [JWT](https://jwt.io/)
- **Validation**: [Zod](https://zod.dev/)
- **Testing**: [Mocha](https://mochajs.org/) + [Chai](https://www.chaijs.com/)

### DevOps & Tools
- **Package Manager**: [Yarn 4.9.2](https://yarnpkg.com/) (PnP)
- **Containerization**: [Docker](https://www.docker.com/) + [Docker Compose](https://docs.docker.com/compose/)
- **Reverse Proxy**: [Nginx 1.29](https://nginx.org/)
- **Code Quality**: 
  - [ESLint 9.30+](https://eslint.org/)
  - [Prettier 3.6+](https://prettier.io/)
  - [Husky](https://typicode.github.io/husky/) (Git hooks)
  - [Commitlint](https://commitlint.js.org/) (commit messages)

> **💡 Learning Note**: This stack helps me understand the DevOps parts of a project.

## 🔧 Environment Configuration

The project uses service-specific environment files for secure configuration management:

- `.env` - Shared across all services
- `.env.frontend` - Frontend-specific configuration
- `.env.backend` - Backend-specific configuration
- `.env.postgres` - Database configuration
- `.env.nginx` - Nginx configuration

**Setup**: Run `make setup-env` or `./scripts/setup-env.sh` to generate environment files from templates.

> **Security Note**: Never commit `.env` files to version control. Use `.env.*.example` templates for documentation.

## 🚀 Production Deployment

### Public landing (Hostinger / VPS)

The default production path for **focus-on-pixel.com** deploys **only the Next.js landing** (`docker-compose.deploy.yml`). It does not start PostgreSQL, the Express API, or JWT/session secrets. The container listens on **127.0.0.1**; Nginx on the VPS terminates TLS and proxies to that port (default **3000**).

**Automated deploy (GitHub Actions):** push to `main` runs `.github/workflows/deploy-hostinger.yml` via Hostinger’s `deploy-on-vps` action (`project-name: portfolio`).

Configure in the GitHub repo under **Settings → Secrets and variables → Actions → Repository** (not Environment):

| Name | Type | Purpose |
|------|------|---------|
| `HOSTINGER_API_KEY` | Secret | Hostinger API key ([hPanel → Profile → API](https://hpanel.hostinger.com/profile/api)) |
| `HOSTINGER_VM_ID` | Variable | VPS id from the hPanel URL |
| `NEXT_PUBLIC_FRONTEND_URL` | Variable | Public site URL, e.g. `https://focus-on-pixel.com` (no trailing slash) |
| `FRONTEND_PORT` | Variable | Optional; default `3000` |
| `NEXT_PUBLIC_API_URL` | Variable | Optional at build time; the landing does not call the API at runtime |

For a **private** repo, add a [Hostinger deploy SSH key](https://www.hostinger.com/support/how-to-deploy-from-private-github-repository-on-hostinger-docker-manager/) so the action can clone on the VPS.

**DNS:** point `@` and `www` **A** records to the VPS IP. A separate subdomain (e.g. another app on the same VPS) keeps its own Nginx `server` block and ports.

**Nginx on the VPS:** use `tools/nginx/examples/focus-on-pixel.com.conf` as a starting point, then Certbot (or Hostinger SSL) and `nginx -t` / reload. Do not reuse another app’s ports on the same host (e.g. keep this landing on **3000** if another stack uses **3002** / **4002**).

**Small VPS:** the landing compose caps CPU/RAM and rotates logs; on first setup (once per host, shared with other Docker apps) run `sudo bash scripts/hostinger-vps-docker-tuning.sh` over SSH. See [Docker guide](./documentation/DOCKER_README.md#git-deploy-vps-provider).

**Manual deploy on the VPS** (project directory is often `/docker/portfolio`; Hostinger may materialize the file as `docker-compose.yml` rather than `docker-compose.deploy.yml`):

```bash
cd /docker/portfolio
docker compose build --no-cache frontend
docker compose up -d
```

If the compose file is still named `docker-compose.deploy.yml`, use `docker compose -f docker-compose.deploy.yml` instead.

**Checks:** `https://focus-on-pixel.com/fr` (landing). If the site does not update after a push, inspect the Hostinger build log on the VPS (often `.build.log` under the project directory) and `docker logs portfolio_frontend_deploy`.

**If the Hostinger project exists but the container is not running:** on the VPS, `docker ps` only lists running containers. Use `docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -i portfolio` and `docker logs --tail 80 portfolio_frontend_deploy`. A status `Exited` usually means the image build failed on an older commit, `server.js` was started from the wrong path, or port `3000` is already bound on `127.0.0.1`. If `.build.log` shows `pull access denied` for `portfolio-frontend:latest`, redeploy from a commit that sets `pull_policy: never` on the frontend service so Hostinger reuses the image built from its git clone instead of pulling from Docker Hub. If the log shows `"/apps/frontend/public": not found` during **Deploying project** after a successful build, the deploy step tried to rebuild from `/docker/portfolio` (compose file only); trigger a redeploy from GitHub Actions rather than `docker compose build` in that directory. Confirm the latest `main` deploy finished in GitHub Actions, then redeploy.

### Full stack (API + database)

When you need the complete monorepo in production (Postgres, backend, internal Nginx), use `docker-compose.prod.yml` locally or on a VPS—not the Hostinger landing workflow above. That file sets per-service CPU limits (~1.05 vCPU total) and the same log rotation as the landing deploy.

```bash
# Build and start production environment
make prod-build

# View production logs
make prod-logs
```

### Production features (full stack)

- **Multi-stage Docker builds** for optimized images
- **SSL/TLS termination** with Nginx
- **Health checks** for all services
- **Resource limits** and monitoring
- **Security headers** and rate limiting
- **Static asset caching** and compression

> **💡 Learning Note**: These production features help me learn deployment practices. While overkill for a portfolio, they help me understand production systems, security, and scalability concerns.

### SSL Certificate Setup

For production SSL certificates using Let's Encrypt, see:
- [Development SSL Setup](tools/nginx/documentation/DEV_SSL_SETUP.md)
- [Production SSL Setup](tools/nginx/documentation/PROD_SSL_SETUP.md)

## 📚 Documentation

- **[Setup Guide](./documentation/SETUP_GUIDE.md)** - Detailed setup instructions
- **[Docker Guide](./documentation/DOCKER_README.md)** - Docker deployment guide
- **[Environment Setup](./documentation/ENVIRONMENT_SETUP.md)** - Environment configuration
- **[Project Architecture](./documentation/PROJECT_ARCHITECTURE.md)** - System architecture overview

## 🐛 Troubleshooting

### Common Issues

**Services won't start:**
```bash
make status    # Check service status
make logs      # View service logs
```

**Port conflicts:**
```bash
# Check what's using the ports
netstat -tulpn | grep :${FRONTEND_PORT}
netstat -tulpn | grep :${BACKEND_PORT}
```

**Database connection issues:**
```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# Reset database
make db-reset
```

**Hot reloading not working:**
```bash
# Ensure polling is enabled
# Add WATCHPACK_POLLING=true to .env.frontend

# Restart with clean volumes
make down-volumes
make dev
```

### Get Help

```bash
# Show all available commands
make help

# Check service health
make status

# Monitor resource usage
docker stats
```

### Commit Message Format

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

# Examples:
feat(frontend): add contact form component
fix(backend): resolve user authentication issue
docs(readme): update installation instructions
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Express.js](https://expressjs.com/) for the robust Node.js framework
- [Docker](https://www.docker.com/) for containerization
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS
- [TypeScript](https://www.typescriptlang.org/) for type safety

---

**Built with 🤖 using modern web technologies**

---

## 🎯 **Portfolio Purpose**

This project serves as a **learning journey** exploring:
- **Architecture Patterns**: Understanding how larger systems are structured
- **Modern Practices**: Learning current industry standards and tools
- **Full-Stack Development**: Working across frontend, backend, and infrastructure
- **DevOps Concepts**: Exploring deployment and infrastructure management
- **Continuous Learning**: Always trying to improve and explore new approaches

While a simple static site would work for a basic portfolio, this implementation helps me learn about complex, production-ready systems.

**Learning Goals**: Understanding enterprise-level thinking, modern development practices, and how to build scalable systems.