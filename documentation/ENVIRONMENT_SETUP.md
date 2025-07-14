# Environment Setup Guide

## Overview

This project uses a monorepo structure with multiple services, each with its own environment configuration. Environment variables are managed through service-specific `.env` files and validated using Zod schemas.

## Quick Start

1. **Generate environment files**:
   ```bash
   ./scripts/setup-env.sh
   ```



3. **Start development**:
   ```bash
   docker-compose up
   ```

## Setup Script Options

The `setup-env.sh` script supports several modes:

### Basic Usage
```bash
./scripts/setup-env.sh              # Create missing .env files only
./scripts/setup-env.sh --force      # Update all .env files from templates (overwrites)
./scripts/setup-env.sh --light      # Add new vars to existing files (preserves existing)
./scripts/setup-env.sh --dry-run    # Show what would be updated
./scripts/setup-env.sh --help       # Show all options
```

### When to Use Each Option

- **Default**: Use when setting up the project for the first time
- **`--force`**: Use when you've updated environment templates and want to completely sync existing `.env` files (overwrites all content)
- **`--light`**: Use when you want to add new variables from templates while preserving your existing custom variables
- **`--dry-run`**: Use to preview changes before applying them
- **`--help`**: Shows detailed usage information

### Light Update Mode

The `--light` mode is perfect for incremental updates:

- ✅ **Preserves existing variables**: Your custom values are kept
- ✅ **Adds new variables**: New variables from templates are added
- ✅ **Organizes preserved vars**: Custom variables are moved to a "PRESERVED VARIABLES" section
- ✅ **Safe**: Creates backups before making changes

**Example output:**
```
📄 Processing env.backend.example...
✅ Updated .env.backend with new variables from env.backend.example
💡 Added variables: 2
ℹ️  Preserved 3 existing variables in .env.backend
```

### Workflow for Adding New Environment Variables

1. **Update template**: Add new variables to appropriate `.env.*.example` files
2. **Update validation**: Add corresponding Zod schemas in service `config/env.ts` files
3. **Preview changes**: `./scripts/setup-env.sh --light --dry-run`
4. **Apply changes**: `./scripts/setup-env.sh --light`
5. **Update values**: Edit the generated `.env.*` files with your actual values
6. **Test**: Start services to validate configuration

## Environment Variable Aggregation

When you need to combine environment variables with static constants, use **direct imports**:

### Backend Example
```typescript
import { envVar } from './config/env';
import { SERVICE_NAMES, PORTS } from '@portfolio/shared';

// Create internal URLs using direct imports
const INTERNAL_URLS = {
  FRONTEND: `http://${SERVICE_NAMES.FRONTEND}:${envVar.server.port}`,
  BACKEND: `http://${SERVICE_NAMES.BACKEND}:${envVar.server.port}`,
  POSTGRES: `postgresql://${SERVICE_NAMES.POSTGRES}:${PORTS.POSTGRES}`,
} as const;
```

### Frontend Example
```typescript
import { envVar } from './config/env';
import { API } from '@portfolio/shared';

// Create API configuration using direct imports
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

## Environment Files

### Service-Specific Files
- `.env.backend` - Backend service configuration
- `.env.frontend` - Frontend service configuration  
- `.env.postgres` - Database configuration
- `.env.nginx` - Nginx configuration

### Common Variables
- `.env` - Shared across all services

## Validation

**Important**: Environment variable validation must be created alongside the variables themselves. When you add new environment variables to templates, you must also update the corresponding Zod validation schemas in each service's `config/env.ts` file.

All environment variables are validated using Zod schemas in each service's `config/env.ts` file. The validated variables are exported as `envVar` objects for type-safe access.

## Security

- Never commit `.env` files to version control
- Use `.env.*.example` files for documentation
- Validate all environment variables at startup
- Use service-specific files to limit exposure

## Development Workflow

1. **Adding new variables**:
   - Update environment templates in `documentation/env-templates/`
   - Add corresponding Zod validation schemas in service `config/env.ts` files
   - Run `./scripts/setup-env.sh --dry-run` to preview changes
   - Run `./scripts/setup-env.sh --force` to apply changes
   - Update your values in the generated `.env.*` files

2. **Regular development**:
   - Use direct imports for environment variable aggregation
   - Test with `docker-compose up`

3. **Troubleshooting**:
   - Check template files in `documentation/env-templates/`
   - Verify `.env.*` files exist and have proper values
   - Start services to see validation errors 