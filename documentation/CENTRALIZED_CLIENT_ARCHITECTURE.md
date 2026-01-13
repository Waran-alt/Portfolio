# Centralized Client Architecture

## Overview

This document describes the centralized client management architecture where all client applications are stored in a dedicated `clients/` folder, and the main project automatically discovers and configures them for Docker Compose, Nginx, and database migrations.

## Key Benefits

1. **Zero Manual Configuration**: Add a client folder → it's automatically integrated
2. **Centralized Management**: All client code in one place (`clients/`)
3. **Auto-Discovery**: Scripts automatically find and configure clients
4. **Liquibase Migrations**: Professional database migration system
5. **Scalable**: Easy to add/remove clients without touching main configs

## Architecture

```
Portfolio/
├── apps/
│   ├── frontend/              # Portfolio frontend (main)
│   └── backend/               # Portfolio backend (main)
│
├── clients/                   # 🎯 ALL CLIENT APPLICATIONS HERE
│   ├── client-1/
│   │   ├── client.config.json # Client metadata
│   │   ├── frontend/          # Client frontend
│   │   ├── backend/           # Client backend
│   │   └── migrations/        # Liquibase migrations
│   │       ├── changelog.xml
│   │       └── changesets/
│   └── client-2/
│       └── ...
│
├── scripts/
│   ├── discover-clients.ts    # Auto-discovers clients
│   ├── run-migrations.ts      # Runs Liquibase migrations
│   └── integrate-clients.sh   # Integrates configs
│
├── .generated/                # Auto-generated configs (gitignored)
│   ├── docker-compose.clients.yml
│   ├── nginx.clients.conf
│   ├── clients.json
│   └── database-names.txt
│
└── tools/
    ├── nginx/
    └── database/
        └── liquibase-setup.md
```

## Client Structure

Each client must follow this structure:

```
clients/
└── client-name/
    ├── client.config.json      # Required: Client metadata
    ├── frontend/               # Client frontend application
    │   ├── package.json
    │   ├── Dockerfile
    │   └── src/
    ├── backend/                # Client backend API
    │   ├── package.json
    │   ├── Dockerfile
    │   └── src/
    └── migrations/             # Liquibase database migrations
        ├── changelog.xml        # Main changelog
        └── changesets/          # Individual migrations
            ├── 001-initial-schema.xml
            └── ...
```

## Client Configuration

Each client must have a `client.config.json` file:

```json
{
  "id": "client-name",
  "name": "Client Display Name",
  "description": "Brief description",
  "subdomain": "client-name",
  "ports": {
    "frontend": 3001,
    "backend": 4001
  },
  "database": {
    "name": "client_name_db",
    "user": "postgres"
  },
  "enabled": true
}
```

**Required Fields:**
- `id`: Unique identifier (kebab-case)
- `name`: Display name
- `subdomain`: Subdomain for hosting
- `ports.frontend`: Frontend port
- `ports.backend`: Backend port
- `database.name`: Database name

**Optional Fields:**
- `description`: Client description
- `database.user`: Database user (defaults to postgres)
- `enabled`: Enable/disable client (defaults to true)

**Note:** The base domain is configured globally in `.env` as `BASE_DOMAIN` (e.g., `BASE_DOMAIN=owndom.com`). Full URLs are automatically constructed as `{subdomain}.{BASE_DOMAIN}`.

See `clients/client.config.json.example` for the full schema.

## Workflow

> **📖 Detailed Guide**: For a complete step-by-step guide on starting a new client project, including Git workflow recommendations and best practices, see [`CLIENT_PROJECT_START.md`](./CLIENT_PROJECT_START.md).

### 1. Add a New Client

```bash
# Create client directory
mkdir -p clients/my-client/{frontend,backend,migrations/changesets}

# Copy example config
cp clients/client.config.json.example clients/my-client/client.config.json

# Edit client.config.json with your client details
# - Set id, name, subdomain, ports, database name

# Initialize frontend and backend applications
cd clients/my-client/frontend
# Initialize Next.js, React, etc.

cd ../backend
# Initialize Express, NestJS, etc.

# Create initial Liquibase migration
cd ../migrations
# Create changelog.xml and initial changeset
```

### 2. Discover and Generate Configs

```bash
# Discover all clients and generate configurations
yarn discover:clients

# This generates:
# - .generated/docker-compose.clients.yml
# - .generated/nginx.clients.conf
# - .generated/clients.json
# - .generated/database-names.txt
```

### 3. Integrate Configurations

```bash
# Integrate client configs into main project
./scripts/integrate-clients.sh

# This:
# - Updates .env with database names
# - Prepares configs for Docker Compose and Nginx
```

### 4. Run Migrations

```bash
# Run migrations for all clients
yarn migrate:clients

# Or for a specific client
yarn migrate:client client-name
```

