#!/usr/bin/env tsx
/**
 * Generate Client Setup Documentation Script
 * 
 * Generates SETUP.md files for all clients based on client.config.json
 * Includes environment variable instructions and setup guide
 * Used by integrate-clients.sh
 */

import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { discoverClients, type DiscoveredClient } from './discover-clients';

function hasMigrations(config: DiscoveredClient): boolean {
  return existsSync(join(config.migrationsPath, 'changelog.xml'));
}

/**
 * Generate SETUP.md content with environment variable instructions
 * @param config - Client configuration from discoverClients
 * @param baseDomain - Base domain for the client
 * @returns SETUP.md content as string
 */
function generateSetupMd(config: DiscoveredClient, baseDomain: string): string {
  const fullUrl = `https://${config.subdomain}.${baseDomain}`;
  const dbUser = config.database.user || 'postgres';

  const blankStr = "".padStart(String(config.id).length, ' ');
  const tiretStr = "".padStart(String(config.id).length, '-');
  
  return `# ${config.name} - Setup Guide

Quick setup guide for ${config.name} application.

## Configuration

- **Client ID**: \`${config.id}\`
- **Subdomain**: \`${config.subdomain}\`
- **Full URL**: \`${fullUrl}\`
- **Frontend Port**: \`${config.ports.frontend}\`
- **Backend Port**: \`${config.ports.backend}\`
- **Database**: \`${config.database.name}\`

## Environment Setup

Create a \`.env\` file in the client root directory with the following variables:

\`\`\`bash
# =============================================================================
# APPLICATION
# =============================================================================
NODE_ENV=development

# =============================================================================
# FRONTEND
# =============================================================================
FRONTEND_PORT=${config.ports.frontend}
NEXT_PUBLIC_API_URL=http://localhost:${config.ports.backend}

# =============================================================================
# BACKEND
# =============================================================================
BACKEND_PORT=${config.ports.backend}

# =============================================================================
# DATABASE
# =============================================================================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=${config.database.name}
POSTGRES_USER=${dbUser}
POSTGRES_PASSWORD=postgres

# =============================================================================
# DATABASE CONNECTION (for Liquibase, optional)
# =============================================================================
# DATABASE_URL=jdbc:postgresql://localhost:5432/${config.database.name}
\`\`\`

**Important Notes:**
- Update \`POSTGRES_PASSWORD\` with a secure password
- Configure client-specific variables (JWT, CORS, LOG_LEVEL, etc.) as needed for your application
- Ports must match the values in \`client.config.json\` (${config.ports.frontend}/${config.ports.backend})

## Development

### Standalone Development

\`\`\`bash
# Start database
docker-compose up -d postgres

# Run migrations
yarn migrate:up

# Start backend
cd backend && yarn dev

# Start frontend (in another terminal)
cd frontend && yarn dev
\`\`\`

### Integrated with Portfolio

When integrated with the Portfolio monorepo, run these **from the Portfolio root**:

1. **Integrate** (first time or after adding/updating clients):
   \`\`\`bash
   yarn integrate
   \`\`\`

2. **Run migrations** (if the client has a database):
   \`\`\`bash
   yarn migrate:clients
   \`\`\`

3. **Start all services**:
   \`\`\`bash
   yarn start
   \`\`\`

### Managing Docker When Working from Client Folder

When you work inside this client directory (e.g. \`clients/${config.id}/\`) but the stack runs from the Portfolio root:

| Task                                        | From ${config.id} folder                                     ${blankStr}${blankStr}| From Portfolio root                                                ${blankStr}|
|---------------------------------------------|-------------------------------------------------------------${tiretStr}${tiretStr}|--------------------------------------------------------------------${tiretStr}|
| **Rebuild** (after Dockerfile/deps changes) | \`../../scripts/rebuild-client.sh\` (auto-detects client)     ${blankStr}${blankStr}| \`yarn clients:rebuild ${config.id}\`                                            |
| **Rebuild + restart**                       | \`../../scripts/rebuild-client.sh --restart\`                 ${blankStr}${blankStr}| \`yarn clients:rebuild ${config.id} -- --restart\`                               |
| **Restart** (no rebuild)                    | \`../../scripts/docker-stack.sh restart ${config.id}-backend ${config.id}-frontend\`  | \`./scripts/docker-stack.sh restart ${config.id}-backend ${config.id}-frontend\`  |
| **Logs**                                    | \`../../scripts/docker-stack.sh logs -f ${config.id}-frontend\`           ${blankStr}| \`./scripts/docker-stack.sh logs -f ${config.id}-frontend\`                      |

**Note:** Source code changes use hot reload via volume mounts—no rebuild. Rebuild only when changing \`Dockerfile\`, \`package.json\` dependencies, or other build-time config.

## Access

- **Frontend**: http://localhost:${config.ports.frontend}
- **Backend API**: http://localhost:${config.ports.backend}
- **Production URL**: ${fullUrl}
${hasMigrations(config) ? `

### Database (pgAdmin) when integrated with Portfolio

1. From Portfolio root, run \`yarn start:pgadmin\`.
2. Open http://localhost:5050 and log in (\`PGADMIN_EMAIL\` / \`PGADMIN_PASSWORD\` from root \`.env\`).
3. **Register server**: Right-click **Servers** → **Register** → **Server**
   - **General** → Name: e.g. \`Portfolio\`
   - **Connection** → Host: \`postgres\`, Port: \`5432\`, Username/Password: from root \`.env\` (\`POSTGRES_USER\`, \`POSTGRES_PASSWORD\`)
4. **Find database**: Expand **Servers** → your server → **Databases** → \`${config.database.name}\` → **Schemas** → **public** → **Tables**
` : ''}

