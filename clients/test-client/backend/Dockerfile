# Simple multi-stage build for test client backend
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
COPY clients/test-client/backend/yarn.lock* ./yarn.lock

# Install dependencies
FROM workspace-setup AS deps
RUN yarn install

# Build
FROM deps AS builder
WORKDIR /app
COPY clients/test-client/backend ./backend
WORKDIR /app/backend
RUN yarn build

# Runtime
FROM deps AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
COPY --from=builder /app/backend/dist ./backend/dist
EXPOSE 4010
WORKDIR /app/backend
CMD ["yarn", "start"]

# Development target (same as runner but with source mounted)
FROM deps AS development
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
COPY --from=builder /app/backend/dist ./backend/dist
EXPOSE 4010
WORKDIR /app/backend
CMD ["yarn", "dev"]
