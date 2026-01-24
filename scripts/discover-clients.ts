#!/usr/bin/env tsx
/**
 * Client Discovery Script
 * 
 * Discovers all clients in the clients/ directory and generates:
 * - Client metadata
 * - Docker Compose service definitions
 * - Nginx configuration
 * - Database migration configuration
 */

import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';

interface ClientConfig {
  id: string;
  name: string;
  description?: string;
  subdomain: string;
  domain?: string;
  ports: {
    frontend: number;
    backend: number;
  };
  database: {
    name: string;
    user?: string;
  };
  enabled?: boolean;
  metadata?: {
    created?: string;
    version?: string;
  };
}

interface DiscoveredClient extends ClientConfig {
  path: string;
  configPath: string;
  frontendPath: string;
  backendPath: string;
  migrationsPath: string;
}

const CLIENTS_DIR = resolve(process.cwd(), 'clients');
const OUTPUT_DIR = resolve(process.cwd(), '.generated');

/**
 * Discover all clients in the clients directory
 */
async function discoverClients(): Promise<DiscoveredClient[]> {
  if (!existsSync(CLIENTS_DIR)) {
    console.warn(`Clients directory not found: ${CLIENTS_DIR}`);
    return [];
  }

  const entries = await readdir(CLIENTS_DIR, { withFileTypes: true });
  const clients: DiscoveredClient[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const clientPath = join(CLIENTS_DIR, entry.name);
    const configPath = join(clientPath, 'client.config.json');

    // Check if client.config.json exists
    if (!existsSync(configPath)) {
      console.warn(`Skipping ${entry.name}: client.config.json not found`);
      continue;
    }

    try {
      const configContent = await readFile(configPath, 'utf-8');
      const config: ClientConfig = JSON.parse(configContent);

      // Skip disabled clients
      if (config.enabled === false) {
        console.log(`Skipping ${entry.name}: disabled`);
        continue;
      }

      // Validate required fields
      if (!config.id || !config.subdomain || !config.ports || !config.database) {
        console.warn(`Skipping ${entry.name}: invalid configuration`);
        continue;
      }

      const discovered: DiscoveredClient = {
        ...config,
        path: clientPath,
        configPath,
        frontendPath: join(clientPath, 'frontend'),
        backendPath: join(clientPath, 'backend'),
        migrationsPath: join(clientPath, 'migrations'),
      };

      clients.push(discovered);
    } catch (error) {
      console.error(`Error reading config for ${entry.name}:`, error);
      continue;
    }
  }

  return clients;
}

/**
 * Validate clients for conflicts (duplicate IDs, subdomains, ports, database names)
 */
