// =============================================================================
// FRONTEND CONSTANTS
// =============================================================================

import { API } from '@portfolio/shared';
import { envVar } from './env';

// API Configuration (constructed from environment variables)
export const API_CONFIG = {
  BASE_URL: envVar.api.url,
  ENDPOINTS: {
    PROJECTS: `${envVar.api.url}${API.ENDPOINTS.PROJECTS}`,
    CONTACT: `${envVar.api.url}${API.ENDPOINTS.CONTACT}`,
    HEALTH: `${envVar.api.url}${API.ENDPOINTS.HEALTH}`,
  },
} as const;

// Site Configuration (constructed from environment variables)
export const SITE_CONFIG = {
  URL: envVar.frontend.url,
  API_URL: envVar.api.url,
} as const; 