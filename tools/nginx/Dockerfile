# Nginx reverse proxy Dockerfile - Multi-stage build

# Base runtime stage
FROM nginx:1.29-alpine AS runtime-base

# Install runtime dependencies
RUN apk add --no-cache \
  curl \
  ca-certificates \
  dumb-init \
  openssl

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Create SSL directory and cache directories (nginx user already exists in base image)
RUN mkdir -p /etc/nginx/ssl /var/cache/nginx/api_cache /var/cache/nginx/frontend_cache

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Note: nginx user and group (UID/GID 101) are already created by the official nginx:alpine base image
# The base image also sets up proper permissions for /var/log/nginx and /var/cache/nginx

# Security: Remove unnecessary files
RUN rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Expose ports
EXPOSE 80 443

# Security: Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Health check with better timeout
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f ${NGINX_URL}/health || exit 1

# Development target (uses runtime certificate generation)
FROM runtime-base AS development

# Copy template and startup script
COPY dev.conf /etc/nginx/conf.d/default.conf.template
COPY startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/startup.sh

# Use the startup script as the command
CMD ["/usr/local/bin/startup.sh"]

# Production target (NO certificates included - must be provided via volume mount)
FROM runtime-base AS production
# Note: For production, valid SSL certificates MUST be provided via:
# 1. Volume mount: -v /etc/letsencrypt/live/focus-on-pixel.com:/etc/nginx/ssl:ro
# 2. Docker secrets or external certificate management
# 
# WARNING: This image contains NO certificates by design to prevent
# accidental serving of self-signed certificates in production. 