function validateClients(clients: DiscoveredClient[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const ids = new Map<string, string>(); // id -> client path
  const subdomains = new Map<string, string>(); // subdomain -> client path
  const frontendPorts = new Map<number, string>(); // port -> client path
  const backendPorts = new Map<number, string>(); // port -> client path
  const databaseNames = new Map<string, string>(); // db name -> client path

  for (const client of clients) {
    // Check for duplicate IDs
    if (ids.has(client.id)) {
      errors.push(`Duplicate client ID "${client.id}": ${ids.get(client.id)} and ${client.path}`);
    } else {
      ids.set(client.id, client.path);
    }

    // Check for duplicate subdomains
    if (subdomains.has(client.subdomain)) {
      errors.push(`Duplicate subdomain "${client.subdomain}": ${subdomains.get(client.subdomain)} and ${client.path}`);
    } else {
      subdomains.set(client.subdomain, client.path);
    }

    // Check for duplicate frontend ports
    if (frontendPorts.has(client.ports.frontend)) {
      errors.push(`Duplicate frontend port ${client.ports.frontend}: ${frontendPorts.get(client.ports.frontend)} and ${client.path}`);
    } else {
      frontendPorts.set(client.ports.frontend, client.path);
    }

    // Check for duplicate backend ports
    if (backendPorts.has(client.ports.backend)) {
      errors.push(`Duplicate backend port ${client.ports.backend}: ${backendPorts.get(client.ports.backend)} and ${client.path}`);
    } else {
      backendPorts.set(client.ports.backend, client.path);
    }

    // Check for duplicate database names
    if (databaseNames.has(client.database.name)) {
      errors.push(`Duplicate database name "${client.database.name}": ${databaseNames.get(client.database.name)} and ${client.path}`);
    } else {
      databaseNames.set(client.database.name, client.path);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate Docker Compose service definitions for clients
 */
function generateDockerComposeServices(clients: DiscoveredClient[]): { services: string; volumes: string } {
  const services: string[] = [];

  for (const client of clients) {
    const serviceName = `${client.id}-frontend`;
    const backendServiceName = `${client.id}-backend`;

    // Frontend service
    services.push(`
  # ============================================================================
  # CLIENT: ${client.name.toUpperCase()} - FRONTEND
  # ============================================================================
  ${serviceName}:
    build:
      context: .
      dockerfile: clients/${client.id}/frontend/Dockerfile
      target: development
    container_name: portfolio_${client.id}_frontend_dev
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./clients/${client.id}/frontend:/app/clients/${client.id}/frontend
      - ./packages/shared:/app/packages/shared
      - /app/clients/${client.id}/frontend/.next
    ports:
      - "${client.ports.frontend}:${client.ports.frontend}"
    depends_on:
      ${backendServiceName}:
        condition: service_healthy
    networks:
      - portfolio_network
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=1
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://127.0.0.1:${client.ports.frontend} || exit 1"]
      interval: \${HEALTH_CHECK_INTERVAL:-30s}
      timeout: \${HEALTH_CHECK_TIMEOUT:-10s}
      retries: \${HEALTH_CHECK_RETRIES:-3}
      start_period: 60s
    labels:
      - "com.portfolio.service=${serviceName}"
      - "com.portfolio.client=${client.id}"
      - "com.portfolio.environment=development"

  # ============================================================================
  # CLIENT: ${client.name.toUpperCase()} - BACKEND
  # ============================================================================
  ${backendServiceName}:
    build:
      context: .
      dockerfile: clients/${client.id}/backend/Dockerfile
      target: development
    container_name: portfolio_${client.id}_backend_dev
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./clients/${client.id}/backend:/app/clients/${client.id}/backend
      - ./packages/shared:/app/packages/shared
      - /app/clients/${client.id}/backend/dist
      - ${client.id}_backend_logs:/app/clients/${client.id}/backend/logs
    ports:
      - "${client.ports.backend}:${client.ports.backend}"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - portfolio_network
    command: yarn dev
    environment:
      - NODE_ENV=development
    healthcheck:
      test: ["CMD-SHELL", "sh -c 'curl -f http://127.0.0.1:${client.ports.backend}/api/health || exit 1'"]
      interval: \${HEALTH_CHECK_INTERVAL:-30s}
      timeout: \${HEALTH_CHECK_TIMEOUT:-10s}
      retries: \${HEALTH_CHECK_RETRIES:-3}
    labels:
      - "com.portfolio.service=${backendServiceName}"
      - "com.portfolio.client=${client.id}"
      - "com.portfolio.environment=development"
`);
  }

  // Generate volumes section
  const volumes: string[] = [];
  for (const client of clients) {
    volumes.push(`  ${client.id}_backend_logs:
    driver: local
    labels:
      - "com.portfolio.client=${client.id}"
      - "com.portfolio.environment=development"`);
  }

  return {
    services: services.join('\n'),
    volumes: volumes.length > 0 ? `\n  # Client volumes\n${volumes.join('\n')}` : '',
  };
}

/**
 * Generate Nginx configuration for clients
 */
function generateNginxConfig(clients: DiscoveredClient[], baseDomain: string = 'localhost'): { upstreams: string; serverBlocks: string } {
  const upstreams: string[] = [];
  const serverBlocks: string[] = [];

  for (const client of clients) {
    const domain = client.domain || baseDomain;
    const serverName = `${client.subdomain}.${domain}`;

    // Server block with dynamic upstream resolution
    serverBlocks.push(`
# ============================================================================
# CLIENT: ${client.name} (${client.id})
# ============================================================================
# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name ${serverName};
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ${serverName};

    # DNS resolver for dynamic service discovery
    # Docker's internal DNS (127.0.0.11) allows resolving service names
    resolver 127.0.0.11 valid=30s;

    # Upstream variables for dynamic resolution
    # Using variables with resolver allows nginx to start even if services don't exist yet
    set $backend_upstream "${client.id}-backend:${client.ports.backend}";
    set $frontend_upstream "${client.id}-frontend:${client.ports.frontend}";

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/nginx-selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx-selfsigned.key;
    ssl_dhparam /etc/nginx/ssl/dhparam.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers on;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }

    # API routes
    # Using variable in proxy_pass with resolver enables dynamic upstream resolution
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://$backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # WebSocket support for Next.js HMR
    location /_next/webpack-hmr {
        proxy_pass http://$frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /_next/static/ {
        proxy_pass http://$frontend_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend routes
    location / {
        limit_req zone=web burst=50 nodelay;
        proxy_pass http://$frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}`);
  }

  return {
    upstreams: upstreams.join('\n'),
    serverBlocks: serverBlocks.join('\n'),
  };
}

/**
 * Generate database names list for PostgreSQL initialization
 */
function generateDatabaseNames(clients: DiscoveredClient[]): string {
  return clients.map(client => client.database.name).join(',');
}

/**
 * Main execution
 */
async function main() {
  console.log('Discovering clients...');
  const clients = await discoverClients();

  if (clients.length === 0) {
    console.log('No clients found.');
    return;
  }

  // Validate for conflicts
  const validation = validateClients(clients);
  if (!validation.valid) {
    console.error('\n❌ Validation errors found:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nPlease fix these conflicts before continuing.');
    process.exit(1);
  }

  console.log(`Found ${clients.length} client(s):`);
  clients.forEach(client => {
    console.log(`  - ${client.name} (${client.id}) at ${client.subdomain}.${client.domain || 'yourdomain.com'}`);
  });

  // Generate outputs
  const dockerCompose = generateDockerComposeServices(clients);
  const nginxConfig = generateNginxConfig(clients);
  const databaseNames = generateDatabaseNames(clients);

  // Write to .generated directory
  const { mkdir, writeFile } = await import('fs/promises');
  await mkdir(OUTPUT_DIR, { recursive: true });

  await writeFile(
    join(OUTPUT_DIR, 'docker-compose.clients.yml'),
    `# Auto-generated client services
# DO NOT EDIT MANUALLY - This file is generated by scripts/discover-clients.ts
# To regenerate, run: yarn discover:clients

${dockerCompose.services}

# ============================================================================
# CLIENT VOLUMES
# ============================================================================
${dockerCompose.volumes}
`,
    'utf-8'
  );

  await writeFile(
    join(OUTPUT_DIR, 'nginx.clients.conf'),
    `# Auto-generated client Nginx configuration
# DO NOT EDIT MANUALLY - This file is generated by scripts/discover-clients.ts
# To regenerate, run: yarn discover:clients

# ============================================================================
# CLIENT UPSTREAMS
# ============================================================================
${nginxConfig.upstreams}

# ============================================================================
# CLIENT SERVER BLOCKS
# ============================================================================
${nginxConfig.serverBlocks}
`,
    'utf-8'
  );

  await writeFile(
    join(OUTPUT_DIR, 'clients.json'),
    JSON.stringify(clients, null, 2),
    'utf-8'
  );

  await writeFile(
    join(OUTPUT_DIR, 'database-names.txt'),
    databaseNames,
    'utf-8'
  );

  console.log('\nGenerated files:');
  console.log(`  - ${join(OUTPUT_DIR, 'docker-compose.clients.yml')}`);
  console.log(`  - ${join(OUTPUT_DIR, 'nginx.clients.conf')}`);
  console.log(`  - ${join(OUTPUT_DIR, 'clients.json')}`);
  console.log(`  - ${join(OUTPUT_DIR, 'database-names.txt')}`);
  console.log(`\nDatabase names: ${databaseNames}`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { discoverClients, generateDatabaseNames, generateDockerComposeServices, generateNginxConfig };
export type { ClientConfig, DiscoveredClient };

