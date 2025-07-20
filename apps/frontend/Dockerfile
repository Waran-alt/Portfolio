# Multi-stage build for Next.js frontend
FROM node:22-alpine AS base

# Install Yarn 4.x (the Alpine image comes with Yarn 1.x)
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Shared context stage - copy monorepo files once
FROM base AS workspace-setup
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy monorepo root lockfile and Yarn PnP config for proper dependency resolution
COPY yarn.lock ./yarn.lock
COPY .yarnrc.yml ./
COPY .yarn ./yarn
COPY package.json ./package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install dependencies only when needed
FROM workspace-setup AS deps
RUN yarn --frozen-lockfile

# Build shared package first
FROM deps AS shared-builder
WORKDIR /app

# Copy shared package source files and root tsconfig
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/tsconfig.json
COPY tsconfig.json ./tsconfig.json

# Build shared package
WORKDIR /app/packages/shared
RUN yarn build

# Build frontend with shared package available
FROM shared-builder AS frontend-builder
WORKDIR /app

# Copy frontend source files
COPY apps/frontend/src ./apps/frontend/src
COPY apps/frontend/tsconfig.json ./apps/frontend/tsconfig.json
COPY apps/frontend/next.config.js ./apps/frontend/next.config.js
COPY apps/frontend/next-env.d.ts ./apps/frontend/next-env.d.ts
COPY apps/frontend/public ./apps/frontend/public

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FRONTEND_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL

WORKDIR /app/apps/frontend
RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Security: Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

COPY --from=frontend-builder /app/apps/frontend/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=frontend-builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./

# Security: Switch to non-root user
USER nextjs

EXPOSE ${FRONTEND_PORT}

ENV PORT ${FRONTEND_PORT}
# set hostname to environment variable or default
ENV HOSTNAME ${HOSTNAME:-"0.0.0.0"}

# Security: Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Health check with better timeout
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider ${NGINX_URL}:${FRONTEND_PORT} || exit 1

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]

# Development stage
FROM workspace-setup AS development
RUN yarn install

# Build shared package for development
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/tsconfig.json
COPY tsconfig.json ./tsconfig.json
WORKDIR /app/packages/shared
RUN yarn build

# Create frontend directory structure (files will be mounted by docker-compose)
WORKDIR /app
RUN mkdir -p apps/frontend/src apps/frontend/public

# Expose port
EXPOSE ${FRONTEND_PORT}

# Health check for development
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider ${NGINX_URL}:${FRONTEND_PORT} || exit 1

# Start development server (this should keep the container running)
WORKDIR /app

# Add debugging and ensure container stays running
CMD ["sh", "-c", "set -x; echo 'Starting frontend development server...' && yarn workspace @portfolio/frontend dev 2>&1 || (echo 'yarn dev failed with exit code $?' && echo 'keeping container alive for debugging' && tail -f /dev/null)"]

# Production target
FROM runner AS production