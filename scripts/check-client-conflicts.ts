#!/usr/bin/env tsx
/**
 * Client Validation and Conflict Checker Script
 * 
 * Checks for:
 * - Port/subdomain/database name conflicts
 * - Environment variable validation
 * - Docker configuration validation
 * - Required file structure validation
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
    user?: string;
  };
  enabled?: boolean;
}

interface ValidationIssue {
  clientId: string;
  type: 'conflict' | 'missing_file' | 'env_mismatch' | 'missing_env';
  message: string;
  severity: 'error' | 'warning';
}

const CLIENTS_DIR = resolve(process.cwd(), 'clients');

/**
 * Parse environment variables from a file
 */
function parseEnvFile(content: string): Map<string, string> {
  const vars = new Map<string, string>();
  
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && match[1] && match[2] !== undefined) {
      vars.set(match[1], match[2]);
    }
  }
  
  return vars;
}

/**
 * Validate environment variables for a client
 */
async function validateEnvVars(
  clientPath: string,
  config: ClientConfig
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  
  // Check for .env or .env.example
  const envPath = join(clientPath, '.env');
  const envExamplePath = join(clientPath, '.env.example');
  const envFileExists = existsSync(envPath) || existsSync(envExamplePath);
  const envFilePath = existsSync(envPath) ? envPath : envExamplePath;
  
  if (!envFileExists) {
    issues.push({
      clientId: config.id,
      type: 'missing_env',
      message: 'No .env or .env.example file found',
      severity: 'warning',
    });
    return issues;
  }
  
  try {
    const envContent = await readFile(envFilePath, 'utf-8');
    const envVars = parseEnvFile(envContent);
    
    // Check FRONTEND_PORT
    const frontendPort = envVars.get('FRONTEND_PORT');
    if (!frontendPort) {
      issues.push({
        clientId: config.id,
        type: 'missing_env',
        message: 'FRONTEND_PORT is missing',
        severity: 'error',
      });
    } else {
      const portValue = parseInt(frontendPort, 10);
      if (Number.isNaN(portValue) || portValue !== config.ports.frontend) {
        issues.push({
          clientId: config.id,
          type: 'env_mismatch',
          message: `FRONTEND_PORT mismatch: expected ${config.ports.frontend}, found ${frontendPort}`,
          severity: 'error',
        });
      }
    }
    
    // Check BACKEND_PORT or PORT
    const backendPort = envVars.get('BACKEND_PORT') || envVars.get('PORT');
    if (!backendPort) {
      issues.push({
        clientId: config.id,
        type: 'missing_env',
        message: 'BACKEND_PORT (or PORT) is missing',
        severity: 'error',
      });
    } else {
      const portValue = parseInt(backendPort, 10);
      if (Number.isNaN(portValue) || portValue !== config.ports.backend) {
        issues.push({
          clientId: config.id,
          type: 'env_mismatch',
          message: `BACKEND_PORT mismatch: expected ${config.ports.backend}, found ${backendPort}`,
          severity: 'error',
        });
      }
    }
    
    // Check POSTGRES_DB
    const postgresDb = envVars.get('POSTGRES_DB');
    if (!postgresDb) {
      issues.push({
        clientId: config.id,
        type: 'missing_env',
        message: 'POSTGRES_DB is missing',
        severity: 'error',
      });
    } else if (postgresDb !== config.database.name) {
      issues.push({
        clientId: config.id,
        type: 'env_mismatch',
        message: `POSTGRES_DB mismatch: expected ${config.database.name}, found ${postgresDb}`,
        severity: 'error',
      });
    }
    
    // Check NEXT_PUBLIC_API_URL (should contain backend port)
    const apiUrl = envVars.get('NEXT_PUBLIC_API_URL');
    if (!apiUrl) {
      issues.push({
        clientId: config.id,
        type: 'missing_env',
        message: 'NEXT_PUBLIC_API_URL is missing',
        severity: 'warning',
      });
    } else if (!apiUrl.includes(`:${config.ports.backend}`) && !apiUrl.includes(`/${config.ports.backend}`)) {
      const urlPortMatch = apiUrl.match(/:(\d+)/);
      if (urlPortMatch && urlPortMatch[1]) {
        const portValue = parseInt(urlPortMatch[1], 10);
        if (!Number.isNaN(portValue) && portValue !== config.ports.backend) {
          issues.push({
            clientId: config.id,
            type: 'env_mismatch',
            message: `NEXT_PUBLIC_API_URL port mismatch: expected ${config.ports.backend}`,
            severity: 'warning',
          });
        }
      }
    }
    
  } catch (error) {
    issues.push({
      clientId: config.id,
      type: 'missing_env',
      message: `Error reading env file: ${error instanceof Error ? error.message : String(error)}`,
      severity: 'error',
    });
  }
  
  return issues;
}

