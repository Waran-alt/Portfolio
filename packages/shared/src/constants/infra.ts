// =============================================================================
// INFRASTRUCTURE CONSTANTS
// =============================================================================
// Static infrastructure configuration (no environment variables)

// Service Names (Docker network hostnames)
export const SERVICE_NAMES = {
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  POSTGRES: 'postgres',
} as const;

// Standard Ports (business logic - don't change across environments)
export const PORTS = {
  NGINX_HTTP: 80,
  NGINX_HTTPS: 443,
  POSTGRES: 5432,
} as const;

// Nginx Configuration (business logic)
export const NGINX_CONFIG = {
  RATE_LIMIT_ZONE: 'api',
  RATE_LIMIT_RATE: '10r/s',
  RATE_LIMIT_BURST: 20,
  GZIP_ENABLED: true,
  CACHE_ENABLED: true,
  CACHE_MAX_AGE: 86400, // 24 hours
} as const;

// PostgreSQL Configuration (business logic)
export const POSTGRES_CONFIG = {
  HOST: 'postgres',
  PORT: 5432,
  SSL_MODE: 'disable', // Development default
} as const; 
