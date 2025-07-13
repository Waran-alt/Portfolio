# SSL Certificate Setup with Let's Encrypt

## 📋 Overview

This document covers the complete SSL certificate setup using Let's Encrypt for the Portfolio application. The setup provides free, trusted SSL certificates with automatic renewal and production-ready security configuration.

## 🎯 What's Included

- **Let's Encrypt certificates** - Free, trusted SSL certificates from a recognized CA
- **Automatic renewal** - Certificates renew automatically every 60 days
- **Docker integration** - Seamless integration with Nginx container
- **Production-ready** - Modern SSL configuration with security headers
- **Zero maintenance** - Once set up, runs automatically
- **Security best practices** - Industry-standard SSL/TLS configuration
- **Monitoring** - Comprehensive logging and health checks

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Let's Encrypt │    │   Your Server    │    │   Nginx Docker  │
│                 │    │                  │    │   Container     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Challenge Request  │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │ 2. Certbot responds   │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │ 3. Issue Certificate  │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │                       │ 4. Save to filesystem │
         │                       │──────────────────────>│
         │                       │                       │
         │                       │ 5. Mount as volume    │
         │                       │──────────────────────>│
         │                       │                       │
         │                       │ 6. Nginx reads certs  │
         │                       │<──────────────────────│
```

## 🚀 Quick Start Guides

For specific setup instructions, see the dedicated guides:

- **[Production Setup](PROD_SSL_SETUP.md)** - 5-minute production SSL setup with Let's Encrypt
- **[Development Setup](DEV_SSL_SETUP.md)** - 2-minute development SSL setup with self-signed certificates

## 📋 Initial Setup (Production)

1. **Domain ownership** - You must own the domain
2. **Server access** - Root/sudo access to your server
3. **DNS configuration** - Domain must point to your server IP
4. **Firewall access** - Ports 80 and 443 must be open

### Prerequisites

1. **Domain ownership** - You must own the domain
2. **Server access** - Root/sudo access to your server
3. **DNS configuration** - Domain must point to your server IP
4. **Firewall access** - Ports 80 and 443 must be open

### DNS Configuration

Configure your domain's DNS records:

```bash
# A Records (replace YOUR_SERVER_IP with your actual IP)
focus-on-pixel.com     A    YOUR_SERVER_IP
www.focus-on-pixel.com A    YOUR_SERVER_IP
```

### Firewall Configuration

```bash
# Allow HTTP and HTTPS traffic
sudo ufw allow 80
sudo ufw allow 443

# Verify firewall status
sudo ufw status
```

### Install Certbot

```bash
# Update package list
sudo apt-get update

# Install certbot
sudo apt-get install certbot

# Verify installation
certbot --version
```

### Generate Initial Certificates

```bash
# Stop nginx temporarily (port 80 needed for verification)
docker-compose -f docker-compose.prod.yml down nginx

# Generate certificates for your domain
sudo certbot certonly --standalone -d focus-on-pixel.com -d www.focus-on-pixel.com

# Verify certificates were created
sudo ls -la /etc/letsencrypt/live/focus-on-pixel.com/
```

### Deploy Production Environment

```bash
# Build and start production environment
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Set Up Automatic Renewal

```bash
# Add renewal script to crontab
sudo crontab -e

# Add this line for daily renewal (recommended):
0 2 * * * /path/to/your/Portfolio/scripts/renew-certs.sh >> /var/log/cert-renewal.log 2>&1

# Verify crontab entry
sudo crontab -l
```

## 🔄 Automatic Renewal

### How It Works

1. **Cron job** runs daily at 2:00 AM (recommended) or twice daily if configured
2. **Certbot** checks if certificates expire within 30 days
3. **If needed**, renews certificates using same verification process
4. **Nginx container** restarts to pick up new certificates
5. **Logs** are written to `/var/log/cert-renewal.log`

### Renewal Script Details

```bash
#!/bin/bash
# scripts/renew-certs.sh
# Certificate renewal script using certbot's built-in hooks

set -e

# Set your domain
DOMAIN=${DOMAIN:-"focus-on-pixel.com"}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔄 Starting certificate renewal process for $DOMAIN..."
echo "📁 Project root: $PROJECT_ROOT"

# Use certbot's --post-hook to restart nginx only when certificates are renewed
# Use relative path from project root for better portability
certbot renew --quiet --no-self-upgrade --post-hook "cd $PROJECT_ROOT && docker-compose -f docker-compose.prod.yml restart nginx"

echo "✅ Certificate renewal process completed"
echo "ℹ️  Note: Nginx was only restarted if certificates were actually renewed"
```

**Key Improvements:**
- **No unnecessary restarts**: Nginx only restarts when certificates are actually renewed
- **Built-in reliability**: Uses Certbot's official hook mechanism
- **Simpler logic**: No manual exit code checking or output parsing
- **Better logging**: Clear indication of when restarts occur
- **Portable paths**: Automatically finds project root, no hardcoded paths

### Renewal Frequency Recommendations

