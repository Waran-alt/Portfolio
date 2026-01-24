# Test Client - Setup Guide

Quick setup guide for Test Client application.

## Configuration

- **Client ID**: `test-client`
- **Subdomain**: `test-client`
- **Full URL**: `https://test-client.yourdomain.com`
- **Frontend Port**: `3010`
- **Backend Port**: `4010`
- **Database**: `test_client_db`

## Environment Setup

Create a `.env` file in the client root directory with the following variables:

```bash
# =============================================================================
# APPLICATION
# =============================================================================
NODE_ENV=development

# =============================================================================
# FRONTEND
# =============================================================================
FRONTEND_PORT=3010
NEXT_PUBLIC_API_URL=http://localhost:4010

# =============================================================================
# BACKEND
# =============================================================================
BACKEND_PORT=4010

# =============================================================================
# DATABASE
# =============================================================================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=test_client_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# =============================================================================
# DATABASE CONNECTION (for Liquibase, optional)
# =============================================================================
# DATABASE_URL=jdbc:postgresql://localhost:5432/test_client_db
```

**Important Notes:**
- Update `POSTGRES_PASSWORD` with a secure password
- Configure client-specific variables (JWT, CORS, LOG_LEVEL, etc.) as needed for your application
- Ports must match the values in `client.config.json` (3010/4010)

## Development

### Standalone Development

```bash
# Start database
docker-compose up -d postgres

# Run migrations
yarn migrate:up

# Start backend
cd backend && yarn dev

# Start frontend (in another terminal)
cd frontend && yarn dev
```

### Integrated with Portfolio

When integrated with the Portfolio monorepo:

1. **Run discovery** (from Portfolio root):
   ```bash
   yarn discover:clients
   ```

2. **Run migrations**:
   ```bash
   yarn migrate:client test-client
   ```

3. **Start services**:
   ```bash
   docker-compose up -d
   ```

## Access

- **Frontend**: http://localhost:3010
- **Backend API**: http://localhost:4010
- **Production URL**: https://test-client.yourdomain.com

## Notes

- Ports are configured in `client.config.json`
- Database name is `test_client_db`
- This file was auto-generated - update as needed for your setup
