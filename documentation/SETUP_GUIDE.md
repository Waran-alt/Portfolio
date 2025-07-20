# Quick Setup Guide

This guide will help you get the Docker monorepo environment up and running in minutes.

## 🚀 Quick Start (3 minutes)

### 1. Prerequisites Check
```bash
docker --version
docker-compose --version
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

# Edit the environment files with your configuration
# At minimum, set secure passwords for:
# - POSTGRES_PASSWORD (in .env.postgres)
# - JWT_SECRET (in .env.backend)
```

### 3. Start Development Environment
```bash
make dev  # Start all services in development mode
```

### 4. Access Your Application
- **Frontend**: ${NGINX_URL} (via Nginx with HTTPS)
- **Backend API**: ${NGINX_URL}/api (via Nginx with HTTPS)
- **Direct Frontend**: ${NGINX_URL}:${FRONTEND_PORT} (development only)
- **Direct Backend**: ${NGINX_URL}:${BACKEND_PORT} (development only)
- **Database**: ${NGINX_URL}:${POSTGRES_PORT}

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
make dev                # Start development environment
make dev-build          # Build and start development environment
make logs               # View logs
make down               # Stop all services
make restart            # Restart services
make shell-frontend     # Access frontend container shell
make shell-backend      # Access backend container shell
make shell-database     # Access database shell
make shell-nginx        # Access nginx container shell
```

### Production
```bash
make prod               # Start production environment
make prod-build         # Build and start production environment
make prod-logs          # View production logs
```

### Database Operations
```bash
make db-shell                       # Access PostgreSQL shell
make db-backup                      # Create database backup
make db-restore FILE=backup.sql     # Restore from backup
make db-reset                       # Reset database (WARNING: Data loss!)
```

### Code Quality
```bash
make test         # Run all tests
make lint         # Run linting
make lint-fix     # Fix linting issues
make format       # Format code
make type-check   # TypeScript type checking
```

### Service Management
```bash
make frontend           # Start only frontend service
make backend            # Start only backend service
make database           # Start only database service
make nginx              # Start only nginx service
make logs-frontend      # View frontend logs
make logs-backend       # View backend logs
make logs-database      # View database logs
make logs-nginx         # View nginx logs
make install            # Install dependencies in containers
make install-frontend   # Install frontend dependencies
make install-backend    # Install backend dependencies
```

## 🏭 Production Deployment

### Quick Production Start
```bash
make prod-build   # Build and start production environment
make prod-logs    # View production logs
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
docker-compose exec frontend yarn add package-name  # Install new package
docker-compose build frontend                       # Rebuild container
```

**Backend:**
```bash
docker-compose exec backend yarn add package-name   # Install new package
docker-compose build backend                        # Rebuild container
```

**Shared Package:**
```bash
docker-compose exec frontend yarn workspace @portfolio/shared add package-name  # Install in shared package
docker-compose build frontend backend  # Rebuild affected containers
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
make status  # Check service status
make logs    # View service logs
```

**Port conflicts:**
```bash
netstat -tulpn | grep :${FRONTEND_PORT}  # Check frontend port usage
netstat -tulpn | grep :${BACKEND_PORT}   # Check backend port usage
```

**Database connection issues:**
```bash
docker-compose exec postgres pg_isready -U postgres  # Check database status
make db-reset  # Reset database
```

**SSL certificate issues:**
```bash
# See tools/nginx/documentation/DEV_SSL_SETUP.md for development
# See tools/nginx/documentation/PROD_SSL_SETUP.md for production
```

**Hot reloading not working:**
```bash
WATCHPACK_POLLING=true  # Enable polling for cross-platform compatibility
make down-volumes       # Restart with clean volumes
make dev
```

### Get Help
```bash
make help    # Show all available commands
make status  # Check service health
docker stats # Monitor resource usage
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