/**
 * Validate Docker configuration for a client
 */
async function validateDockerConfig(
  clientPath: string,
  config: ClientConfig
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  
  // Check docker-compose.yml (optional for standalone, but recommended)
  const dockerComposePath = join(clientPath, 'docker-compose.yml');
  if (!existsSync(dockerComposePath)) {
    issues.push({
      clientId: config.id,
      type: 'missing_file',
      message: 'docker-compose.yml not found (recommended for standalone development)',
      severity: 'warning',
    });
  }
  
  // Check frontend/Dockerfile
  const frontendDockerfilePath = join(clientPath, 'frontend', 'Dockerfile');
  if (!existsSync(frontendDockerfilePath)) {
    issues.push({
      clientId: config.id,
      type: 'missing_file',
      message: 'frontend/Dockerfile not found',
      severity: 'error',
    });
  }
  
  // Check backend/Dockerfile
  const backendDockerfilePath = join(clientPath, 'backend', 'Dockerfile');
  if (!existsSync(backendDockerfilePath)) {
    issues.push({
      clientId: config.id,
      type: 'missing_file',
      message: 'backend/Dockerfile not found',
      severity: 'error',
    });
  }
  
  return issues;
}

/**
 * Validate required file structure
 */
async function validateFileStructure(
  clientPath: string,
  config: ClientConfig
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  
  // Check migrations/changelog.xml
  const changelogPath = join(clientPath, 'migrations', 'changelog.xml');
  if (!existsSync(changelogPath)) {
    issues.push({
      clientId: config.id,
      type: 'missing_file',
      message: 'migrations/changelog.xml not found',
      severity: 'error',
    });
  }
  
  // Check frontend/package.json
  const frontendPackageJsonPath = join(clientPath, 'frontend', 'package.json');
  if (!existsSync(frontendPackageJsonPath)) {
    issues.push({
      clientId: config.id,
      type: 'missing_file',
      message: 'frontend/package.json not found',
      severity: 'error',
    });
  }
  
  // Check backend/package.json
  const backendPackageJsonPath = join(clientPath, 'backend', 'package.json');
  if (!existsSync(backendPackageJsonPath)) {
    issues.push({
      clientId: config.id,
      type: 'missing_file',
      message: 'backend/package.json not found',
      severity: 'error',
    });
  }
  
  return issues;
}

/**
 * Discover all clients
 */
