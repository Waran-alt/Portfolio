# Quick Setup Guide

This guide will help you get the Docker monorepo environment up and running in minutes.

## 🚀 Quick Start (3 minutes)

### 1. Prerequisites Check
```bash
# Verify Docker and Docker Compose are installed
docker --version
docker-compose --version

# Ensure you have at least 8GB RAM and 10GB free disk space
```

### 2. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd Portfolio

# Set up environment files from templates
# Option 1: Using Makefile (recommended)
make setup-env

# Option 2: Using script directly
./scripts/setup-env.sh

# Option 3: Manually
cp documentation/env-templates/env.example .env
cp documentation/env-templates/env.frontend.example .env.frontend
cp documentation/env-templates/env.backend.example .env.backend
cp documentation/env-templates/env.postgres.example .env.postgres
cp documentation/env-templates/env.nginx.example .env.nginx

# Edit the environment files with your configuration
# At minimum, set secure passwords for:
# - POSTGRES_PASSWORD (in .env.postgres)
# - JWT_SECRET (in .env.backend)
```

### 3. Start Development Environment
```bash
# Option 1: Using Makefile (recommended)
make dev

# Option 2: Using Docker Compose directly
docker-compose up -d
```

### 4. Access Your Application
- **Frontend**: https://localhost (via Nginx with HTTPS)
- **Backend API**: https://localhost/api (via Nginx with HTTPS)
- **Direct Frontend**: http://localhost:3000 (development only)
- **Direct Backend**: http://localhost:4000 (development only)
- **Database**: localhost:5432

## 📁 Project Structure

```
Portfolio/
├── docker-compose.yml              # Development environment
├── docker-compose.prod.yml         # Production environment
├── Makefile                        # Convenient commands
├── package.json                    # Yarn workspace root
├── yarn.lock                       # Locked dependencies
├── .dockerignore                   # Docker build exclusions
├── documentation/                  # Project documentation
│   ├── SETUP_GUIDE.md             # This file
│   ├── ENVIRONMENT_SETUP.md       # Environment configuration
│   ├── PROJECT_ARCHITECTURE.md    # Architecture overview
│   └── env-templates/             # Environment templates
│
├── apps/                           # Application services
│   ├── frontend/                  # Next.js application
│   │   ├── Dockerfile            # Multi-stage build (dev/prod)
│   │   ├── package.json          # Frontend dependencies
│   │   ├── tsconfig.json         # TypeScript config
│   │   └── next.config.js        # Next.js configuration
│   │
│   └── backend/                   # Node.js/Express API
│       ├── Dockerfile            # Multi-stage build (dev/prod)
│       ├── package.json          # Backend dependencies
│       └── tsconfig.json         # TypeScript config
│
├── packages/                       # Shared packages
│   └── shared/                    # Common utilities and types
│       ├── package.json          # Shared dependencies
│       └── src/                  # Shared source code
│
├── tools/                          # Infrastructure and tooling
│   ├── nginx/                     # Reverse proxy
│   │   ├── Dockerfile            # Nginx container
│   │   ├── nginx.conf            # Main configuration
│   │   ├── dev.conf              # Development config
│   │   ├── prod.conf             # Production config
│   │   └── documentation/        # SSL setup guides
│   │
│   └── database/                  # Database initialization
│       └── init/                 # Database setup scripts
│
└── scripts/                        # Build and utility scripts
    └── renew-certs.sh            # SSL certificate renewal
```

## 🛠️ Common Commands

### Development
```bash
# Start development environment
make dev

# Build and start development environment
make dev-build

# View logs
make logs

# Stop all services
make down

# Restart services
make restart

# Access container shells
make shell-frontend
make shell-backend
make shell-database
make shell-nginx
```

### Production
```bash
# Start production environment
make prod

# Build and start production environment
make prod-build

# View production logs
make prod-logs
```

### Database Operations
```bash
# Access PostgreSQL shell
make db-shell

# Create backup
make db-backup

# Restore from backup
make db-restore FILE=backup.sql

# Reset database (WARNING: Data loss!)
make db-reset
```

### Code Quality
```bash
# Run tests
make test

# Run linting
make lint

# Fix linting issues
make lint-fix

# Format code
make format

# Type checking
make type-check
```

### Service Management
```bash
# Start specific services
make frontend
make backend
make database
make nginx

# View service logs
make logs-frontend
make logs-backend
make logs-database
make logs-nginx

# Install dependencies
make install
make install-frontend
make install-backend
```

## 🏭 Production Deployment

### Quick Production Start
```bash
# Build and start production environment
make prod-build

# View production logs
make prod-logs
```

### Production Checklist
- [ ] Set up SSL certificates (see `tools/nginx/documentation/PROD_SSL_SETUP.md`)
- [ ] Update environment variables in all `.env.*` files
- [ ] Update domain configuration in `tools/nginx/prod.conf`
- [ ] Set strong passwords for all services
- [ ] Configure external database (optional)
- [ ] Set up monitoring and backup solutions

## 🔧 Customization

### Adding New Dependencies

**Frontend:**
```bash
# Install new package
docker-compose exec frontend yarn add package-name

# Rebuild container
docker-compose build frontend
```

**Backend:**
```bash
# Install new package 
docker-compose exec backend yarn add package-name

# Rebuild container
docker-compose build backend
```

**Shared Package:**
```bash
# Install in shared package
docker-compose exec frontend yarn workspace @portfolio/shared add package-name

# Rebuild affected containers
docker-compose build frontend backend
```

### Modifying Services

1. **Environment Variables**: Edit `.env.*` files
2. **Ports**: Modify `docker-compose.yml`
3. **Nginx Config**: Edit files in `tools/nginx/` directory
4. **Database Schema**: Modify `tools/database/init/` scripts

## 🐛 Troubleshooting

### Common Issues

**Services won't start:**
```bash
make status
make logs
```

**Port conflicts:**
```bash
# Check what's using the ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

**Database connection issues:**
```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# Reset database
make db-reset
```

**SSL certificate issues:**
```bash
# Check SSL setup
# See tools/nginx/documentation/DEV_SSL_SETUP.md for development
# See tools/nginx/documentation/PROD_SSL_SETUP.md for production
```

**Hot reloading not working:**
```bash
# Ensure polling is enabled in .env.frontend
WATCHPACK_POLLING=true

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

## 📚 Next Steps

1. **Read the comprehensive documentation**: `documentation/PROJECT_ARCHITECTURE.md`
2. **Set up your IDE**: Configure VS Code or your preferred editor for Docker development
3. **Implement your portfolio**: Start building your frontend and backend
4. **Configure CI/CD**: Set up automated builds and deployments
5. **Set up monitoring**: Implement logging and monitoring solutions

## 🤝 Need Help?

- **Documentation**: Read `documentation/PROJECT_ARCHITECTURE.md` for detailed information
- **Commands**: Run `make help` to see all available commands
- **SSL Setup**: See `tools/nginx/documentation/` for SSL configuration
- **Environment**: See `documentation/ENVIRONMENT_SETUP.md` for environment configuration

Happy coding! 🚀 