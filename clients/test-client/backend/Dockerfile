# Simple multi-stage build for test client backend
# Build context: Portfolio root (.) with PROJECT_ROOT=clients/test-client
# Volume mounts source to /app/clients/test-client/backend - workspace must live there

ARG PROJECT_ROOT=clients/test-client

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Workspace setup - put client at /app/clients/test-client to match volume mount path
FROM base AS workspace-setup
ARG PROJECT_ROOT=clients/test-client
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN mkdir -p clients/test-client/frontend clients/test-client/backend

COPY ${PROJECT_ROOT}/.yarnrc.yml ./clients/test-client/.yarnrc.yml
COPY ${PROJECT_ROOT}/package.json ./clients/test-client/package.json
COPY ${PROJECT_ROOT}/frontend/package.json ./clients/test-client/frontend/package.json
COPY ${PROJECT_ROOT}/backend/package.json ./clients/test-client/backend/package.json
COPY ${PROJECT_ROOT}/.yarn* ./clients/test-client/.yarn/
COPY ${PROJECT_ROOT}/backend/yarn.lock* ./clients/test-client/backend/yarn.lock

# Install dependencies (from client root)
FROM workspace-setup AS deps
WORKDIR /app/clients/test-client
RUN yarn install
WORKDIR /app

# Build
FROM deps AS builder
ARG PROJECT_ROOT=clients/test-client
COPY ${PROJECT_ROOT}/backend ./clients/test-client/backend
WORKDIR /app/clients/test-client/backend
RUN yarn build

# Runtime
FROM deps AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
COPY --from=builder /app/clients/test-client/backend/dist ./clients/test-client/backend/dist
EXPOSE 4010
WORKDIR /app/clients/test-client/backend
CMD ["yarn", "start"]

# Development - volume overlays /app/clients/test-client/backend with host source
FROM deps AS development
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
COPY --from=builder /app/clients/test-client/backend/dist ./clients/test-client/backend/dist
EXPOSE 4010
WORKDIR /app/clients/test-client/backend
CMD ["yarn", "dev"]
