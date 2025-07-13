# Multi-stage build for Node.js/Express backend

# Base image for build and dependency install (includes build tools)
FROM node:22-alpine AS base-build

# Install build tools and runtime dependencies
RUN apk add --no-cache libc6-compat python3 make g++ curl dumb-init

# Install Yarn 4.x (the Alpine image comes with Yarn 1.x)
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Shared context stage - copy monorepo files once
FROM base-build AS workspace-setup
WORKDIR /app

# Copy monorepo root lockfile and Yarn PnP config for proper dependency resolution
COPY yarn.lock ./yarn.lock
COPY .yarnrc.yml ./
COPY .yarn ./yarn
COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install dependencies stage (production only)
FROM workspace-setup AS deps
RUN yarn --frozen-lockfile --production

# Install all dependencies (including dev) for building
FROM workspace-setup AS deps-all
RUN yarn --frozen-lockfile

# Build shared package first
FROM deps-all AS shared-builder
WORKDIR /app

# Copy shared package source files and root tsconfig
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/tsconfig.json
COPY tsconfig.json ./tsconfig.json

# Build shared package
WORKDIR /app/packages/shared
RUN yarn build

# Build backend with shared package available
FROM shared-builder AS backend-builder
WORKDIR /app

# Copy backend source files
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/tsconfig.json ./apps/backend/tsconfig.json

# Build backend (shared package dist is already available)
WORKDIR /app/apps/backend
RUN yarn build

# Minimal runtime base image for production
FROM node:22-alpine AS base-runtime
RUN apk add --no-cache libc6-compat curl dumb-init

# Production stage
FROM base-runtime AS production
WORKDIR /app

# Create app user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy Yarn PnP files from deps stage (production dependencies only)
COPY --from=deps /app/.pnp.cjs ./.pnp.cjs
COPY --from=deps /app/.yarn ./.yarn

# Copy built application and shared package
COPY --from=backend-builder --chown=nodejs:nodejs /app/apps/backend/dist ./dist
COPY --from=shared-builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

# Set environment
ENV NODE_ENV=production
ENV PORT=${BACKEND_PORT:-4000}

# Security: Switch to non-root user
USER nodejs

# Expose port
EXPOSE ${BACKEND_PORT:-4000}

# Security: Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Health check with better timeout
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${BACKEND_PORT:-4000}/api/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]

# Development stage
FROM workspace-setup AS development
RUN yarn install

# Create necessary directories
RUN mkdir -p apps/backend/src apps/backend/logs packages/shared/src

# Build shared package for development
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/tsconfig.json
WORKDIR /app/packages/shared
RUN yarn build

# Set up backend for development
WORKDIR /app/apps/backend

# Set environment for development
ENV NODE_ENV=development
ENV PORT=${BACKEND_PORT:-4000}

# Expose ports (4000 for app, 9229 for debugging)
EXPOSE ${BACKEND_PORT:-4000} ${BACKEND_DEBUG_PORT:-9229}

# Health check for development
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${BACKEND_PORT:-4000}/api/health || exit 1

# Start development server with debugging
CMD ["yarn", "dev"] 