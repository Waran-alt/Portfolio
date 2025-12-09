#!/usr/bin/env tsx
/**
 * Liquibase Migration Runner
 * 
 * Runs Liquibase migrations for all discovered clients.
 * This script:
 * 1. Discovers all clients
 * 2. Runs Liquibase migrations for each client's database
 * 3. Reports migration status
 */

import { exec } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { discoverClients } from './discover-clients';

const execAsync = promisify(exec);

interface MigrationResult {
  clientId: string;
  success: boolean;
  message: string;
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
  postgresHost: string = 'postgres',
  postgresPort: number = 5432
): Promise<MigrationResult> {
  const changelogPath = join(migrationsPath, 'changelog.xml');

  if (!existsSync(changelogPath)) {
    return {
      clientId,
      success: false,
      message: `No changelog.xml found at ${changelogPath}`,
    };
  }

  const jdbcUrl = `jdbc:postgresql://${postgresHost}:${postgresPort}/${databaseName}`;

  try {
    // Run Liquibase update using Docker
    const { stdout } = await execAsync(
      `docker run --rm \
        --network portfolio_network \
        -v "${process.cwd()}/clients/${clientId}/migrations:/liquibase/changelog" \
        -e LIQUIBASE_COMMAND_URL="${jdbcUrl}" \
        -e LIQUIBASE_COMMAND_USERNAME="${postgresUser}" \
        -e LIQUIBASE_COMMAND_PASSWORD="${postgresPassword}" \
        liquibase/liquibase:latest \
        --changeLogFile=/liquibase/changelog/changelog.xml \
        --url="${jdbcUrl}" \
        --username="${postgresUser}" \
        --password="${postgresPassword}" \
        update`
    );

    return {
      clientId,
      success: true,
      message: stdout || 'Migrations completed successfully',
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return {
      clientId,
      success: false,
      message: errorMessage || 'Migration failed',
    };
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const clientId = args[0]; // Optional: run for specific client only

  // Load environment variables
  const postgresUser = process.env['POSTGRES_USER'] || 'postgres';
  const postgresPassword = process.env['POSTGRES_PASSWORD'];
  const postgresHost = process.env['POSTGRES_HOST'] || 'postgres';
  const postgresPort = parseInt(process.env['POSTGRES_PORT'] || '5432', 10);

  if (!postgresPassword) {
    console.error('Error: POSTGRES_PASSWORD environment variable is required');
    process.exit(1);
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

  console.log(`Running migrations for ${clientsToMigrate.length} client(s)...\n`);

  const results: MigrationResult[] = [];

  for (const client of clientsToMigrate) {
    console.log(`Migrating ${client.name} (${client.id})...`);
    const result = await runClientMigrations(
      client.id,
      client.database.name,
      client.migrationsPath,
      postgresUser,
      postgresPassword,
      postgresHost,
      postgresPort
    );
    results.push(result);

    if (result.success) {
      console.log(`✓ ${client.name}: ${result.message}\n`);
    } else {
      console.error(`✗ ${client.name}: ${result.message}\n`);
    }
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n=== Migration Summary ===');
  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { runClientMigrations };

