# Development SSL Setup

## 📋 Overview

Quick setup guide for development SSL certificates using self-signed certificates for local development in a Docker monorepo environment.

## 🎯 What You'll Get

- **HTTPS in development** - Consistent with production environment
- **Self-signed certificates** - Automatically generated during build
- **HTTP to HTTPS redirect** - Matches production behavior
- **Zero configuration** - Works out of the box

## 🚀 Quick Setup (2 minutes)

### 1. Start Development Environment
```bash
# From project root - start all services
docker-compose up -d

# Or start just nginx (will start dependencies automatically)
docker-compose up nginx

# Check all services status
docker-compose ps
```

### 2. Access Your Application
```bash
# Frontend: https://localhost
# Backend API: https://localhost/api
# Database: Available to backend service

# Note: Accept the self-signed certificate warning in your browser
```

## ✅ Verification

```bash
# Test HTTPS connection
curl -k -I https://localhost

# Check certificate (self-signed)
docker-compose exec nginx openssl x509 -in /etc/nginx/ssl/nginx-selfsigned.crt -text -noout

# Test HTTP to HTTPS redirect
curl -I http://localhost

# Check all services are running
docker-compose ps
```

## 🔧 Common Commands

### Development Management (Monorepo)
```bash
# Start all services
docker-compose up -d

# Start specific service with dependencies
docker-compose up nginx

# Stop all services
docker-compose down

# Rebuild with fresh certificates
docker-compose build nginx
docker-compose up nginx

# View logs
docker-compose logs nginx

# View all service logs
docker-compose logs -f

# Check configuration
docker-compose exec nginx nginx -t
```

### Service Management
```bash
# Check service status
docker-compose ps

# Check service health
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"

# Restart specific service
docker-compose restart nginx

# Rebuild specific service
docker-compose build nginx

# Check service dependencies
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

### Certificate Management
```bash
# View self-signed certificate
docker-compose exec nginx cat /etc/nginx/ssl/nginx-selfsigned.crt

# Check certificate details
docker-compose exec nginx openssl x509 -in /etc/nginx/ssl/nginx-selfsigned.crt -text -noout

# Regenerate certificates (rebuild container)
docker-compose build nginx
```

## 🚨 Troubleshooting

### Certificate Issues
```bash
# Check if certificates exist
docker-compose exec nginx ls -la /etc/nginx/ssl/

# Verify certificate validity
docker-compose exec nginx openssl x509 -in /etc/nginx/ssl/nginx-selfsigned.crt -checkend 0

# Regenerate certificates
docker-compose down nginx
docker-compose build nginx
docker-compose up nginx
```

### Nginx Issues
```bash
# Check configuration syntax
docker-compose exec nginx nginx -t

# Check for port conflicts
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# View error logs
docker-compose logs nginx
```

### Service Dependencies
```bash
# Check if all services are running
docker-compose ps

# Check service health
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"

# Test backend connectivity
docker-compose exec nginx curl -I http://backend:4000/health

# Check network connectivity
docker network ls
docker network inspect portfolio_portfolio_network
```

### Browser Issues
```bash
# If browser shows certificate warning:
# 1. Click "Advanced" or "Show Details"
# 2. Click "Proceed to localhost (unsafe)" or similar
# 3. Certificate will be accepted for this session

# For Chrome/Edge: Type "thisisunsafe" when on the warning page
# For Firefox: Click "Advanced" → "Accept the Risk and Continue"
```

### Monorepo-Specific Issues
```bash
# Check environment files
ls -la .env*

# Verify Docker Compose configuration
docker-compose config

# Rebuild all services
docker-compose build --no-cache

# Check workspace dependencies
yarn workspaces info

# Check service dependencies
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

## 🔒 Security Features

- **HTTPS enforcement** - All HTTP traffic redirected to HTTPS
- **Self-signed certificates** - Automatically generated during build
- **Security headers** - Basic security for development
- **Consistent behavior** - Matches production environment
- **Container isolation** - Services run in isolated containers

## 📊 Development vs Production

| Feature         | Development           | Production              |
|-----------------|-----------------------|-------------------------|
| Certificates    | Self-signed           | Let's Encrypt           |
| Domain          | localhost             | Your domain             |
| Browser Warning | Yes (accept manually) | No (trusted CA)         |
| Renewal         | Automatic (rebuild)   | Automatic (cron)        |
| Security        | Basic                 | Full                    |
| Services        | All monorepo services | All monorepo services   |
| Environment     | docker-compose.yml    | docker-compose.prod.yml |

## 🔄 Certificate Regeneration

### When to Regenerate
- Certificate expires (365 days)
- Development environment issues
- Security concerns
- Nginx configuration changes

### How to Regenerate
```bash
# Stop nginx
docker-compose down nginx

# Rebuild with fresh certificates
docker-compose build nginx

# Start nginx
docker-compose up nginx
```

## 🔄 Monorepo Development Workflow

### Daily Development
```bash
# 1. Start development environment
docker-compose up -d

# 2. Make changes to any service
# Changes are hot-reloaded automatically

# 3. Test changes
# Frontend: https://localhost
# Backend: https://localhost/api

# 4. Stop environment
docker-compose down
```

### Service-Specific Development
```bash
# Work on frontend only
docker-compose up frontend nginx

# Work on backend only
docker-compose up backend nginx

# Work on nginx configuration
docker-compose up nginx
# Edit tools/nginx/dev.conf
# Changes are reflected immediately
```

### Debugging
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f nginx

# Check service health
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"
```

## 📚 More Information

- **Production SSL**: See `PROD_SSL_SETUP.md` for production certificates
- **Complete SSL Guide**: See `SSL_SETUP.md` for detailed documentation
- **Nginx Configuration**: See `../README.md` for Nginx setup overview
- **Docker Compose**: [docs.docker.com](https://docs.docker.com/compose/)
- **Yarn Workspaces**: [yarnpkg.com](https://yarnpkg.com/features/workspaces)

---

**Last Updated:** July 2025  
**Version:** 2.0  
**Maintainer:** Portfolio Development Team 