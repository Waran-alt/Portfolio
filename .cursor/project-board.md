# Portfolio Project Board

## To Do

- [002] Monorepo Tooling Selection
  - due: 2025-07-02
  - tags: [setup, tooling, architecture]
  - priority: high
    ```md
    Research and select appropriate monorepo tooling for the Portfolio project.
    **DECISION NEEDED**: Choose between:
    - Yarn Workspaces + Changesets (recommended in guide)
    - Nx (full monorepo toolkit with build optimization)
    - Turborepo (fast build system)
    - Lerna (traditional monorepo management)
    
    Evaluate based on: build optimization, dependency management, versioning needs,and development workflow. Document decision rationale.
    ```

- [003] Initialize Monorepo Structure
  - due: 2025-07-02
  - tags: [setup, tooling, architecture]
  - priority: high
    ```md
    Set up the basic monorepo structure with proper workspace configuration.
    Create packages directory, configure package.json workspaces, and establish
    build scripts for the monorepo tooling selected in previous task.
    
    Target structure: apps/frontend, apps/backend, packages/shared, packages/types,
    packages/config, tools/docker, tools/database.
    ```

- [004] Environment Variable Strategy Decision
  - due: 2025-07-02
  - tags: [docker, environment, security]
  - priority: high
    ```md
    **DECISION NEEDED**: Choose environment variable strategy for Docker Compose.
    Current: Explicit mapping with defaults (${VAR:-default})
    
    Options:
    1. Keep current (explicit, secure, verbose)
    2. Use env_file directive (automatic, less explicit)  
    3. Hybrid approach (critical vars explicit, convenience vars from file)
    4. External secrets (production-grade, complex)
    
    Consider development ease vs production security. Document choice rationale.
    ```

- [008] Migrate Existing Frontend to packages/frontend
  - due: 2025-07-02
  - tags: [frontend, migration, refactoring]
  - priority: medium
    ```md
    Move the existing frontend code from the current structure into the new
    packages/frontend directory. Update import paths, build configurations,
    and ensure all functionality works within the monorepo structure.
    
    Update Docker configurations to reflect new paths.
    ```

- [005] Fix Backend Package.json Issues
  - due: 2025-07-02
  - tags: [backend, dependencies, cleanup]
  - priority: high
    ```md
    Critical fixes needed for backend/package.json:
    - Move all @types/* to devDependencies (security/size issue)
    - Remove Jest, implement Mocha testing framework
    - Update Node.js version requirement to >=22.0.0
    - Remove Joi validation library (keep only Zod)
    - Add missing fields: private: true, repository, homepage
    - Remove redundant nodemon dependency (ts-node-dev includes this)
    ```

- [006] Fix Frontend Package.json Issues
  - due: 2025-07-02
  - tags: [frontend, dependencies, cleanup]
  - priority: high
    ```md
    Critical fixes needed for frontend/package.json:
    - Move @types/* to devDependencies
    - Upgrade Next.js from 14 to 15
    - Update Node.js version requirement to >=22.0.0
    - Add missing fields: private: true, repository, homepage
    - Update React and related packages to latest compatible versions
    ```

- [001] Implement Commit Message Validation (Husky + Commitlint)
  - due: 2025-07-03
  - tags: [tooling, git, automation, code-quality]
  - priority: medium
    ```md
    Explore and implement automated commit message validation using Husky and Commitlint.
    
    **Objectives:**
    - Install and configure Husky for Git hooks management
    - Set up Commitlint with conventional commit format validation
    - Create pre-commit hooks for linting and type checking
    - Configure commit-msg hook for message format validation
    - Document commit message conventions for the team
    
    **Conventional Commit Format:**
    - feat: new features
    - fix: bug fixes  
    - docs: documentation changes
    - style: formatting changes
    - refactor: code refactoring
    - test: adding tests
    - chore: maintenance tasks
    
    **Benefits:**
    - Consistent commit history for portfolio demonstration
    - Automated changelog generation
    - Better code review process
    - Professional development workflow
    ```

- [009] Set up Core Dev Tools (ESLint, Prettier at root)
  - due: 2025-07-03
  - tags: [tooling, code-quality, standards]
  - priority: medium
    ```md
    Configure ESLint and Prettier at the monorepo root level to ensure
    consistent code formatting and linting across all packages. Set up
    shared configurations that can be extended by individual packages.
    
    Include TypeScript strict mode configuration.
    ```

