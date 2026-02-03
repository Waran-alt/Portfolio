#!/usr/bin/env tsx
/**
 * Liquibase Migration Runner
 *
 * Runs Liquibase migrations for all discovered clients.
 * This script:
 * 1. Loads environment from project root .env
 * 2. Discovers all clients
 * 3. Runs Liquibase migrations for each client's database
 * 4. Reports migration status
 */

import { exec } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { promisify } from 'util';
import { discoverClients } from './discover-clients';

const execAsync = promisify(exec);

/**
 * Load .env file into process.env
 * @param envPath - Path to .env file
 * @param override - If true, override existing vars; if false, only add new ones
 */
function loadEnv(
  envPath: string,
  override = false
): { path: string; loaded: boolean; error?: string } {
  const resolvedPath = resolve(envPath);
  if (!existsSync(resolvedPath)) {
    return { path: resolvedPath, loaded: false, error: 'File does not exist' };
  }
  try {
    const content = readFileSync(resolvedPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex).trim();
          const value = trimmed.slice(eqIndex + 1).trim();
          const unquoted = value.replace(/^["']|["']$/g, '');
          if (override || !(key in process.env)) {
            process.env[key] = unquoted;
          }
        }
      }
    }
    return { path: resolvedPath, loaded: true };
  } catch (err) {
    return {
      path: resolvedPath,
      loaded: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

type MigrationStatus = 'success' | 'failed' | 'skipped';

interface MigrationResult {
  clientId: string;
  status: MigrationStatus;
  message: string;
}

function hasMigrations(migrationsPath: string): boolean {
  return existsSync(join(migrationsPath, 'changelog.xml'));
}

const DOCKER_NETWORK_BASE = 'portfolio_network';

// Liquibase 5.x with PostgreSQL driver (custom image via tools/liquibase/Dockerfile)
const LIQUIBASE_IMAGE = 'portfolio-liquibase-postgresql:5';
const LIQUIBASE_DOCKERFILE = join(process.cwd(), 'tools', 'liquibase', 'Dockerfile');

async function ensureLiquibaseImage(): Promise<void> {
  try {
    await execAsync(`docker image inspect ${LIQUIBASE_IMAGE}`);
  } catch {
    console.log(`Building Liquibase 5.x image with PostgreSQL driver...`);
    try {
      await execAsync(
        `docker build -t ${LIQUIBASE_IMAGE} -f ${LIQUIBASE_DOCKERFILE} ${join(process.cwd(), 'tools', 'liquibase')}`
      );
      console.log('✓ Liquibase image ready');
    } catch (err) {
      console.error('');
      console.error('Failed to build Liquibase image. Build manually:');
      console.error(`  docker build -t ${LIQUIBASE_IMAGE} tools/liquibase`);
      console.error('');
      process.exit(1);
    }
  }
}

/**
 * Resolve the actual Docker network name.
 * Docker Compose prefixes with project name (e.g. portfolio_portfolio_network).
 */
async function resolveDockerNetwork(): Promise<string> {
  const candidates = [
    DOCKER_NETWORK_BASE,
    `portfolio_${DOCKER_NETWORK_BASE}`,
  ];
  for (const name of candidates) {
    try {
      await execAsync(`docker network inspect ${name}`);
      return name;
    } catch {
      // try next
    }
  }
  return DOCKER_NETWORK_BASE; // fallback for error message
}

async function ensureDockerNetwork(
  clientIds: string[]
): Promise<string> {
  const networkName = await resolveDockerNetwork();
  try {
    await execAsync(`docker network inspect ${networkName}`);
    return networkName;
  } catch {
    console.error('');
    console.error(`Error: Docker network "${DOCKER_NETWORK_BASE}" not found.`);
    if (clientIds.length > 0) {
      console.error(`  Required for client(s): ${clientIds.join(', ')}`);
    }
    console.error('');
    console.error(
      'Migrations need to reach PostgreSQL. Start the Portfolio stack first:'
    );
    console.error('');
    console.error('  docker compose -f docker-compose.yml up -d postgres');
    console.error('');
    console.error('  # Or with client configs:');
    console.error(
      '  docker compose -f docker-compose.yml -f .generated/docker-compose.clients.yml up -d postgres'
    );
    console.error('');
    process.exit(1);
  }
}

/**
 * Ensure database exists; create it if not (client DBs are not auto-created by init)
 */
async function ensureDatabaseExists(
  databaseName: string,
  postgresUser: string,
  postgresPassword: string,
  networkName: string,
  postgresHost: string,
  postgresPort: number
): Promise<void> {
  try {
    await execAsync(
      `docker run --rm \
        --network ${networkName} \
        -e PGPASSWORD="${postgresPassword}" \
        postgres:17-alpine \
        psql -h ${postgresHost} -p ${postgresPort} -U ${postgresUser} -d postgres -c "CREATE DATABASE ${databaseName};"`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('already exists')) return;
    throw err;
  }
}

/**
 * Run Liquibase migrations for a single client
 */
async function runClientMigrations(
  clientId: string,
  databaseName: string,
  migrationsPath: string,
  postgresUser: string,
  postgresPassword: string,
  networkName: string,
  postgresHost: string = 'postgres',
  postgresPort: number = 5432
): Promise<MigrationResult> {
  const changelogPath = join(migrationsPath, 'changelog.xml');

  if (!existsSync(changelogPath)) {
    return {
      clientId,
      status: 'skipped',
      message: 'No changelog.xml (client does not use Liquibase migrations)',
    };
  }

  const jdbcUrl = `jdbc:postgresql://${postgresHost}:${postgresPort}/${databaseName}`;

  const migrationsHostPath = resolve(
    process.cwd(),
    'clients',
    clientId,
    'migrations'
  );

  try {
    // Run Liquibase update using Docker
    // Use -w to set working dir; changelog.xml is relative to it (Liquibase 5 search path)
    const { stdout } = await execAsync(
      `docker run --rm \
        --network ${networkName} \
        -w /liquibase/changelog \
        -v "${migrationsHostPath}:/liquibase/changelog:ro" \
        -e LIQUIBASE_COMMAND_URL="${jdbcUrl}" \
        -e LIQUIBASE_COMMAND_USERNAME="${postgresUser}" \
        -e LIQUIBASE_COMMAND_PASSWORD="${postgresPassword}" \
        ${LIQUIBASE_IMAGE} \
        --changelog-file=changelog.xml \
        --url="${jdbcUrl}" \
        --username="${postgresUser}" \
        --password="${postgresPassword}" \
        update`
    );

    return {
      clientId,
      status: 'success',
      message: stdout || 'Migrations completed successfully',
    };
  } catch (error) {
    const err = error as { message?: string; stderr?: string; stdout?: string };
    const stderr = err.stderr?.trim();
    const stdout = err.stdout?.trim();
    const baseMessage = err.message || 'Migration failed';
    const details = [stderr, stdout].filter(Boolean).join('\n') || baseMessage;
    return {
      clientId,
      status: 'failed',
      message: details,
    };
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const clientId = args[0]; // Optional: run for specific client only

  // Load root .env first (baseline)
  const rootEnvPath = join(process.cwd(), '.env');
  const envResult = loadEnv(rootEnvPath);
  if (envResult.loaded) {
    console.log(`Loaded .env from: ${envResult.path}`);
  } else if (envResult.error) {
    console.warn(
      `Warning: Could not load .env (${envResult.path}): ${envResult.error}`
    );
  }

  console.log('Discovering clients...');
  const clients = await discoverClients();

  if (clients.length === 0) {
    console.log('No clients found.');
    return;
  }

  // Filter to specific client if provided
  const clientsToMigrate = clientId
    ? clients.filter(c => c.id === clientId)
    : clients;

  if (clientId && clientsToMigrate.length === 0) {
    console.error(`Client "${clientId}" not found.`);
    process.exit(1);
  }

  // Filter to clients that have migrations (need PostgreSQL)
  const clientsWithMigrations = clientsToMigrate.filter(c =>
    hasMigrations(c.migrationsPath)
  );
  const clientsWithoutMigrations = clientsToMigrate.filter(
    c => !hasMigrations(c.migrationsPath)
  );

  const postgresPort = parseInt(process.env['POSTGRES_PORT'] || '5432', 10);

  if (clientsWithoutMigrations.length > 0) {
    console.log(
      `Skipping ${clientsWithoutMigrations.length} client(s) without migrations: ${clientsWithoutMigrations.map(c => c.id).join(', ')}`
    );
  }

  if (clientsWithMigrations.length === 0) {
    console.log('No clients with Liquibase migrations. Nothing to run.');
    return;
  }

  const networkName = await ensureDockerNetwork(
    clientsWithMigrations.map(c => c.id)
  );

  await ensureLiquibaseImage();

  console.log(
    `Running migrations for ${clientsWithMigrations.length} client(s)...\n`
  );

  const results: MigrationResult[] = [];

  for (const client of clientsWithMigrations) {
    // Load client .env first, then root .env (migrations use Portfolio postgres = root credentials)
    const clientEnvPath = join(process.cwd(), 'clients', client.id, '.env');
    loadEnv(clientEnvPath, true);
    loadEnv(join(process.cwd(), '.env'), true);

    const postgresUser =
      process.env['MIGRATION_POSTGRES_USER'] ||
      process.env['POSTGRES_USER'] ||
      'postgres';
    const postgresPassword =
      process.env['MIGRATION_POSTGRES_PASSWORD'] ||
      process.env['POSTGRES_PASSWORD'];

    if (!postgresPassword) {
      console.error(`✗ ${client.name} (${client.id}): POSTGRES_PASSWORD required`);
      console.error(
        `  Add to clients/${client.id}/.env or root .env\n`
      );
      results.push({
        clientId: client.id,
        status: 'failed',
        message: 'POSTGRES_PASSWORD required in client .env',
      });
      continue;
    }

    try {
      await ensureDatabaseExists(
        client.database.name,
        postgresUser,
        postgresPassword,
        networkName,
        'postgres',
        postgresPort
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${client.name} (${client.id}): Failed to create database: ${msg}\n`);
      results.push({
        clientId: client.id,
        status: 'failed',
        message: `Database creation failed: ${msg}`,
      });
      continue;
    }

    console.log(`Migrating ${client.name} (${client.id})...`);
    const result = await runClientMigrations(
      client.id,
      client.database.name,
      client.migrationsPath,
      postgresUser,
      postgresPassword,
      networkName,
      'postgres', // Portfolio postgres service name
      postgresPort
    );
    results.push(result);

    if (result.status === 'success') {
      console.log(`✓ ${client.name}: ${result.message}\n`);
    } else if (result.status === 'skipped') {
      console.log(`○ ${client.name}: ${result.message}\n`);
    } else {
      console.error(`✗ ${client.name} (${client.id}) FAILED:`);
      console.error(`  ${result.message.replace(/\n/g, '\n  ')}`);
      if (result.message.includes('authentication failed')) {
        console.error('');
        console.error(
          '  Hint: If POSTGRES_USER in .env differs from the DB superuser, set:'
        );
        console.error('    MIGRATION_POSTGRES_USER=postgres');
        console.error('    MIGRATION_POSTGRES_PASSWORD=<your-postgres-password>');
      }
      console.error('');
    }
  }

  // Add skipped clients to results for summary
  for (const client of clientsWithoutMigrations) {
    results.push({
      clientId: client.id,
      status: 'skipped',
      message: 'No changelog.xml (client does not use Liquibase migrations)',
    });
  }

  // Summary
  const successful = results.filter(r => r.status === 'success').length;
  const failedResults = results.filter(r => r.status === 'failed');
  const skipped = results.filter(r => r.status === 'skipped').length;

  console.log('\n=== Migration Summary ===');
  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful}`);
  if (skipped > 0) {
    console.log(`Skipped (no migrations): ${skipped}`);
  }
  console.log(`Failed: ${failedResults.length}`);
  if (failedResults.length > 0) {
    console.error(`\nFailed client(s): ${failedResults.map(r => r.clientId).join(', ')}`);
  }

  if (failedResults.length > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { runClientMigrations };

