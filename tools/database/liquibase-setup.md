# Liquibase Setup for Client Migrations

This document explains how to set up and use Liquibase for database migrations in client applications.

## Overview

Liquibase is a database schema migration tool that tracks, versions, and deploys database changes. Each client application has its own Liquibase changelog in `clients/{client-id}/migrations/`.

## Structure

```
clients/
└── client-name/
    └── migrations/
        ├── changelog.xml          # Main changelog file
        └── changesets/            # Individual migration files
            ├── 001-initial-schema.xml
            ├── 002-add-users-table.xml
            └── ...
```

## Installation

Liquibase can be run in several ways:

1. **Docker Container** (Recommended for development)
2. **CLI Tool** (For local development)
3. **Maven/Gradle Plugin** (For Java projects)
4. **Node.js Package** (For JavaScript/TypeScript projects)

For this project, we'll use the Docker container approach for consistency.

## Changelog Structure

### Main Changelog (`changelog.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <!-- Include all changesets -->
    <include file="changesets/001-initial-schema.xml"/>
    <include file="changesets/002-add-users-table.xml"/>
    
</databaseChangeLog>
```

### Changeset Example (`changesets/001-initial-schema.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <changeSet id="001-initial-schema" author="developer">
        <comment>Create initial database schema</comment>
        
        <!-- Enable UUID extension -->
        <sql>
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        </sql>
        
        <!-- Create enum types -->
        <createTable tableName="user_roles">
            <column name="role" type="VARCHAR(50)">
                <constraints primaryKey="true"/>
            </column>
        </createTable>
        
        <insert tableName="user_roles">
            <column name="role" value="admin"/>
        </insert>
        <insert tableName="user_roles">
            <column name="role" value="user"/>
        </insert>
        
        <!-- Create users table -->
        <createTable tableName="users">
            <column name="id" type="UUID">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="email" type="VARCHAR(255)">
                <constraints unique="true" nullable="false"/>
            </column>
            <column name="password_hash" type="VARCHAR(255)">
                <constraints nullable="false"/>
            </column>
            <column name="created_at" type="TIMESTAMP WITH TIME ZONE" defaultValueComputed="CURRENT_TIMESTAMP">
                <constraints nullable="false"/>
            </column>
            <column name="updated_at" type="TIMESTAMP WITH TIME ZONE" defaultValueComputed="CURRENT_TIMESTAMP">
                <constraints nullable="false"/>
            </column>
        </createTable>
        
        <!-- Create indexes -->
        <createIndex indexName="idx_users_email" tableName="users">
            <column name="email"/>
        </createIndex>
    </changeSet>
    
</databaseChangeLog>
```

## Running Migrations

### Using Docker Compose

Add a migration service to `docker-compose.yml`:

```yaml
  client-name-migrations:
    image: liquibase/liquibase:latest
    container_name: portfolio_client_name_migrations
    env_file:
      - .env
    volumes:
      - ./clients/client-name/migrations:/liquibase/changelog
      - ./tools/database/liquibase-drivers:/liquibase/drivers
    command: >
      --changeLogFile=/liquibase/changelog/changelog.xml
      --url=jdbc:postgresql://postgres:5432/client_name_db
      --username=${POSTGRES_USER}
      --password=${POSTGRES_PASSWORD}
      update
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - portfolio_network
```

### Using Script

Create a script `scripts/run-migrations.ts` that:

1. Discovers all clients
2. Runs Liquibase for each client's migrations
3. Tracks migration status

## Best Practices

1. **One change per changeset**: Each changeset should represent a single logical change
2. **Idempotent changes**: Use `IF NOT EXISTS` or Liquibase's built-in checks
3. **Descriptive IDs**: Use meaningful changeSet IDs (e.g., `001-initial-schema`)
4. **Comments**: Always include comments explaining the change
5. **Rollback**: Include rollback instructions when possible
6. **Versioning**: Use semantic versioning or sequential numbering for changesets

## Migration Workflow

1. Create a new changeset file in `clients/{client-id}/migrations/changesets/`
2. Add the changeset to `changelog.xml`
3. Test locally with Docker Compose
4. Commit changes to version control
5. Deploy to staging/production

## Alternative: SQL-based Migrations

If you prefer SQL over XML, Liquibase also supports SQL changelogs:

```xml
<databaseChangeLog>
    <include file="changesets/001-initial-schema.sql"/>
</databaseChangeLog>
```

SQL changeset (`changesets/001-initial-schema.sql`):

```sql
--liquibase formatted sql

--changeset developer:001-initial-schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

--rollback DROP TABLE users; DROP EXTENSION "uuid-ossp";
```

## Resources

- [Liquibase Documentation](https://docs.liquibase.com/)
- [Liquibase PostgreSQL Guide](https://docs.liquibase.com/workflows/liquibase-community/using-liquibase-with-postgresql.html)
- [Liquibase Docker Hub](https://hub.docker.com/r/liquibase/liquibase)