- [013] Define Initial Cursor Rules
  - due: 2025-07-02
  - tags: [tooling, ai-assistance, documentation]
  - priority: low
    ```md
    Create comprehensive Cursor rules to provide AI context about the
    monorepo structure, coding standards, and project conventions.
    Include rules for different file types and project areas.
    
    Cover: package.json standards, TypeScript config, Docker conventions,
    testing patterns, and documentation requirements.
    ```

- [007] Bun Integration Decision (Frontend Only)
  - due: 2025-07-03
  - tags: [frontend, tooling, performance]
  - priority: medium
    ```md
    **DECISION NEEDED**: Evaluate Bun adoption for frontend development.
    
    Pros: Faster installation/bundling, native TypeScript, npm compatibility
    Cons: Newer ecosystem, potential compatibility issues, team learning curve
    
    Decision points:
    - Development only vs production use
    - Docker image complexity increase
    - Migration effort from npm/yarn
    - Long-term maintenance implications
    ```

- [010] Production Environment Strategy Documentation
  - due: 2025-07-04
  - tags: [documentation, production, strategy]
  - priority: medium
    ```md
    Document current Docker setup limitations for production and create
    migration strategy. Critical gaps identified:
    - Secret management (no Docker secrets)
    - Centralized logging (logs in local volumes)
    - Database backups (no automation)
    - SSL certificate management (self-signed only)
    - Health monitoring (basic checks only)
    
    Create staged migration plan for production readiness.
    ```

- [011] Database Migration System Implementation
  - due: 2025-07-05
  - tags: [database, migration, devops]
  - priority: medium
    ```md
    Replace basic init scripts with proper database migration system.
    Current: Only ./database/init scripts for initialization
    Needed: Schema versioning, rollback capability, deployment consistency
    
    Consider tools: Flyway, Liquibase, TypeORM migrations, or custom solution.
    Implement migration runner in Docker Compose.
    ```

- [012] Docker Secret Management Implementation
  - due: 2025-07-06
  - tags: [security, docker, production]
  - priority: medium
    ```md
    Implement proper secret management for production deployment.
    Current: Plain text environment variables (security risk)
    
    **DECISION NEEDED**: Choose approach:
    - Docker Secrets (for Swarm mode)
    - External vault integration (HashiCorp Vault, AWS Secrets Manager)
    - File-based secrets with proper permissions
    
    Implement for JWT_SECRET, database passwords, API keys.
    ```

- [014] Automated Backup System Setup
  - due: 2025-07-07
  - tags: [database, backup, reliability]
  - priority: low
    ```md
    Implement automated PostgreSQL backup system with retention policy.
    Current: No backup automation (data loss risk)
    
    Requirements:
    - Daily automated backups
    - 7-day retention policy
    - Point-in-time recovery capability
    - Backup validation and testing procedures
    ```

- [015] SSL Certificate Automation (Let's Encrypt)
  - due: 2025-07-08
  - tags: [security, ssl, automation]
  - priority: low
    ```md
    Replace self-signed certificates with Let's Encrypt automation.
    Current: Self-signed certificates (browser warnings)
    
    Implement:
    - Automatic certificate issuance
    - Auto-renewal with cron/systemd
    - Certificate monitoring and alerting
    - DNS validation for wildcard certificates if needed
    ```

- [016] Centralized Logging Implementation
  - due: 2025-07-09
  - tags: [monitoring, logging, observability]
  - priority: low
    ```md
    Implement centralized logging system for production readiness.
    Current: Logs only in local Docker volumes
    
    **DECISION NEEDED**: Choose logging solution:
    - ELK Stack (Elasticsearch, Logstash, Kibana)
    - Grafana Loki (modern, efficient)
    - Cloud solutions (CloudWatch, Azure Monitor)
    
    Requirements: log aggregation, searchability, alerting, retention policy.
    ```

## In Progress

- [017] WSL2 Development Environment Setup
  - due: 2025-07-02
  - tags: [environment, wsl2, development, tooling]
  - priority: high
    ```md
    **DECISION MADE**: Switched to WSL2 development environment.
    
    **WSL2 Advantages:**
    - Familiar Linux environment (2 years experience)
    - Better compatibility with many dev tools
    - Consistent with Linux production environments
    - Native Git performance
    - Better Docker integration within Linux context
    
    **WSL2 Considerations:**
    - Cross-filesystem performance (keep code in WSL filesystem)
    - Docker Desktop configuration for WSL2 backend
    - VS Code/Cursor Remote-WSL extension setup
    - Port forwarding and network access
    
    **Action Items:**
    - ✅ Configure Git safe directories for cross-filesystem access
    - Configure Docker Desktop WSL2 backend integration
    - Set up development scripts for WSL2 environment
    - Update development environment documentation
    - Configure optimal WSL2 performance settings
    ```

## Done

