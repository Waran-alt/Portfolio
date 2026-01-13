#!/usr/bin/env tsx
/**
 * Client Conflict Checker Script
 * 
 * Checks for available ports, subdomains, and database names to help
 * when adding a new client.
 */

import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';

interface ClientConfig {
  id: string;
  name: string;
  subdomain: string;
  ports: {
    frontend: number;
    backend: number;
  };
  database: {
    name: string;
  };
  enabled?: boolean;
}

const CLIENTS_DIR = resolve(process.cwd(), 'clients');

/**
 * Discover all clients (similar to discover-clients.ts but simpler)
 */
async function getAllClients(): Promise<ClientConfig[]> {
  if (!existsSync(CLIENTS_DIR)) {
    return [];
  }

  const entries = await readdir(CLIENTS_DIR, { withFileTypes: true });
  const clients: ClientConfig[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const configPath = join(CLIENTS_DIR, entry.name, 'client.config.json');
    if (!existsSync(configPath)) continue;

    try {
      const configContent = await readFile(configPath, 'utf-8');
      const config: ClientConfig = JSON.parse(configContent);
      if (config.enabled !== false) {
        clients.push(config);
      }
    } catch (error) {
      // Skip invalid configs
      continue;
    }
  }

  return clients;
}

/**
 * Find next available ports
 */
function findAvailablePorts(
  usedFrontendPorts: Set<number>,
  usedBackendPorts: Set<number>,
  startFrontend: number = 3001,
  startBackend: number = 4001
): { frontend: number; backend: number } {
  let frontendPort = startFrontend;
  let backendPort = startBackend;

  while (usedFrontendPorts.has(frontendPort)) {
    frontendPort++;
  }

  while (usedBackendPorts.has(backendPort)) {
    backendPort++;
  }

  return { frontend: frontendPort, backend: backendPort };
}

/**
 * Main execution
 */
async function main() {
  const clients = await getAllClients();

  if (clients.length === 0) {
    console.log('No clients found. You can use:');
    console.log('  Frontend port: 3001');
    console.log('  Backend port: 4001');
    return;
  }

  // Collect used values
  const usedIds = new Set(clients.map(c => c.id));
  const usedSubdomains = new Set(clients.map(c => c.subdomain));
  const usedFrontendPorts = new Set(clients.map(c => c.ports.frontend));
  const usedBackendPorts = new Set(clients.map(c => c.ports.backend));
  const usedDatabaseNames = new Set(clients.map(c => c.database.name));

  // Find available ports
  const availablePorts = findAvailablePorts(usedFrontendPorts, usedBackendPorts);

  console.log('📊 Current Client Configuration Summary\n');
  console.log(`Total clients: ${clients.length}\n`);

  console.log('Used IDs:');
  Array.from(usedIds).sort().forEach(id => console.log(`  - ${id}`));
  console.log('');

  console.log('Used Subdomains:');
  Array.from(usedSubdomains).sort().forEach(subdomain => console.log(`  - ${subdomain}`));
  console.log('');

  console.log('Used Frontend Ports:');
  Array.from(usedFrontendPorts).sort((a, b) => a - b).forEach(port => {
    const client = clients.find(c => c.ports.frontend === port);
    console.log(`  - ${port} (${client?.id || 'unknown'})`);
  });
  console.log('');

  console.log('Used Backend Ports:');
  Array.from(usedBackendPorts).sort((a, b) => a - b).forEach(port => {
    const client = clients.find(c => c.ports.backend === port);
    console.log(`  - ${port} (${client?.id || 'unknown'})`);
  });
  console.log('');

  console.log('Used Database Names:');
  Array.from(usedDatabaseNames).sort().forEach(dbName => console.log(`  - ${dbName}`));
  console.log('');

  console.log('💡 Recommendations for new client:');
  console.log(`  Frontend port: ${availablePorts.frontend}`);
  console.log(`  Backend port: ${availablePorts.backend}`);
  console.log('');
  console.log('⚠️  Make sure to:');
  console.log('  - Use a unique ID (kebab-case)');
  console.log('  - Use a unique subdomain (kebab-case)');
  console.log('  - Use a unique database name (snake_case)');
}

if (require.main === module) {
  main().catch(console.error);
}