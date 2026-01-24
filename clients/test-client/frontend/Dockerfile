# Simple multi-stage build for test client frontend
# Build context: Portfolio root (.)

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Workspace setup
FROM base AS workspace-setup
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy client monorepo files
COPY clients/test-client/.yarnrc.yml ./.yarnrc.yml
COPY clients/test-client/package.json ./package.json
COPY clients/test-client/frontend/package.json ./frontend/package.json
COPY clients/test-client/backend/package.json ./backend/package.json
# Copy .yarn directory if it exists (Yarn will create it during install if missing)
COPY clients/test-client/.yarn* ./.yarn/
COPY clients/test-client/frontend/yarn.lock* ./yarn.lock

# Install dependencies
FROM workspace-setup AS deps
RUN yarn install

# Build
FROM deps AS builder
WORKDIR /app
COPY clients/test-client/frontend ./frontend
WORKDIR /app/frontend
RUN yarn build

# Runtime
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat curl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static

USER nextjs
EXPOSE 3010
ENV PORT=3010
ENV HOSTNAME="0.0.0.0"
WORKDIR /app
CMD ["node", "frontend/server.js"]

# Development target
FROM deps AS development
WORKDIR /app
ENV NODE_ENV=development
RUN apk add --no-cache libc6-compat curl
COPY clients/test-client/frontend ./frontend
WORKDIR /app/frontend
EXPOSE 3010
ENV PORT=3010
ENV HOSTNAME="0.0.0.0"
CMD ["yarn", "dev"]
