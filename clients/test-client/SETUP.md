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

When integrated with the Portfolio monorepo, run these **from the Portfolio root**:

1. **Integrate** (first time or after adding/updating clients):
   ```bash
   yarn integrate
   ```

2. **Run migrations** (if the client has a database):
   ```bash
   yarn migrate:clients
   ```

3. **Start all services**:
   ```bash
   yarn start
   ```

### Managing Docker When Working from Client Folder

When you work inside this client directory (e.g. `clients/test-client/`) but the stack runs from the Portfolio root:

| Task                                        | From test-client folder                                                           | From Portfolio root                                                           |
|---------------------------------------------|-----------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| **Rebuild** (after Dockerfile/deps changes) | `../../scripts/rebuild-client.sh` (auto-detects client)                           | `yarn clients:rebuild test-client`                                            |
| **Rebuild + restart**                       | `../../scripts/rebuild-client.sh --restart`                                       | `yarn clients:rebuild test-client -- --restart`                               |
| **Restart** (no rebuild)                    | `../../scripts/docker-stack.sh restart test-client-backend test-client-frontend`  | `./scripts/docker-stack.sh restart test-client-backend test-client-frontend`  |
| **Logs**                                    | `../../scripts/docker-stack.sh logs -f test-client-frontend`                      | `./scripts/docker-stack.sh logs -f test-client-frontend`                      |

**Note:** Source code changes use hot reload via volume mounts—no rebuild. Rebuild only when changing `Dockerfile`, `package.json` dependencies, or other build-time config.

## Access

- **Frontend**: http://localhost:3010
- **Backend API**: http://localhost:4010
- **Production URL**: https://test-client.yourdomain.com


## Notes

- Ports are configured in `client.config.json`
- Database name is `test_client_db`
- This file was auto-generated - update as needed for your setup
