// =============================================================================
// APP & API CONSTANTS
// =============================================================================

// Application Information
export const APP = {
  NAME: 'Portfolio',
  VERSION: '0.1.0',
} as const;

// API Configuration
export const API = {
  PREFIX: '/api/v1',
  VERSION: '0.1.0',
  TITLE: 'Portfolio API',
  DESCRIPTION: 'Portfolio Backend API',
  ENDPOINTS: {
    PROJECTS: '/api/projects',
    CONTACT: '/api/contact',
    HEALTH: '/api/health',
  },
} as const; 