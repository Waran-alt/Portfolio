// =============================================================================
// BACKEND CONSTANTS
// =============================================================================
// Constants that combine environment variables with static parts

import { PORTS, SERVICE_NAMES } from '@portfolio/shared';
import { envVar } from './env';

// Internal URLs (Docker network communication)
export const INTERNAL_URLS = {
  FRONTEND: `http://${SERVICE_NAMES.FRONTEND}:${envVar.server.port}`,
  BACKEND: `http://${SERVICE_NAMES.BACKEND}:${envVar.server.port}`,
  POSTGRES: `postgresql://${SERVICE_NAMES.POSTGRES}:${PORTS.POSTGRES}`,
} as const;

// Database configuration
export const DATABASE_CONFIG = {
  URL: envVar.database.url,
  HOST: SERVICE_NAMES.POSTGRES,
  PORT: PORTS.POSTGRES,
} as const; 