**Standard Practice:**
- **Daily renewal** (recommended) - `0 2 * * *` (2:00 AM)
- **Twice daily** - Only for high-availability systems
- **Weekly** - Acceptable for low-traffic sites

**Why Daily is Recommended:**
- ✅ **Industry standard** - What most production systems use
- ✅ **Resource efficient** - Less server load and API calls
- ✅ **Let's Encrypt friendly** - Respects rate limits
- ✅ **Sufficient coverage** - 30-day renewal window is plenty
- ✅ **Easier monitoring** - Simpler log analysis

### Manual Renewal

```bash
# Test renewal without actually renewing
sudo certbot renew --dry-run

# Force renewal using the portable script
sudo /path/to/your/Portfolio/scripts/renew-certs.sh

# Force renewal with direct command (replace with your project path)
sudo certbot renew --post-hook "cd /path/to/your/Portfolio && docker-compose -f docker-compose.prod.yml restart nginx"

# Manual renewal without post-hook (if you want to control restart timing)
cd /path/to/your/Portfolio
sudo certbot renew
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🔧 Configuration Files

### Docker Compose Production

```yaml
# docker-compose.prod.yml
nginx:
  build:
    context: ./tools/nginx
    dockerfile: Dockerfile
    target: production
    args:
      GENERATE_DEV_CERTS: false
  volumes:
    - /etc/letsencrypt/live/focus-on-pixel.com:/etc/nginx/ssl:ro
```

### Nginx Configuration Structure

The Nginx configuration uses a modular approach:

- **`tools/nginx/nginx.conf`** - Main configuration file (copied to container)
- **`tools/nginx/prod.conf`** - Production server configuration (mounted as `/etc/nginx/conf.d/default.conf`)
- **`tools/nginx/dev.conf`** - Development server configuration (mounted as `/etc/nginx/conf.d/default.conf`)

### Nginx Production Configuration

```nginx
# tools/nginx/prod.conf
server {
    listen 80;
    listen [::]:80;
    server_name focus-on-pixel.com www.focus-on-pixel.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name focus-on-pixel.com www.focus-on-pixel.com;

    # SSL configuration (Let's Encrypt certificates)
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    # 4096-bit DH parameters for strong security (generated at build time)
    ssl_dhparam /etc/nginx/ssl/dhparam.pem;

    # Modern SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    # Mozilla SSL Configuration Generator (Modern profile): https://ssl-config.mozilla.org/
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Permitted-Cross-Domain-Policies "none" always;
}
```

**Notes:**
- The cipher suite is based on the Mozilla SSL Configuration Generator ("Modern" profile) for strong security and broad compatibility. See: https://ssl-config.mozilla.org/ for the latest recommendations.
- Additional security headers are included for comprehensive protection.

**Important:** Explicit domain names are used instead of `server_name _;` for security and clarity:
- **Security**: Prevents unintended behavior if multiple domains point to the same IP
- **Clarity**: Makes it clear which domains this server block handles
- **Performance**: Nginx can select the correct server block more efficiently
- **Maintenance**: Easier to understand and modify when adding new domains

### Nginx Dockerfile

For development :
```dockerfile
# tools/nginx/Dockerfile
ARG GENERATE_DEV_CERTS=true

# Builder stage for SSL certificate generation
FROM nginx:1.29-alpine AS builder
RUN apk add --no-cache openssl

# Generate self-signed certificates
RUN if [ "$GENERATE_DEV_CERTS" = "true" ]; then \
      openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/nginx-selfsigned.key \
        -out /etc/nginx/ssl/nginx-selfsigned.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"; \
    fi

FROM runtime-base AS development
COPY --from=builder /etc/nginx/ssl /etc/nginx/ssl
```

For production :
```dockerfile
# Base runtime stage (no certificates included)
FROM nginx:1.29-alpine AS runtime-base
RUN apk add --no-cache curl ca-certificates dumb-init

# Production target (NO certificates included - must be provided via volume mount)
FROM runtime-base AS production
# Note: For production, valid SSL certificates MUST be provided via:
# 1. Volume mount: -v /etc/letsencrypt/live/focus-on-pixel.com:/etc/nginx/ssl:ro
# 2. Docker secrets or external certificate management
# 
# WARNING: This image contains NO certificates by design to prevent
# accidental serving of self-signed certificates in production.
```

## 🔍 Monitoring and Troubleshooting

### Check Certificate Status

```bash
# View all certificates
sudo certbot certificates

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/focus-on-pixel.com/cert.pem -text -noout | grep "Not After"

# Test SSL connection
openssl s_client -connect focus-on-pixel.com:443 -servername focus-on-pixel.com
```

### Check Renewal Logs

```bash
# View renewal logs
sudo tail -f /var/log/cert-renewal.log

# View Let's Encrypt logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Check cron job execution
sudo grep CRON /var/log/syslog
```

### Test SSL Configuration

```bash
# Test HTTPS response
curl -I https://focus-on-pixel.com

# Test SSL Labs (external)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=focus-on-pixel.com

