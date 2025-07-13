import { z } from 'zod';

// Environment variable schema for backend service
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().transform(Number).default('4000'),
  HOST: z.string().default('0.0.0.0'),

  // Database Connection
  DATABASE_URL: z.string().url(),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Session Configuration
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_COOKIE_SECURE: z.string().transform(val => val === 'true').default('false'),
  SESSION_COOKIE_HTTPONLY: z.string().transform(val => val === 'true').default('true'),

  // CORS
  CORS_ORIGIN: z.string().url(),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default('true'),

  // Development
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Parse and validate environment variables
export const env = envSchema.parse(process.env);

// Export validated environment variables
export const envVar = {
  server: {
    port: env.PORT,
    host: env.HOST,
  },
  database: {
    url: env.DATABASE_URL,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
  },
  session: {
    secret: env.SESSION_SECRET,
    cookieSecure: env.SESSION_COOKIE_SECURE,
    cookieHttpOnly: env.SESSION_COOKIE_HTTPONLY,
  },
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_CREDENTIALS,
  },
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;

// Type for the envVar object
export type EnvVar = typeof envVar; 