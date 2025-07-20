# Nginx Setup for Portfolio Project

A comprehensive guide to the Nginx reverse proxy configuration for the Portfolio application.

---

## 📁 Files Overview

- **`Dockerfile`** - Multi-stage Docker build for Nginx container
- **`nginx.conf`** - Global settings (gzip, caching, rate limits, security headers)
- **`prod.conf`** - Production server (HTTPS with Let's Encrypt, security, caching)
- **`dev.conf`** - Development server (HTTPS with self-signed certificates)
- **`documentation/SSL_SETUP.md`** - Complete SSL certificate documentation and reference
- **`documentation/PROD_SSL_SETUP.md`** - Quick production SSL setup guide (5 minutes)
- **`documentation/DEV_SSL_SETUP.md`** - Quick development SSL setup guide (2 minutes)

---

## 🚀 Quick Start

### Development Environment
```bash
# Start development environment with HTTPS
docker-compose up nginx

# Access Services
# Frontend: ${NGINX_URL} (accept self-signed certificate)
# Backend API: ${NGINX_URL}/api
```

### Production Environment
```bash
# 1. First, set up SSL certificates (see documentation/PROD_SSL_SETUP.md)
# 2. Start production environment
docker-compose -f docker-compose.prod.yml up -d nginx

# Access your application
# Frontend: https://yourdomain.com
# Backend API: https://yourdomain.com/api
```

---

## 🔧 What Each File Does

### `nginx.conf` - Global Configuration
- **Gzip compression** - Reduces bandwidth usage and improves load times
- **Rate limiting** - Protects against abuse and DDoS attacks
- **Cache zones** - Defines memory and disk cache areas
- **Security headers** - Global security headers for all requests
- **Buffer settings** - Optimized buffer sizes for performance
- **Logging** - Structured logging with custom formats

### `prod.conf` - Production Server
- **HTTPS enforcement** - Redirects all HTTP traffic to HTTPS
- **Let's Encrypt integration** - Uses real SSL certificates
- **Reverse proxy** - Routes `/api/*` to backend, everything else to frontend
- **Caching strategy**:
  - API responses: 1 minute (not persisted, dynamic content)
  - Frontend assets: 5 minutes (persisted, static content)
- **Security headers** - Comprehensive security protection
- **Upstream failover** - Automatic failover if services are down

### `dev.conf` - Development Server
- **HTTPS with self-signed certificates** - Consistent with production
- **HTTP to HTTPS redirect** - Matches production behavior
- **Local container routing** - Proxies to frontend and backend containers
- **Development-friendly** - Detailed error pages and logging
- **Security headers** - Basic security for development

---

## 🛠️ Nginx-Specific Commands

### Configuration Management
```bash
# Check Nginx configuration syntax
docker-compose exec nginx nginx -t

# Reload Nginx configuration (without downtime)
docker-compose exec nginx nginx -s reload

# View Nginx configuration
docker-compose exec nginx cat /etc/nginx/nginx.conf

# Test configuration from inside container
docker-compose exec nginx nginx -T
```

### Logging and Monitoring
```bash
# View Nginx access logs
docker-compose logs -f nginx

# View Nginx error logs
docker-compose exec nginx tail -f /var/log/nginx/error.log

# Check SSL certificate status
docker-compose exec nginx openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout

# Monitor Nginx processes
docker-compose exec nginx ps aux | grep nginx
```

### Nginx Container Management
```bash
# Restart Nginx container
docker-compose restart nginx

# Rebuild Nginx container
docker-compose build nginx

# Check Nginx container health
docker-compose ps nginx

# Execute commands in Nginx container
docker-compose exec nginx bash
```

---

## 🔍 Nginx-Specific Troubleshooting

### Configuration Issues
```bash
# Check configuration syntax
docker-compose exec nginx nginx -t

# View detailed configuration
docker-compose exec nginx nginx -T

# Check for configuration errors
docker-compose logs nginx | grep -i error

# Verify configuration files are mounted
docker-compose exec nginx ls -la /etc/nginx/conf.d/
```

### SSL Certificate Issues
```bash
# Verify certificates are mounted
docker-compose exec nginx ls -la /etc/nginx/ssl/

# Check certificate validity
docker-compose exec nginx openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout

# Test SSL connection
docker-compose exec nginx openssl s_client -connect ${NGINX_URL}:443 -servername ${NGINX_URL}
```

### Upstream Service Issues
```bash
# Test backend connectivity from Nginx
docker-compose exec nginx curl -I http://backend:${BACKEND_PORT}/health

# Check upstream configuration
docker-compose exec nginx nginx -T | grep upstream

# Test frontend connectivity from Nginx
docker-compose exec nginx curl -I http://frontend:${FRONTEND_PORT}

# Check Nginx error logs for upstream issues
docker-compose exec nginx tail -f /var/log/nginx/error.log
```

### Performance Issues
```bash
# Check Nginx worker processes
docker-compose exec nginx ps aux | grep nginx

# Monitor Nginx memory usage
docker-compose exec nginx cat /proc/1/status | grep VmRSS

# Check Nginx access logs for slow requests
docker-compose exec nginx tail -f /var/log/nginx/access.log | grep -E "(5[0-9]{2}|4[0-9]{2})"

# Test Nginx response time
docker-compose exec nginx curl -w "@-" -o /dev/null -s "${NGINX_URL}/health"
```

---

## 📊 Nginx Performance Features

### Caching Strategy
- **API Cache**: 1-minute TTL, not persisted (dynamic content)
- **Frontend Cache**: 5-minute TTL, persisted (static assets)
- **Gzip Compression**: Reduces bandwidth by 60-80%
- **Browser Caching**: Optimized cache headers for static assets

### Security Features
- **HTTPS Enforcement**: All traffic redirected to HTTPS
- **Security Headers**: HSTS, CSP, XSS protection, frame options
- **Rate Limiting**: Protection against abuse and DDoS
- **Modern SSL**: TLS 1.2/1.3 with strong cipher suites

### Monitoring
- **Access Logs**: Detailed request logging with custom format
- **Error Logs**: Comprehensive error tracking
- **Health Checks**: Built-in health monitoring
- **SSL Monitoring**: Certificate expiration tracking

---

## 🔧 Nginx Configuration Details

### Upstream Configuration
```nginx
# Frontend service (Next.js)
upstream frontend {
    server frontend:${FRONTEND_PORT};
}

# Backend service (Express.js)
upstream backend {
    server backend:${BACKEND_PORT};
}
```

### Reverse Proxy Rules
- **`/api/*`** → Backend service
- **`/health`** → Health check endpoint
- **All other requests** → Frontend service

### Caching Headers
- **Static assets**: `Cache-Control: public, max-age=300`
- **API responses**: `Cache-Control: no-cache, max-age=60`
- **HTML pages**: `Cache-Control: no-cache`

### Security Headers
- **HSTS**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- **CSP**: Content Security Policy for XSS protection
- **X-Frame-Options**: `DENY` to prevent clickjacking
- **X-Content-Type-Options**: `nosniff` to prevent MIME sniffing

---

## 📚 More Information

- **Production SSL**: See `documentation/PROD_SSL_SETUP.md` for quick production setup
- **Development SSL**: See `documentation/DEV_SSL_SETUP.md` for quick development setup
- **Complete SSL Guide**: See `documentation/SSL_SETUP.md` for detailed documentation
- **Nginx Documentation**: [nginx.org](https://nginx.org/en/docs/)
- **Configuration Files**: All heavily commented for learning
- **Docker Integration**: Seamless container orchestration
- **Security Best Practices**: Industry-standard security configuration

---

**Last Updated:** July 2025  
**Version:** 3.0  
**Maintainer:** Portfolio Development Team 