# Clients Directory

This directory contains all client applications managed by the Portfolio monorepo. Each client is a self-contained application with its own frontend, backend, database migrations, and can be managed as either a regular directory or a Git submodule.

## Overview

The Portfolio monorepo uses a **centralized client architecture** where all client applications are stored in this `clients/` directory. The main project automatically discovers and integrates clients through an auto-discovery system, eliminating the need for manual configuration.

### Key Benefits

- **Zero Manual Configuration**: Add a client folder → automatically integrated
- **Centralized Management**: All client code in one place
- **Auto-Discovery**: Scripts automatically find and configure clients
- **Flexible Version Control**: Clients can be regular directories or Git submodules
- **Isolated Resources**: Each client has its own database, ports, and domain

## Structure

Each client must follow this structure:

```
clients/
├── client-name/              # Client directory (kebab-case ID)
│   ├── client.config.json    # Required: Client metadata and configuration
│   ├── frontend/             # Client frontend application
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── src/
│   ├── backend/              # Client backend API
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── src/
│   └── migrations/           # Liquibase database migrations
│       ├── changelog.xml     # Main changelog file
│       └── changesets/       # Individual migration files
│           ├── 001-initial-schema.xml
│           └── ...
└── client.config.json.example  # Example configuration template
```

## Client Configuration

Each client **must** have a `client.config.json` file in its root directory. This file defines all metadata needed for auto-discovery and integration.

### Required Fields

- **`id`**: Unique identifier (kebab-case, must match directory name)
- **`name`**: Display name for the client
- **`subdomain`**: Subdomain where the client will be hosted
- **`ports.frontend`**: Frontend application port (must be unique)
- **`ports.backend`**: Backend API port (must be unique)
- **`database.name`**: PostgreSQL database name (must be unique)

### Optional Fields

- **`description`**: Brief description of the client
- **`database.user`**: Database user (defaults to `postgres`)
- **`enabled`**: Enable/disable client discovery (defaults to `true`)
- **`metadata`**: Additional metadata (created date, version, etc.)

### Example Configuration

```json
{
  "$schema": "../../scripts/client-config.schema.json",
  "id": "my-client",
  "name": "My Client Application",
  "description": "Description of what this client does",
  "subdomain": "my-client",
  "ports": {
    "frontend": 3001,
    "backend": 4001
  },
  "database": {
    "name": "my_client_db",
    "user": "postgres"
  },
  "enabled": true,
  "metadata": {
    "created": "2025-01-15",
    "version": "1.0.0"
  }
}
```

**Important Notes:**
- The base domain (`BASE_DOMAIN`) is configured globally in the root `.env` file
- Full URLs are automatically constructed as `{subdomain}.{BASE_DOMAIN}`
- Port numbers must be unique across all clients
- Database names must be unique and follow PostgreSQL naming conventions
- See `client.config.json.example` for the complete schema

## Auto-Discovery System

The Portfolio monorepo automatically discovers all clients in this directory and generates the necessary configurations.

### Discovery Process

The `yarn discover:clients` script:

1. Scans the `clients/` directory for subdirectories
2. Validates `client.config.json` files
3. Skips disabled clients (`enabled: false`)
4. Generates configuration files in `.generated/`:
   - `docker-compose.clients.yml` - Docker services for all clients
   - `nginx.clients.conf` - Nginx routing configuration
   - `clients.json` - Client metadata JSON
   - `database-names.txt` - List of database names

### Integration

After discovery, generated configs can be integrated into the main project:

```bash
# Run discovery
yarn discover:clients

# Integrate configurations (updates .env, prepares configs)
./scripts/integrate-clients.sh
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

# Initialize submodules (first time)
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

**Note:** Submodules must still have a valid `client.config.json` file to be discovered by the auto-discovery system.

## Workflow

### Adding a New Client

1. **Create directory structure**
   ```bash
   mkdir -p clients/my-client/{frontend,backend,migrations/changesets}
   ```

2. **Copy and configure `client.config.json`**
   ```bash
   cp clients/client.config.json.example clients/my-client/client.config.json
   # Edit client.config.json with your client details
   ```

3. **Initialize applications**
   - Set up frontend (Next.js, React, etc.)
   - Set up backend (Express, NestJS, etc.)
   - Create initial database migrations

4. **Run discovery**
   ```bash
   yarn discover:clients
   ```

5. **Integrate configurations**
   ```bash
   ./scripts/integrate-clients.sh
   ```

6. **Run migrations**
   ```bash
   yarn migrate:client my-client
   ```

> **📖 Detailed Guide**: For a complete step-by-step guide, see [`documentation/CLIENT_PROJECT_START.md`](../documentation/CLIENT_PROJECT_START.md).

### Daily Development

```bash
# Discover all clients (after adding/modifying clients)
yarn discover:clients

# Run migrations for a specific client
yarn migrate:client client-id

# Run migrations for all clients
yarn migrate:clients

# Start all services (portfolio + all clients)
docker-compose up -d
```

## Available Scripts

- **`yarn check:clients`** - Check available ports, subdomains, and database names (use before adding a new client)
- **`yarn discover:clients`** - Discover all clients and generate configurations (automatically validates for conflicts)
- **`yarn migrate:clients`** - Run database migrations for all clients
- **`yarn migrate:client <client-id>`** - Run migrations for a specific client
- **`./scripts/integrate-clients.sh`** - Integrate generated configs into main project

## Best Practices

1. **Naming Conventions**
   - Client IDs: Use kebab-case (e.g., `my-client`, not `myClient`)
   - Database names: Use snake_case (e.g., `my_client_db`)
   - Subdomains: Use kebab-case, match the client ID

2. **Port Management**
   - Use sequential ports starting from 3001/4001
   - Document port assignments to avoid conflicts
   - Check existing clients before assigning new ports

3. **Database Migrations**
   - One logical change per changeset
   - Use descriptive changeset IDs
   - Test migrations before committing

4. **Version Control**
   - Commit `client.config.json` files
   - Commit migration files
   - Do NOT commit `.generated/` directory (gitignored)
   - For submodules: Commit submodule reference updates separately

5. **Configuration Validation**
   - Always validate `client.config.json` before committing
   - Use the JSON schema for validation
   - Ensure all required fields are present

## Troubleshooting

### Client Not Discovered

- Verify `client.config.json` exists in the client directory
- Check that the file is valid JSON
- Ensure `enabled` is not `false`
- Verify all required fields are present
- Check console output from `yarn discover:clients`

### Port Conflicts

- Check existing clients for port usage
- Ensure ports are unique across all clients
- Update `client.config.json` with available ports

### Database Migration Errors

- Verify PostgreSQL is running and accessible
- Check database name matches `client.config.json`
- Validate Liquibase changelog syntax
- Check database user permissions

### Submodule Issues

- Run `git submodule update --init --recursive`
- Verify submodule remote URL is correct
- Ensure submodule has a valid `client.config.json`
- Check that submodule is at the correct commit

## Documentation

- **Client Setup Guide**: [`documentation/CLIENT_PROJECT_START.md`](../documentation/CLIENT_PROJECT_START.md)
- **Architecture Details**: [`documentation/CENTRALIZED_CLIENT_ARCHITECTURE.md`](../documentation/CENTRALIZED_CLIENT_ARCHITECTURE.md)
- **Configuration Schema**: `clients/client.config.json.example`
- **Migration System**: [`tools/database/liquibase-setup.md`](../tools/database/liquibase-setup.md)

## Current Clients

- **memoon-card** - MemoOn-Card flashcards application (Git submodule)
