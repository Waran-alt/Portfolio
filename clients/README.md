# Clients Directory

This directory contains all client applications. Each client is a self-contained application with its own frontend, backend, and database migrations.

## Structure

```
clients/
├── client-name/
│   ├── client.config.json    # Client metadata and configuration
│   ├── frontend/              # Client frontend application
│   ├── backend/               # Client backend API
│   └── migrations/            # Liquibase database migrations
│       ├── changelog.xml      # Main changelog file
│       └── changesets/        # Individual migration files
```

## Client Configuration

Each client must have a `client.config.json` file that defines:

- **Subdomain**: The subdomain where the client will be hosted
- **Ports**: Frontend and backend port numbers
- **Database**: Database name
- **Metadata**: Display name, description, etc.

See `client.config.json.example` for the full schema.

## Auto-Discovery

The main project automatically discovers all clients in this directory and:

- Generates Docker Compose services
- Configures Nginx routing
- Sets up database migrations
- Manages environment variables

No manual configuration needed - just add a client folder well configured and it will be automatically integrated!