# Test HSTS
curl -I -H "Host: focus-on-pixel.com" https://focus-on-pixel.com
```

### Common Issues and Solutions

#### Issue: Certificate Renewal Fails

```bash
# Check if nginx is using port 80
sudo netstat -tlnp | grep :80

# Stop nginx for renewal
docker-compose -f docker-compose.prod.yml down nginx

# Renew manually
sudo certbot renew

# Restart nginx
docker-compose -f docker-compose.prod.yml up -d nginx
```

#### Issue: Nginx Can't Read Certificates

```bash
# Check certificate permissions
sudo ls -la /etc/letsencrypt/live/focus-on-pixel.com/

# Check nginx container logs
docker-compose -f docker-compose.prod.yml logs nginx

# Verify volume mount
docker-compose -f docker-compose.prod.yml exec nginx ls -la /etc/nginx/ssl/
```

#### Issue: Nginx Won't Start (No Certificates)

```bash
# Check if certificates are mounted
docker-compose -f docker-compose.prod.yml exec nginx ls -la /etc/nginx/ssl/

# If directory is empty, verify volume mount in docker-compose.prod.yml
# Ensure this line exists:
# - /etc/letsencrypt/live/focus-on-pixel.com:/etc/nginx/ssl:ro

# Check if certificates exist on host
sudo ls -la /etc/letsencrypt/live/focus-on-pixel.com/

# If certificates don't exist, generate them first:
sudo certbot certonly --standalone -d focus-on-pixel.com -d www.focus-on-pixel.com
```

#### Issue: DNS Not Resolving

```bash
# Check DNS resolution
nslookup focus-on-pixel.com
dig focus-on-pixel.com

# Verify DNS propagation
# Visit: https://www.whatsmydns.net/
```

#### Issue: Wrong Server Block Selected

```bash
# Test which server block Nginx selects
curl -H "Host: focus-on-pixel.com" http://localhost

# Check Nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Verify server_name directives
docker-compose -f docker-compose.prod.yml exec nginx grep -r "server_name" /etc/nginx/
```

## 🔒 Security Features

### Server Name Configuration

**Best Practices:**
- **Explicit domain names**: Always list specific domains instead of using `server_name _;`
- **Primary domain first**: List the primary domain first in the server_name directive
- **Include www subdomain**: Include both `domain.com` and `www.domain.com`
- **Security benefit**: Prevents unintended behavior if multiple domains point to the same IP

**Example:**
```nginx
# ✅ Good - Explicit domain names
server_name focus-on-pixel.com www.focus-on-pixel.com;

# ❌ Bad - Catch-all that can cause issues
server_name _;
```

### SSL Configuration

- **TLS 1.2 and 1.3** - Modern protocols only
- **Strong ciphers** - ECDHE-RSA-AES256-GCM-SHA512
- **Perfect Forward Secrecy** - ECDHE key exchange
- **HSTS** - Force HTTPS for 2 years
- **No certificate chains** - Simplified setup

### Security Headers

```nginx
# Security headers in nginx configuration
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' wss:; media-src 'self'; object-src 'none'; child-src 'none'; worker-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';" always;
```

### Certificate Security

- **Private key protection** - Never leaves server
- **Read-only mounts** - Container can't modify certificates
- **Automatic renewal** - Prevents expiration
- **Let's Encrypt CA** - Trusted by all browsers

## 📊 Maintenance Schedule

### Daily
- [ ] Check renewal logs (optional)
- [ ] Monitor SSL Labs score (optional)

### Weekly
- [ ] Verify certificate status
- [ ] Check nginx logs for SSL errors
- [ ] Review renewal success rate

### Monthly
- [ ] Test manual renewal
- [ ] Review security headers
- [ ] Update SSL configuration if needed
- [ ] Check certificate expiration dates

### Quarterly
- [ ] Review Let's Encrypt policy changes
- [ ] Update certbot if needed
- [ ] Test disaster recovery
- [ ] Review renewal frequency (daily vs twice daily)

## 🚨 Emergency Procedures

### Certificate Expired

```bash
# Emergency renewal
sudo certbot certonly --standalone -d focus-on-pixel.com --force-renewal

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Nginx Won't Start

```bash
# Check certificate files
sudo ls -la /etc/letsencrypt/live/focus-on-pixel.com/

# Test nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx
```

### Complete Reset

```bash
# Remove all certificates
sudo rm -rf /etc/letsencrypt/live/focus-on-pixel.com/
sudo rm -rf /etc/letsencrypt/archive/focus-on-pixel.com/

# Regenerate certificates
sudo certbot certonly --standalone -d focus-on-pixel.com

# Restart services
docker-compose -f docker-compose.prod.yml restart nginx
```

## 📚 Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot User Guide](https://certbot.eff.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)

## 🤝 Support

For issues with this SSL setup:

1. Check the troubleshooting section above
2. Review Let's Encrypt logs: `/var/log/letsencrypt/letsencrypt.log`
3. Check renewal logs: `/var/log/cert-renewal.log`
4. Verify DNS configuration
5. Test SSL connection manually
