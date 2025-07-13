# Nginx reverse proxy Dockerfile - Two-stage build

# Build arguments for certificate handling
ARG GENERATE_DEV_CERTS=true
ARG SSL_CERT_PATH=/etc/nginx/ssl

# Builder stage for SSL certificate generation (development only)
FROM nginx:1.29-alpine AS builder

# Install openssl for certificate generation
RUN apk add --no-cache openssl

# Create necessary directories
RUN mkdir -p /etc/nginx/ssl

# Generate self-signed SSL certificate for development (only if GENERATE_DEV_CERTS=true)
RUN if [ "$GENERATE_DEV_CERTS" = "true" ]; then \
  echo "Generating self-signed certificates for development..."; \
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/nginx-selfsigned.key \
  -out /etc/nginx/ssl/nginx-selfsigned.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"; \
  openssl dhparam -out /etc/nginx/ssl/dhparam.pem 4096; \
  chmod 600 /etc/nginx/ssl/nginx-selfsigned.key; \
  chmod 644 /etc/nginx/ssl/nginx-selfsigned.crt; \
  chmod 644 /etc/nginx/ssl/dhparam.pem; \
  else \
  echo "Skipping self-signed certificate generation for production..."; \
  echo "Valid SSL certificates must be provided via volume mount or build context."; \
  fi

# Base runtime stage (no certificates included)
FROM nginx:1.29-alpine AS runtime-base

# Install only runtime dependencies
RUN apk add --no-cache \
  curl \
  ca-certificates \
  dumb-init

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
  CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Development target (includes self-signed certificates)
FROM runtime-base AS development

# Copy self-signed certificates from builder stage for development
COPY --from=builder /etc/nginx/ssl /etc/nginx/ssl

# Production target (NO certificates included - must be provided via volume mount)
FROM runtime-base AS production
# Note: For production, valid SSL certificates MUST be provided via:
# 1. Volume mount: -v /etc/letsencrypt/live/focus-on-pixel.com:/etc/nginx/ssl:ro
# 2. Docker secrets or external certificate management
# 
# WARNING: This image contains NO certificates by design to prevent
# accidental serving of self-signed certificates in production. 