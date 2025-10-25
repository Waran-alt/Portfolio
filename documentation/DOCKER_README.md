# Portfolio Docker Setup

This repository contains a comprehensive Docker setup for a Next.js portfolio application with a multi-service architecture including frontend, backend, database, and reverse proxy.

## 🏗️ Architecture Overview

The application consists of four main services:

- **Frontend**: Next.js application with TypeScript
- **Backend**: Node.js/Express API server with TypeScript
- **Database**: PostgreSQL with initialization scripts
- **Reverse Proxy**: Nginx for routing and SSL termination

```
┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │    Frontend     │
│  (Port 80/443)  │◄──►│   (Next.js)     │
└─────────┬───────┘    └─────────────────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐
│     Backend     │    │   PostgreSQL    │
│(Node.js/Express)│◄──►│   Database      │
└─────────────────┘    └─────────────────┘
```

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

### 2. Development Setup

```bash
# Start all services in development mode
docker-compose up -d

# View logs
docker-compose logs -f

# Access the application
# Frontend (via proxy): ${NGINX_URL}
# Backend API (via proxy): ${NGINX_URL}/api
# Direct Frontend (dev only): ${NGINX_URL}:${FRONTEND_PORT}
# Direct Backend (dev only): ${NGINX_URL}:${BACKEND_PORT}
# Nginx: ${NGINX_URL}
```

### 3. Production Setup

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f
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
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d frontend
docker-compose up -d backend
docker-compose up -d postgres
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

Both frontend and backend support hot reloading in development:

- **Frontend**: Next.js hot reloading via webpack-dev-server
- **Backend**: tsx watches for TypeScript changes with hot reload
- **File watching**: Uses polling for cross-platform compatibility

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

All services include health checks:

```bash
# Check service health
docker-compose ps

# View health status
docker inspect --format='{{.State.Health.Status}}' container_name
```

### Logging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f nginx

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
# Check what's using ports
netstat -tulpn | grep :${FRONTEND_PORT}
netstat -tulpn | grep :${BACKEND_PORT}

# Change ports in docker-compose.yml if needed
```