### 5. Start Services

```bash
# Start all services (portfolio + all clients)
docker-compose -f docker-compose.yml -f .generated/docker-compose.clients.yml up -d

# Or merge the files manually and use:
docker-compose up -d
```

## Docker Compose Integration

The discovery script generates `docker-compose.clients.yml` with services for each client.

**Option 1: Use Multiple Compose Files**

```bash
docker-compose \
  -f docker-compose.yml \
  -f .generated/docker-compose.clients.yml \
  up -d
```

**Option 2: Merge Manually**

Copy the generated services into your main `docker-compose.yml`:

```yaml
# In docker-compose.yml, add:
services:
  # ... existing services ...
  
  # Include generated client services
  # (copy from .generated/docker-compose.clients.yml)
```

## Nginx Integration

The discovery script generates `nginx.clients.conf` with server blocks for each client.

**Option 1: Include in Main Config**

Update `tools/nginx/dev.conf` or `tools/nginx/prod.conf`:

```nginx
# Include client configurations
include /etc/nginx/conf.d/clients.conf;
```

**Option 2: Auto-Include via Startup Script**

Update `tools/nginx/startup.sh` to copy the generated config:

```bash
# In startup.sh, add before starting nginx:
if [ -f "/app/.generated/nginx.clients.conf" ]; then
  cp /app/.generated/nginx.clients.conf /etc/nginx/conf.d/clients.conf
fi
```

## Git Submodules

Clients can be managed as **Git submodules** for independent version control. This is useful when:

- Clients are maintained in separate repositories
- Different teams work on different clients
- Clients need independent release cycles
- Clients should be deployable separately

### Setting Up a Client as a Submodule

```bash
# From Portfolio root
git submodule add <repository-url> clients/client-name

# Initialize submodules (first time or after cloning)
git submodule update --init --recursive

# Update submodules
git submodule update --remote
```

### Working with Submodules

```bash
# Update all submodules to latest commits
git submodule update --remote

# Update a specific submodule
cd clients/client-name
git pull origin main
cd ../..
git add clients/client-name
git commit -m "chore: update client-name submodule"
```

**Important:** Submodules must still have a valid `client.config.json` file to be discovered by the auto-discovery system. The discovery system works seamlessly with both regular directories and Git submodules.

### Benefits of Using Submodules

- **Independent Version Control**: Each client maintains its own Git history
- **Separate Release Cycles**: Clients can be versioned and released independently
- **Team Isolation**: Different teams can work on different client repositories
- **Flexible Deployment**: Clients can be deployed separately if needed
- **Full Discovery Support**: Auto-discovery works with submodules just like regular directories

## Database Migrations with Liquibase

Each client has its own Liquibase migrations in `clients/{client-id}/migrations/`.

### Migration Structure

```
migrations/
├── changelog.xml              # Main changelog
└── changesets/                # Individual migrations
    ├── 001-initial-schema.xml
    ├── 002-add-users-table.xml
    └── ...
```

### Running Migrations

```bash
# Run all client migrations
yarn migrate:clients

# Run migrations for specific client
yarn migrate:client client-name
```

### Creating a New Migration

1. Create a new changeset file in `clients/{client-id}/migrations/changesets/`
2. Add it to `changelog.xml`
3. Run migrations

See `tools/database/liquibase-setup.md` for detailed Liquibase documentation.

## Environment Variables

The integration script automatically updates `POSTGRES_MULTIPLE_DATABASES` in `.env`:

```bash
POSTGRES_MULTIPLE_DATABASES=portfolio_db,client_1_db,client_2_db
```

**Base Domain Configuration:**

The base domain is defined globally in `.env`:

```bash
# Base domain for all clients (shared across project)
BASE_DOMAIN=owndom.com
```

Client full URLs are automatically constructed as `{subdomain}.{BASE_DOMAIN}`. For example, if a client has `subdomain: "my-client"` and `BASE_DOMAIN=owndom.com`, the full URL will be `my-client.owndom.com`.

Client-specific environment variables can be added to `.env` (optional):

```bash
# Client-specific variables (optional)
CLIENT_NAME_FRONTEND_PORT=3001
CLIENT_NAME_BACKEND_PORT=4001
CLIENT_NAME_DB_NAME=client_name_db
```

## Scripts Reference

### `yarn discover:clients`

Discovers all clients and generates configuration files.

**Output:**
- `.generated/docker-compose.clients.yml`
- `.generated/nginx.clients.conf`
- `.generated/clients.json`
- `.generated/database-names.txt`

### `yarn migrate:clients`

Runs Liquibase migrations for all clients.

### `yarn migrate:client <client-id>`

Runs Liquibase migrations for a specific client.

### `./scripts/integrate-clients.sh`

