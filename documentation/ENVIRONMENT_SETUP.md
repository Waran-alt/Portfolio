# Environment Setup Guide

## Overview

This project currently uses a **single, comprehensive environment file** (`.env`) that contains all environment variables for the entire application stack. This simplifies configuration management today and ensures consistency across all services.

**Note on future evolution**: The project may adopt per-service environment files (e.g., `.env.frontend`, `.env.backend`, `.env.postgres`) later. When that change happens, templates will be added under `documentation/env-templates/` and the `scripts/setup-env.sh` flow will be updated accordingly. Until then, configure the single `.env` file generated from `documentation/env-templates/env.example`.

**Important**: The frontend communicates with the backend through Nginx reverse proxy, not directly. API calls should go to `/api/*` endpoints which Nginx routes to the backend service.

## Quick Start

1. **Generate environment file** (from `documentation/env-templates/env.example`):
   ```bash
   ./scripts/setup-env.sh
   ```

2. **Start development**:
   ```bash
   docker-compose up
   ```

## API Communication Flow

```
Browser → Nginx (${NGINX_URL}:443) → Frontend (${NGINX_URL}:${FRONTEND_PORT})
Browser → Nginx (${NGINX_URL}:443/api/*) → Backend (${NGINX_URL}:${BACKEND_PORT})
```

### Frontend API Configuration
- **Base URL**: Should point to Nginx proxy (same origin as frontend)
- **Example**: `${NGINX_URL}/api/v1` (not `${NGINX_URL}:${BACKEND_PORT}/api/v1`)
- **Why**: Nginx handles routing `/api/*` requests to the backend service

### Environment Variables
- `NGINX_URL`: Single origin for accessing both frontend and backend through Nginx (e.g., `https://localhost` in dev)
- `NEXT_PUBLIC_API_URL`: Should point to the proxyed API path (e.g., `${NGINX_URL}/api` or `${NGINX_URL}/api/v1`)
- **Do NOT use**: Direct backend URLs with ports in frontend environment
- **Use**: Nginx proxy URLs for all API communication

### AI Assistant Access Policy
- The `.env` file exists locally but is not accessible to AI assistants. Assistants will reference only the example templates under `documentation/env-templates/` and this guide.

## Setup Script Options

The `setup-env.sh` script supports several modes:

### Basic Usage
```bash
./scripts/setup-env.sh              # Create missing .env file only
./scripts/setup-env.sh --force      # Update .env file from template (overwrites)
./scripts/setup-env.sh --light      # Add new vars to existing file (preserves existing)
./scripts/setup-env.sh --dry-run    # Show what would be updated
./scripts/setup-env.sh --help       # Show all options
```

### When to Use Each Option

- **Default**: Use when setting up the project for the first time
- **`--force`**: Use when you've updated environment template and want to completely sync existing `.env` file (overwrites all content)
- **`--light`**: Use when you want to add new variables from template while preserving your existing custom variables
- **`--dry-run`**: Use to preview changes before applying them
- **`--help`**: Shows detailed usage information

### Light Update Mode

The `--light` mode is perfect for incremental updates:

- ✅ **Preserves existing variables**: Your custom values are kept
- ✅ **Adds new variables**: New variables from template are added
- ✅ **Organizes preserved vars**: Custom variables are moved to a "PRESERVED VARIABLES" section
- ✅ **Safe**: Creates backups before making changes

### Workflow for Adding New Environment Variables

1. **Update template**: Add new variables to `documentation/env-templates/env.example`
2. **Update validation**: Add corresponding Zod schemas in service `config/env.ts` files
3. **Preview changes**: `./scripts/setup-env.sh --light --dry-run`
4. **Apply changes**: `./scripts/setup-env.sh --light`
5. **Update values**: Edit the generated `.env` file with your actual values
6. **Test**: Start services to validate configuration

## Environment Variable Aggregation

When you need to combine environment variables with static constants, use **direct imports**:

### Backend Example
```typescript
import { envVar } from './config/env';
import { SERVICE_NAMES } from '@portfolio/shared';

const INTERNAL_URLS = {
  FRONTEND: `http://${SERVICE_NAMES.FRONTEND}:${envVar.frontend.port}`,
  BACKEND: `http://${SERVICE_NAMES.BACKEND}:${envVar.server.port}`,
  POSTGRES: `postgresql://${SERVICE_NAMES.POSTGRES}:${envVar.database.config.port}`,
} as const;
```

### Frontend Example
```typescript
import { envVar } from './config/env';
import { API } from '@portfolio/shared';

export const API_CONFIG = {
  BASE_URL: envVar.api.url,
  ENDPOINTS: {
    PROJECTS: `${envVar.api.url}${API.ENDPOINTS.PROJECTS}`,
    CONTACT: `${envVar.api.url}${API.ENDPOINTS.CONTACT}`,
    HEALTH: `${envVar.api.url}${API.ENDPOINTS.HEALTH}`,
  },
} as const;
```

### Benefits
- ✅ **Simple**: No extra files or complex patterns
- ✅ **Explicit**: Clear where environment variables are used
- ✅ **Type-safe**: Uses validated `envVar` objects
- ✅ **Maintainable**: Easy to understand and modify

## Validation

**Important**: Environment variable validation must be created alongside the variables themselves. When you add new environment variables to the template, you must also update the corresponding Zod validation schemas in each service's `config/env.ts` file.

All environment variables are validated using Zod schemas in each service's `config/env.ts` file. The validated variables are exported as `envVar` objects for type-safe access.

## Security

- Never commit `.env` files to version control
- Use `documentation/env-templates/env.example` for documentation
- Validate all environment variables at startup
- Use a single file today to limit exposure and simplify management; if the project moves to multiple `.env.*` files later, ensure each service validates its own variables.

## Development Workflow

1. **Adding new variables**:
   - Update environment template in `documentation/env-templates/env.example`
   - Add corresponding Zod validation schemas in service `config/env.ts` files
   - Run `./scripts/setup-env.sh --dry-run` to preview changes
   - Run `./scripts/setup-env.sh --force` to apply changes
   - Update your values in the generated `.env` file

2. **Regular development**:
   - Use direct imports for environment variable aggregation
   - Test with `docker-compose up`

3. **Troubleshooting**:
   - Check template file in `documentation/env-templates/env.example`
   - Verify `.env` file exists and has proper values
   - Start services to see validation errors 