async function getAllClients(): Promise<Array<ClientConfig & { path: string }>> {
  if (!existsSync(CLIENTS_DIR)) {
    return [];
  }

  const entries = await readdir(CLIENTS_DIR, { withFileTypes: true });
  const clients: Array<ClientConfig & { path: string }> = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const clientPath = join(CLIENTS_DIR, entry.name);
    const configPath = join(clientPath, 'client.config.json');
    if (!existsSync(configPath)) continue;

    try {
      const configContent = await readFile(configPath, 'utf-8');
      const config: ClientConfig = JSON.parse(configContent);
      if (config.enabled !== false) {
        clients.push({ ...config, path: clientPath });
      }
    } catch (error) {
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

  // Collect used values for conflict checking
  const usedIds = new Set(clients.map(c => c.id));
  const usedSubdomains = new Set(clients.map(c => c.subdomain));
  const usedFrontendPorts = new Set(clients.map(c => c.ports.frontend));
  const usedBackendPorts = new Set(clients.map(c => c.ports.backend));
  const usedDatabaseNames = new Set(clients.map(c => c.database.name));

  // Check for conflicts
  const conflictIssues: ValidationIssue[] = [];
  const idCounts = new Map<string, number>();
  const subdomainCounts = new Map<string, number>();
  const frontendPortCounts = new Map<number, string[]>();
  const backendPortCounts = new Map<number, string[]>();
  const dbNameCounts = new Map<string, string[]>();

  for (const client of clients) {
    idCounts.set(client.id, (idCounts.get(client.id) || 0) + 1);
    subdomainCounts.set(client.subdomain, (subdomainCounts.get(client.subdomain) || 0) + 1);
    
    if (!frontendPortCounts.has(client.ports.frontend)) {
      frontendPortCounts.set(client.ports.frontend, []);
    }
    frontendPortCounts.get(client.ports.frontend)!.push(client.id);
    
    if (!backendPortCounts.has(client.ports.backend)) {
      backendPortCounts.set(client.ports.backend, []);
    }
    backendPortCounts.get(client.ports.backend)!.push(client.id);
    
    if (!dbNameCounts.has(client.database.name)) {
      dbNameCounts.set(client.database.name, []);
    }
    dbNameCounts.get(client.database.name)!.push(client.id);
  }

  // Report conflicts
  for (const [id, count] of idCounts.entries()) {
    if (count > 1) {
      conflictIssues.push({
        clientId: id ?? 'unknown',
        type: 'conflict',
        message: `Duplicate client ID: ${id} (used by ${count} clients)`,
        severity: 'error',
      });
    }
  }

  for (const [subdomain, count] of subdomainCounts.entries()) {
    if (count > 1) {
      conflictIssues.push({
        clientId: subdomain ?? 'unknown',
        type: 'conflict',
        message: `Duplicate subdomain: ${subdomain} (used by ${count} clients)`,
        severity: 'error',
      });
    }
  }

  for (const [port, clientIds] of frontendPortCounts.entries()) {
    if (clientIds.length > 1) {
      conflictIssues.push({
        clientId: clientIds[0] ?? 'unknown',
        type: 'conflict',
        message: `Duplicate frontend port ${port}: used by ${clientIds.join(', ')}`,
        severity: 'error',
      });
    }
  }

  for (const [port, clientIds] of backendPortCounts.entries()) {
    if (clientIds.length > 1) {
      conflictIssues.push({
        clientId: clientIds[0] ?? 'unknown',
        type: 'conflict',
        message: `Duplicate backend port ${port}: used by ${clientIds.join(', ')}`,
        severity: 'error',
      });
    }
  }

  for (const [dbName, clientIds] of dbNameCounts.entries()) {
    if (clientIds.length > 1) {
      conflictIssues.push({
        clientId: clientIds[0] ?? 'unknown',
        type: 'conflict',
        message: `Duplicate database name ${dbName}: used by ${clientIds.join(', ')}`,
        severity: 'error',
      });
    }
  }

  // Validate each client
  const validationIssues: ValidationIssue[] = [];
  for (const client of clients) {
    const envIssues = await validateEnvVars(client.path, client);
    const dockerIssues = await validateDockerConfig(client.path, client);
    const structureIssues = await validateFileStructure(client.path, client);
    
    validationIssues.push(...envIssues, ...dockerIssues, ...structureIssues);
  }

  // Find available ports
  const availablePorts = findAvailablePorts(usedFrontendPorts, usedBackendPorts);

  // Output summary
  console.log('📊 Client Configuration and Validation Summary\n');
  console.log(`Total clients: ${clients.length}\n`);

  // Conflicts section
  if (conflictIssues.length > 0) {
    console.log('❌ CONFLICTS FOUND:\n');
    conflictIssues.forEach(issue => {
      console.log(`  - ${issue.message}`);
    });
    console.log('');
  }

  // Configuration summary
  console.log('📋 Configuration Summary:\n');

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

  // Validation issues
  if (validationIssues.length > 0) {
    console.log('⚠️  VALIDATION ISSUES:\n');
    
    const errors = validationIssues.filter(i => i.severity === 'error');
    const warnings = validationIssues.filter(i => i.severity === 'warning');
    
    if (errors.length > 0) {
      console.log('❌ Errors:\n');
      errors.forEach(issue => {
        console.log(`  [${issue.clientId}] ${issue.message}`);
      });
      console.log('');
    }
    
    if (warnings.length > 0) {
      console.log('⚠️  Warnings:\n');
      warnings.forEach(issue => {
        console.log(`  [${issue.clientId}] ${issue.message}`);
      });
      console.log('');
    }
  } else {
    console.log('✅ No validation issues found\n');
  }

  console.log('💡 Recommendations for new client:');
  console.log(`  Frontend port: ${availablePorts.frontend}`);
  console.log(`  Backend port: ${availablePorts.backend}`);
  console.log('');
  console.log('⚠️  Make sure to:');
  console.log('  - Use a unique ID (kebab-case)');
  console.log('  - Use a unique subdomain (kebab-case)');
  console.log('  - Use a unique database name (snake_case)');
  console.log('  - Configure environment variables correctly');
  console.log('  - Include required Dockerfiles and migrations');
}

if (require.main === module) {
  main().catch(console.error);
}
