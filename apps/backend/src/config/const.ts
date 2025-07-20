// =============================================================================
// BACKEND CONSTANTS
// =============================================================================
// Constants that combine environment variables with static parts

import { SERVICE_NAMES } from '@portfolio/shared';
import { envVar } from './env';

// Internal URLs (Docker network communication)
export const INTERNAL_URLS = {
  FRONTEND: `http://${SERVICE_NAMES.FRONTEND}:${envVar.frontend.port}`,
  BACKEND: `http://${SERVICE_NAMES.BACKEND}:${envVar.server.port}`,
  POSTGRES: `postgresql://${SERVICE_NAMES.POSTGRES}:${envVar.database.config.port}`,
} as const;

// External URLs (through Nginx proxy)
export const EXTERNAL_URLS = {
  NGINX: envVar.nginx.url,
  FRONTEND: envVar.nginx.url, // Frontend is accessed through Nginx
  BACKEND: `${envVar.nginx.url}/api`, // Backend API is accessed through Nginx at /api
} as const;

// Database configuration
export const DATABASE_CONFIG = {
  URL: envVar.database.url,
  HOST: SERVICE_NAMES.POSTGRES,
  PORT: envVar.database.config.port,
} as const; 