import { z } from 'zod';

// =============================================================================
// FRONTEND ENVIRONMENT CONFIGURATION
// =============================================================================

const envSchema = z.object({
  // API & Frontend URLs (exposed to browser)
  NEXT_PUBLIC_API_URL: z.string().url('Must be a valid URL'),
  NEXT_PUBLIC_FRONTEND_URL: z.string().url('Must be a valid URL'),

  // Analytics (optional)
  NEXT_PUBLIC_GA_ID: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Parse and validate environment variables
export const env = envSchema.parse(process.env);

// Type-safe environment variables
export const envVar = {
  api: {
    url: env.NEXT_PUBLIC_API_URL,
  },
  frontend: {
    url: env.NEXT_PUBLIC_FRONTEND_URL,
  },
  analytics: {
    googleAnalyticsId: env.NEXT_PUBLIC_GA_ID,
  },
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;

export type EnvVar = typeof envVar; 