Integrates generated configs into the main project:
- Updates `.env` with database names
- Prepares configs for use

## Best Practices

1. **Client IDs**: Use kebab-case (e.g., `my-client`, not `myClient` or `my_client`)
2. **Ports**: Use sequential ports starting from 3001/4001
3. **Database Names**: Use snake_case (e.g., `my_client_db`)
4. **Migrations**: One logical change per changeset
5. **Config Validation**: Always validate `client.config.json` before committing
6. **Version Control**: Commit `client.config.json` and migrations, but not `.generated/` files

## Troubleshooting

### Client Not Discovered

- Check that `client.config.json` exists and is valid JSON
- Verify `enabled` is not `false`
- Check that required fields are present

### Migrations Fail

- Ensure PostgreSQL is running and accessible
- Verify database name matches `client.config.json`
- Check Liquibase changelog syntax

### Nginx Not Routing

- Verify client config is included in Nginx config
- Check that upstream names match service names
- Ensure SSL certificates are generated for the subdomain

### Docker Compose Errors

- Verify port numbers don't conflict
- Check that Dockerfiles exist for frontend/backend
- Ensure service names are unique

## Migration from Old Structure

If you have clients in `apps/client-name/`, migrate them:

```bash
# Move client to centralized location
mv apps/client-name clients/client-name

# Create client.config.json
# Update paths in Dockerfiles
# Move database init scripts to migrations/
```

## 🔒 Security Considerations

### Database Isolation
- Each backend connects only to its own database
- No cross-database access by default
- Use separate database users for enhanced security (optional)

### CORS Configuration
Each backend should explicitly allow only its own frontend:

```typescript
// Use BASE_DOMAIN from environment variables
const BASE_DOMAIN = process.env['BASE_DOMAIN'] || 'owndom.com';
const corsOptions = {
  origin: [
    `https://client-name.${BASE_DOMAIN}`,
  ],
  credentials: true,
};
```

### SSL/TLS
- Use wildcard certificate (`*.{BASE_DOMAIN}`) for easier management
- Enable HSTS with `includeSubDomains`
- Use modern TLS protocols (1.2+)
- Base domain is configured in `.env` as `BASE_DOMAIN`

### Rate Limiting
- Separate rate limit zones per client in Nginx
- Monitor and adjust based on usage
- Protect API endpoints with appropriate limits

## 📊 Scaling Considerations

### When to Scale PostgreSQL

**Single Instance (Recommended for 5-20 clients):**
- All databases in one PostgreSQL instance
- Easy management and backup
- Low overhead

**Multiple Instances (For 20+ clients or special requirements):**
- Separate PostgreSQL instances for portfolio vs clients
- Different PostgreSQL versions per client
- Regulatory/compliance requirements

### Resource Management

**Memory Usage:**
- PostgreSQL shared_buffers: Shared across all databases
- Each database: ~10-20MB overhead
- Configure: `shared_buffers = 256MB` for 5-10 databases

**Connection Pooling:**
- Each backend maintains its own connection pool
- Total connections = Sum of all backend pools
- Configure: `max_connections = 200` (adjust based on clients)

## ❓ Frequently Asked Questions

### Q: Can I use the same database for multiple clients?

**A:** Technically yes, but not recommended. Use separate databases for:
- Complete data isolation
- Easy backup/restore per client
- Easy migration to separate servers
- Clear security boundaries

### Q: What if a client needs a different tech stack?

**A:** That's fine! Each client can use different frameworks. Just ensure:
- Dockerfile builds correctly
- Container exposes correct ports
- Health checks work
- Client configuration is properly set in `client.config.json`

### Q: How many clients can I host?

**A:** Depends on resources:
- **5-20 clients**: Single PostgreSQL instance works well
- **20-50 clients**: Still manageable, monitor resources
- **50+ clients**: Consider organizing into separate instances

### Q: Can clients share code/utilities?

**A:** Yes! Create shared packages:
```
packages/
├── shared/          # Portfolio utilities
└── flashcards/      # Shared component (example)
```

Then import in client apps:
```typescript
import { FlashcardDeck } from '@portfolio/flashcards';
```

### Q: How do I deploy a single client without affecting others?

**A:** 
```bash
# Deploy only client-1 services
docker-compose up -d client-1-frontend client-1-backend

# Restart specific service
docker-compose restart client-1-backend
```

### Q: What about development workflow?

**A:** Start only what you need:
```bash
# Work on portfolio
docker-compose up frontend backend postgres nginx

# Work on client-1
docker-compose up client-1-frontend client-1-backend postgres nginx

# Work on everything
docker-compose up
```

## Related Documentation

- `clients/README.md` - Client directory overview
- `tools/database/liquibase-setup.md` - Liquibase setup guide

