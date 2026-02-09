# VatMan backend - build context: Portfolio root (.)
ARG PROJECT_ROOT=clients/vat-man

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

FROM base AS workspace-setup
ARG PROJECT_ROOT=clients/vat-man
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN mkdir -p clients/vat-man/frontend clients/vat-man/backend

COPY ${PROJECT_ROOT}/.yarnrc.yml ./clients/vat-man/.yarnrc.yml
COPY ${PROJECT_ROOT}/package.json ./clients/vat-man/package.json
COPY ${PROJECT_ROOT}/frontend/package.json ./clients/vat-man/frontend/package.json
COPY ${PROJECT_ROOT}/backend/package.json ./clients/vat-man/backend/package.json
COPY ${PROJECT_ROOT}/.yarn* ./clients/vat-man/.yarn/
COPY ${PROJECT_ROOT}/backend/yarn.lock* ./clients/vat-man/backend/yarn.lock

FROM workspace-setup AS deps
WORKDIR /app/clients/vat-man
RUN yarn install
WORKDIR /app

FROM deps AS builder
ARG PROJECT_ROOT=clients/vat-man
COPY ${PROJECT_ROOT}/backend ./clients/vat-man/backend
WORKDIR /app/clients/vat-man/backend
RUN yarn build

FROM deps AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
COPY --from=builder /app/clients/vat-man/backend/dist ./clients/vat-man/backend/dist
EXPOSE 4011
WORKDIR /app/clients/vat-man/backend
CMD ["yarn", "start"]

FROM deps AS development
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
COPY --from=builder /app/clients/vat-man/backend/dist ./clients/vat-man/backend/dist
EXPOSE 4011
WORKDIR /app/clients/vat-man/backend
CMD ["yarn", "dev"]
