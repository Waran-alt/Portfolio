import { z } from 'zod';

// Environment variable schema for backend service
const envSchema = z.object({
  // Server Configuration
  BACKEND_PORT: z.string().transform(Number),
  HOST: z.string().default('0.0.0.0'),
  
  // Frontend Configuration
  FRONTEND_PORT: z.string().transform(Number),

  // External URL (Nginx proxy)
  NGINX_URL: z.string().url(),

  // Database Connection (can be provided directly or constructed from individual vars)
  DATABASE_URL: z.string().optional(),
  
  // Individual database configuration (used to construct DATABASE_URL if not provided)
  POSTGRES_DB: z.string().default('portfolio_db'),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_PORT: z.string().transform(Number).default('5432'),
  POSTGRES_POOL_MIN: z.string().transform(Number).default('2'),
  POSTGRES_POOL_MAX: z.string().transform(Number).default('10'),

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

// Construct DATABASE_URL from individual variables if not provided
const constructDatabaseUrl = (): string => {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }
  
  return `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@postgres:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;
};

// Export validated environment variables
export const envVar = {
  server: {
    port: env.BACKEND_PORT,
    host: env.HOST,
  },
  frontend: {
    port: env.FRONTEND_PORT,
  },
  nginx: {
    url: env.NGINX_URL,
  },
  database: {
    url: constructDatabaseUrl(),
    config: {
      host: 'postgres',
      port: env.POSTGRES_PORT,
      database: env.POSTGRES_DB,
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      poolMin: env.POSTGRES_POOL_MIN,
      poolMax: env.POSTGRES_POOL_MAX,
    },
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