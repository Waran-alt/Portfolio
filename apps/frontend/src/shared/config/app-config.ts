/**
 * Application Configuration System
 * 
 * This module provides comprehensive configuration management for the frontend
 * application, including environment variables, API configuration, and site settings.
 * 
 * Features:
 * - Zod validation for environment variables
 * - Type-safe configuration access
 * - Centralized API and site configuration
 * - Environment-specific settings
 */

import { API } from '@portfolio/shared';
import { z } from 'zod';

// =============================================================================
// ENVIRONMENT VALIDATION SCHEMA
// =============================================================================

const environmentSchema = z.object({
  // API URL (exposed to browser) - should point to Nginx proxy, not direct backend
  NEXT_PUBLIC_API_URL: z.string().url('Must be a valid URL').optional(),

  // Service ports (server-side only, for internal Docker communication)
  FRONTEND_PORT: z.string().optional(),
  BACKEND_PORT: z.string().optional(),
  
  // External URL (Nginx proxy)
  NGINX_URL: z.string().url('Must be a valid URL').optional(),

  // Analytics (optional)
  NEXT_PUBLIC_GA_ID: z.string().optional(),

  // Build information
  NEXT_PUBLIC_BUILD_TIME: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
}).passthrough(); // Allow additional properties we don't need to validate

// =============================================================================
// VALIDATED ENVIRONMENT VARIABLES
// =============================================================================

// Safe environment variable parsing with fallbacks
const validatedEnv = (() => {
  if (typeof window !== 'undefined') {
    // Browser environment - use empty object
    return environmentSchema.parse({});
  }
  
  // Server environment - extract only the variables we need
  const envVars = {
    NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'],
    FRONTEND_PORT: process.env['FRONTEND_PORT'],
    BACKEND_PORT: process.env['BACKEND_PORT'],
    NGINX_URL: process.env['NGINX_URL'],
    NEXT_PUBLIC_GA_ID: process.env['NEXT_PUBLIC_GA_ID'],
    NEXT_PUBLIC_BUILD_TIME: process.env['NEXT_PUBLIC_BUILD_TIME'],
    NODE_ENV: process.env['NODE_ENV'],
  };
  
  try {
    return environmentSchema.parse(envVars);
  } catch (error) {
    // If validation fails, use empty object with defaults
    console.warn('Environment validation failed, using defaults:', error);
    return environmentSchema.parse({});
  }
})();

// Type-safe environment variables with fallbacks
export const env = {
  api: {
    // Use Nginx proxy URL (same origin as frontend) for API calls
    url: validatedEnv.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : `${validatedEnv.NGINX_URL || ''}/api/v1`),
  },
  frontend: {
    url: typeof window !== 'undefined' ? window.location.origin : `${validatedEnv.NGINX_URL || ''}:${validatedEnv.FRONTEND_PORT}`, // Use browser URL or env var default
    port: validatedEnv.FRONTEND_PORT || '',
  },
  nginx: {
    url: validatedEnv.NGINX_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
  },
  analytics: {
    googleAnalyticsId: validatedEnv.NEXT_PUBLIC_GA_ID,
  },
  build: {
    time: validatedEnv.NEXT_PUBLIC_BUILD_TIME || '',
  },
  isDevelopment: validatedEnv.NODE_ENV === 'development',
  isProduction: validatedEnv.NODE_ENV === 'production',
  isTest: validatedEnv.NODE_ENV === 'test',
  environment: validatedEnv.NODE_ENV,
} as const;

export type AppEnv = typeof env;

// =============================================================================
// API CONFIGURATION
// =============================================================================

/**
 * API Configuration (constructed from environment variables)
 * Provides type-safe access to all API endpoints
 */
export const API_CONFIG = {
  BASE_URL: env.api.url,
  ENDPOINTS: {
    PROJECTS: `${env.api.url}${API.ENDPOINTS.PROJECTS}`,
    CONTACT: `${env.api.url}${API.ENDPOINTS.CONTACT}`,
    HEALTH: `${env.api.url}${API.ENDPOINTS.HEALTH}`,
  },
} as const;

// =============================================================================
// SITE CONFIGURATION
// =============================================================================

/**
 * Site Configuration (constructed from environment variables)
 * Provides site-wide settings and URLs
 */
export const SITE_CONFIG = {
  URL: env.frontend.url,
  API_URL: env.api.url,
  ENVIRONMENT: env.environment,
  IS_DEVELOPMENT: env.isDevelopment,
  IS_PRODUCTION: env.isProduction,
  IS_TEST: env.isTest,
} as const;

// =============================================================================
// DEVELOPMENT CONFIGURATION
// =============================================================================

/**
 * Development-specific configuration
 * Only used in development environment
 */
export const DEV_CONFIG = {
  LOGGING: {
    ENABLED: env.isDevelopment,
    LEVEL: env.isDevelopment ? 'debug' : 'warn',
    INCLUDE_TIMESTAMPS: true,
    INCLUDE_PERFORMANCE: env.isDevelopment,
  },
  DEBUG: {
    ENABLED: env.isDevelopment,
    SHOW_ANIMATION_STATUS: env.isDevelopment,
    SHOW_PERFORMANCE_METRICS: env.isDevelopment,
  },
} as const;

// =============================================================================
// CONFIGURATION EXPORTS
// =============================================================================

/**
 * Main configuration object that combines all configuration sections
 */
export const APP_CONFIG = {
  env,
  api: API_CONFIG,
  site: SITE_CONFIG,
  dev: DEV_CONFIG,
} as const;

export type AppConfig = typeof APP_CONFIG; 