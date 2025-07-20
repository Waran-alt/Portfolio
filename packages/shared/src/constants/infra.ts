// =============================================================================
// INFRASTRUCTURE CONSTANTS
// =============================================================================
// Static infrastructure configuration (no environment variables)
// 
// IMPORTANT: Ports and URLs that change across environments should use
// environment variables. Only truly static business logic should be here.

// Service Names (Docker network hostnames)
export const SERVICE_NAMES = {
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  POSTGRES: 'postgres',
} as const;

// Standard Ports (business logic - don't change across environments)
// Note: These are fallback defaults. Use environment variables for actual ports.
export const PORTS = {
  NGINX_HTTP: 80,
  NGINX_HTTPS: 443,
  POSTGRES: 5432, // Default PostgreSQL port (can be overridden by POSTGRES_PORT env var)
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
  PORT: 5432, // Default PostgreSQL port (can be overridden by POSTGRES_PORT env var)
  SSL_MODE: 'disable', // Development default
} as const; 
