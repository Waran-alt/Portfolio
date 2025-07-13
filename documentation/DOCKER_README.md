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
│                 │    │   (Port 3000)   │
└─────────┬───────┘    └─────────────────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐
│     Backend     │    │   PostgreSQL    │
│(Node.js/Express)│◄──►│   Database      │
│   (Port 4000)   │    │   (Port 5432)   │
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
cd portfolio

# Copy environment file and configure
cp env.example .env
# Edit .env with your configuration
```

### 2. Development Setup

```bash
# Start all services in development mode
docker-compose up -d

# View logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000
# Nginx: http://localhost
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

Create a `.env` file in the root directory with the following variables:

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
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Production (uncomment for production)
# NEXT_PUBLIC_API_URL=https://your-domain.com/api
# NEXT_PUBLIC_FRONTEND_URL=https://your-domain.com
# FRONTEND_URL=https://your-domain.com
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

# Connect debugger to port 9229
# VS Code: Add debug configuration for port 9229
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

```bash
# Generate production SSL certificates (example with Let's Encrypt)
# Place certificates in nginx/ssl/ directory
```

### Environment Variables for Production

```bash
# Production environment variables
NODE_ENV=production
DEBUG=false
LOG_LEVEL=error

# Your domain configuration
NEXT_PUBLIC_API_URL=https://focus-on-pixel.com/api
NEXT_PUBLIC_FRONTEND_URL=https://focus-on-pixel.com
FRONTEND_URL=https://focus-on-pixel.com
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
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000
netstat -tulpn | grep :80

# Change ports in docker-compose.yml if needed
```

#### 4. File Permission Issues

```bash
# Fix permissions (Linux/Mac)
sudo chown -R $USER:$USER .

# For Windows, ensure Docker has file sharing enabled
```

#### 5. Memory Issues

```bash
# Check container resource usage
docker stats

# Increase Docker memory limit
# Docker Desktop -> Settings -> Resources -> Memory
```

#### 6. Hot Reloading Not Working

```bash
# For Windows/Mac, ensure WATCHPACK_POLLING=true
# In .env or docker-compose.yml

# Restart with clean volumes
docker-compose down -v
docker-compose up -d
```

### Network Issues

```bash
# Check Docker networks
docker network ls

# Inspect network configuration
docker network inspect portfolio_portfolio_network

# Test connectivity between services
docker-compose exec frontend ping backend
docker-compose exec backend ping postgres
```

### Debugging Build Issues

```bash
# Build with no cache
docker-compose build --no-cache

# Build specific service
docker-compose build frontend --no-cache

# Check build context
docker-compose config
```

## 🧪 Testing

### Running Tests

```bash
# Frontend tests
docker-compose exec frontend yarn test

# Backend tests
docker-compose exec backend yarn test

# E2E tests
docker-compose exec frontend yarn test:e2e
```

### Test Database

```bash
# Use separate test environment
cp docker-compose.yml docker-compose.test.yml
# Modify for test configuration
docker-compose -f docker-compose.test.yml up -d
```

## 📦 Adding New Dependencies

### Frontend Dependencies
```bash
# Add runtime dependency
docker-compose exec frontend yarn add package-name

# Add development dependency
docker-compose exec frontend yarn add -D package-name

# Rebuild container after major changes
docker-compose build frontend
```

### Backend Dependencies
```bash
# Add runtime dependency
docker-compose exec backend yarn add package-name

# Add development dependency
docker-compose exec backend yarn add -D package-name

# Rebuild container after major changes
docker-compose build backend
```

## 🔄 Maintenance

### Regular Maintenance Tasks

```bash
# Update base images
docker-compose pull

# Clean up unused images
docker image prune -a

# Clean up volumes (BE CAREFUL - DATA LOSS)
docker volume prune

# Backup database regularly
docker-compose exec postgres pg_dump -U postgres portfolio_db > "backup_$(date +%Y%m%d_%H%M%S).sql"
```

### Database Migrations

```bash
# Run migrations (example)
docker-compose exec backend yarn migrate

# Seed database
docker-compose exec backend yarn seed

# Reset database
docker-compose down -v postgres
docker-compose up -d postgres
```

## 🔐 SSL Certificate Setup

For production SSL certificates using Let's Encrypt, see:
- [SSL Setup Guide](SSL_SETUP.md) - Complete Let's Encrypt configuration
- [Automatic renewal](SSL_SETUP.md#automatic-renewal) - Zero-maintenance certificates
- [Troubleshooting](SSL_SETUP.md#monitoring-and-troubleshooting) - Common issues and solutions

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 