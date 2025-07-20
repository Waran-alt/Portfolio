# Production SSL Setup with Let's Encrypt

## 📋 Overview

Quick setup guide for production SSL certificates using Let's Encrypt for the Portfolio application in a Docker monorepo environment.

## 🎯 What You'll Get

- **Free SSL certificates** from Let's Encrypt (trusted by all browsers)
- **Automatic renewal** every 60 days
- **Production-ready security** with modern TLS configuration
- **Zero maintenance** once set up

## 🚀 Quick Setup (5 minutes)

### 1. Prerequisites
```bash
# Ensure you have:
# - Domain ownership (e.g., focus-on-pixel.com)
# - Server access (root/sudo)
# - DNS pointing to your server IP
# - Ports 80 and 443 open
# - Docker and Docker Compose installed
```

### 2. Install Certbot
```bash
sudo apt-get update
sudo apt-get install certbot
```

### 3. Generate Certificates
```bash
# From project root - stop nginx temporarily (port 80 needed)
docker-compose -f docker-compose.prod.yml down nginx

# Generate certificates (replace with your domain)
sudo certbot certonly --standalone -d focus-on-pixel.com -d www.focus-on-pixel.com

# Verify certificates
sudo ls -la /etc/letsencrypt/live/focus-on-pixel.com/
```

### 4. Start Production Environment
```bash
# From project root - build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Check all services status
docker-compose -f docker-compose.prod.yml ps
```

### 5. Set Up Automatic Renewal
```bash
# Add to crontab (daily at 2 AM)
sudo crontab -e

# Add this line (replace with your actual project path):
0 2 * * * /path/to/your/Portfolio/scripts/renew-certs.sh >> /var/log/cert-renewal.log 2>&1
```

## ✅ Verification

```bash
# Test HTTPS
curl -I https://focus-on-pixel.com

# Check certificate status
sudo certbot certificates

# Test renewal (dry run)
sudo certbot renew --dry-run

# Check all services are running
docker-compose -f docker-compose.prod.yml ps
```

## 🔧 Common Commands

### Certificate Management
```bash
# Check expiration
sudo certbot certificates

# Manual renewal
sudo /path/to/your/Portfolio/scripts/renew-certs.sh

# Force renewal
sudo certbot certonly --standalone -d focus-on-pixel.com --force-renewal
```

### Nginx Management (Monorepo)
```bash
# Check configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx

# View logs
docker-compose -f docker-compose.prod.yml logs nginx

# View all service logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Service Management
```bash
# Start all production services
docker-compose -f docker-compose.prod.yml up -d

# Stop all production services
docker-compose -f docker-compose.prod.yml down

# Rebuild specific service
docker-compose -f docker-compose.prod.yml build nginx

# Check service health
docker-compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

## 🚨 Troubleshooting

### Certificate Issues
```bash
# Check if certificates exist
sudo ls -la /etc/letsencrypt/live/focus-on-pixel.com/

# Verify nginx can read them
docker-compose -f docker-compose.prod.yml exec nginx ls -la /etc/nginx/ssl/

# Check certificate validity
docker-compose -f docker-compose.prod.yml exec nginx openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout
```

### Nginx Issues
```bash
# Check configuration syntax
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Check for port conflicts
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# View error logs
docker-compose -f docker-compose.prod.yml logs nginx
```

### Service Dependencies
```bash
# Check if all services are running
docker-compose -f docker-compose.prod.yml ps

# Check service health
docker-compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"

# Test backend connectivity
docker-compose -f docker-compose.prod.yml exec nginx curl -I http://backend:${BACKEND_PORT}/health

# Check network connectivity
docker network ls
docker network inspect portfolio_portfolio_network
```

### DNS Issues
```bash
# Check DNS resolution
nslookup focus-on-pixel.com
dig focus-on-pixel.com

# Verify DNS propagation
# Visit: https://www.whatsmydns.net/
```

### Monorepo-Specific Issues
```bash
# Check environment files
ls -la .env*

# Verify Docker Compose configuration
docker-compose -f docker-compose.prod.yml config

# Rebuild all services
docker-compose -f docker-compose.prod.yml build --no-cache

# Check workspace dependencies
yarn workspaces info
```

## 📊 Monitoring

### Check Renewal Logs
```bash
# View renewal logs
sudo tail -f /var/log/cert-renewal.log

# Check cron execution
sudo grep CRON /var/log/syslog
```

### SSL Health Check
```bash
# Test SSL connection
openssl s_client -connect focus-on-pixel.com:443 -servername focus-on-pixel.com

# Check SSL Labs score
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=focus-on-pixel.com
```

### Service Monitoring
```bash
# Monitor all services
docker-compose -f docker-compose.prod.yml logs -f

# Check resource usage
docker stats

# Monitor specific service
docker-compose -f docker-compose.prod.yml logs -f nginx
```

## 🔒 Security Features

- **TLS 1.2/1.3** - Modern protocols only
- **Strong ciphers** - ECDHE with AES256-GCM
- **HSTS** - Force HTTPS for 2 years
- **Security headers** - Comprehensive protection
- **Perfect Forward Secrecy** - ECDHE key exchange
- **Container isolation** - Services run in isolated containers

## 🔄 Monorepo Deployment Workflow

### Initial Deployment
```bash
# 1. Set up SSL certificates (this guide)
# 2. Deploy all services
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Verify deployment
docker-compose -f docker-compose.prod.yml ps
curl -I https://focus-on-pixel.com
```

### Updates and Maintenance
```bash
# Update specific service
docker-compose -f docker-compose.prod.yml build nginx
docker-compose -f docker-compose.prod.yml up -d nginx

# Update all services
docker-compose -f docker-compose.prod.yml up -d --build

# Monitor updates
docker-compose -f docker-compose.prod.yml logs -f
```

## 📚 More Information

- **Complete SSL Guide**: See `SSL_SETUP.md` for detailed documentation
- **Development Setup**: See `DEV_SSL_SETUP.md` for local development
- **Let's Encrypt**: [letsencrypt.org](https://letsencrypt.org/)
- **SSL Labs Test**: [ssllabs.com](https://www.ssllabs.com/ssltest/)
- **Docker Compose**: [docs.docker.com](https://docs.docker.com/compose/)

---

**Last Updated:** July 2025  
**Version:** 2.0  
**Maintainer:** Portfolio Development Team 