## Notes

- Ports are configured in \`client.config.json\`
- Database name is \`${config.database.name}\`
- This file was auto-generated - update as needed for your setup
`;
}

/**
 * Generate setup documentation for all clients
 * @returns Result object with success status and any errors
 */
export async function generateClientSetup(): Promise<{ 
  success: boolean; 
  errors: string[];
  results: Array<{ clientId: string; status: 'created' | 'updated' | 'error' }>;
}> {
  const errors: string[] = [];
  const results: Array<{ clientId: string; status: 'created' | 'updated' | 'error' }> = [];
  
  // Read BASE_DOMAIN at call time, not definition time
  const baseDomain = process.env['BASE_DOMAIN'] || 'yourdomain.com';
  
  try {
    const clients = await discoverClients();
    
    if (clients.length === 0) {
      return { success: true, errors: [], results: [] };
    }
    
    console.log(`Generating setup documentation for ${clients.length} client(s)...\n`);
    
    for (const client of clients) {
      try {
        console.log(`Generating SETUP.md for ${client.name} (${client.id})...`);
        
        // Generate SETUP.md
        const setupMdPath = join(client.path, 'SETUP.md');
        const setupMdContent = generateSetupMd(client, baseDomain);
        await writeFile(setupMdPath, setupMdContent, 'utf-8');
        
        console.log(`✓ ${client.name}: Generated SETUP.md`);
        
        results.push({
          clientId: client.id,
          status: 'updated',
        });
        
      } catch (error) {
        const errorMsg = `Failed to generate SETUP.md for ${client.id}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`✗ ${client.name}: ${errorMsg}`);
        errors.push(errorMsg);
        results.push({
          clientId: client.id,
          status: 'error',
        });
      }
    }
    
    console.log(`\n=== Generation Summary ===`);
    console.log(`Total clients: ${clients.length}`);
    console.log(`Generated: ${results.filter(r => r.status !== 'error').length} client(s)`);
    if (errors.length > 0) {
      console.log(`Failed: ${errors.length} client(s)`);
      const failedClients = results.filter(r => r.status === 'error').map(r => r.clientId);
      console.log(`  Failed clients: ${failedClients.join(', ')}`);
    }
    
    return {
      success: errors.length === 0,
      errors,
      results,
    };
  } catch (error) {
    const errorMsg = `Failed to discover clients: ${error instanceof Error ? error.message : String(error)}`;
    return {
      success: false,
      errors: [errorMsg],
      results: [],
    };
  }
}

/**
 * Main execution (for direct usage)
 */
async function main() {
  const result = await generateClientSetup();
  
  if (result.success) {
    console.log('\n✅ Setup documentation generation complete');
  } else {
    console.error('\n❌ Errors occurred:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
