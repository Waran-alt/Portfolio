# Multi-Client & Multi-Domain Hosting Guide

## 📋 Overview

This guide explains how to host multiple client applications under your domain (`owndom.com`), each with its own subdomain, backend API, and database.

**Architecture Pattern:**
- **Main Portfolio**: `owndom.com`
- **Client Applications**: `client-name.owndom.com`
- **Each Client**: Own frontend, backend, and database

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        NGINX REVERSE PROXY                  │
│                   (Port 80/443)                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  owndom.com                   → portfolio_frontend:3000     │
│  owndom.com/api/*             → portfolio_backend:4000      │
│                                                             │
│  client-1.owndom.com          → client-1_frontend:3001      │
│  client-1.owndom.com/api/*    → client-1_backend:4001       │
│                                                             │
│  client-2.owndom.com          → client-2_frontend:3002      │
│  client-2.owndom.com/api/*    → client-2_backend:4002       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
      ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
      │   Portfolio  │  │   Client 1   │  │  Portfolio   │
      │   Frontend   │  │   Frontend   │  │    Backend   │
      │   :3000      │  │   :3001      │  │    :4000     │
      └──────────────┘  └──────┬───────┘  └───────┬──────┘
                               ▼                  ▼
                        ┌──────────────┐  ┌──────────────┐
                        │  Client 1    │  │  Portfolio   │
                        │    Backend   │  │  PostgreSQL  │
                        │    :4001     │  │    :5432     │
                        └──────┬───────┘  └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Client 1    │
                        │  PostgreSQL  │
                        │    :5432     │
                        └──────────────┘
```

### Key Principles

1. **Each client has complete independence**
   - Own frontend application
   - Own backend API
   - Own database

2. **Shared infrastructure**
   - Single PostgreSQL instance (multiple databases)
   - Single Nginx reverse proxy
   - Shared Docker Compose setup

3. **Clear separation**
   - Nested folder structure per client
   - Separate environment variables
   - Independent deployment capability

## 📦 Recommended Directory Structure

### Portfolio Structure (Existing)

```
Portfolio/
├── apps/
│   ├── frontend/              # Portfolio frontend
│   └── backend/               # Portfolio backend
│
├── packages/
│   └── shared/                # Portfolio utilities
│
└── tools/
    └── database/
        └── portfolio/         # Portfolio DB init
```

### Client Structure (Recommended: Nested)

```
Portfolio/
├── apps/
│   ├── frontend/              # Portfolio (main)
│   ├── backend/               # Portfolio API
│   │
│   ├── client-1/              # Client 1 application folder
│   │   ├── frontend/         # Client 1 frontend
│   │   ├── backend/          # Client 1 backend
│   │   └── shared/           # Optional: Client-specific shared code
│   │
│   └── client-2/              # Client 2 application folder
│       ├── frontend/         # Client 2 frontend
│       └── backend/          # Client 2 backend
│
├── packages/
│   ├── shared/                # Portfolio utilities
│   └── [shared-packages]/    # Shared components (e.g., flashcards)
│
└── tools/
    └── database/
        ├── portfolio/         # Portfolio DB init
        └── clients/
            ├── client-1/      # Client 1 DB init
            └── client-2/      # Client 2 DB init
```

**Why Nested Structure?**
- ✅ Client is a cohesive unit (frontend + backend together)
- ✅ All client code in one place
- ✅ Can have client-specific shared code/docs
- ✅ Better organization for complex clients
- ✅ Clear ownership

## 🗄️ Database Architecture

### Recommended: One PostgreSQL Instance, Multiple Databases

```
┌─────────────────────────────────────────────────┐
│        PostgreSQL Container (Port 5432)         │
├─────────────────────────────────────────────────┤
│                                                 │
│  portfolio_db          (Portfolio)              │
│  client_1_db           (Client 1)               │
│  client_2_db           (Client 2)               │
│  client_3_db           (Client 3)               │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Complete data isolation per client
- ✅ Easy to backup/restore individual clients
- ✅ Easy to migrate clients to separate servers later
- ✅ Low overhead (~10-20MB per database)
- ✅ Simple management (one PostgreSQL instance)

### Database Initialization Example

Create a multi-database initialization script:

**File**: `tools/database/init-multiple-databases.sh`

```bash
#!/bin/bash
set -e

POSTGRES_USER="${POSTGRES_USER:-postgres}"

if [ -z "$POSTGRES_MULTIPLE_DATABASES" ]; then
    echo "Warning: POSTGRES_MULTIPLE_DATABASES not set. Skipping multi-database initialization."
    exit 0
fi

echo "Starting multi-database initialization..."

create_database() {
    local db_name=$1
    echo "Creating database: $db_name"
    
    DB_EXISTS=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'")
    
    if [ "$DB_EXISTS" = "1" ]; then
        echo "Database $db_name already exists, skipping..."
    else
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
            CREATE DATABASE $db_name;
            GRANT ALL PRIVILEGES ON DATABASE $db_name TO $POSTGRES_USER;
            COMMENT ON DATABASE $db_name IS 'Created by multi-database initialization script';
EOSQL
        echo "Database $db_name created successfully."
    fi
}

IFS=',' read -ra DATABASES <<< "$POSTGRES_MULTIPLE_DATABASES"

for db in "${DATABASES[@]}"; do
    db=$(echo "$db" | xargs)
    if [ -z "$db" ]; then
        continue
    fi
    if [[ ! "$db" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
        echo "Warning: Invalid database name '$db'. Skipping..."
        continue
    fi
    create_database "$db"
done

echo "Multi-database initialization completed!"
```

## 🐳 Docker Compose Configuration Example

### PostgreSQL Service

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: portfolio_postgres
    restart: unless-stopped
    env_file:
      - .env
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_MULTIPLE_DATABASES: |
        portfolio_db,
        client_1_db,
        client_2_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
      # Portfolio database initialization
      - ./tools/database/portfolio/init:/docker-entrypoint-initdb.d/00-portfolio:ro
      # Client databases initialization
      - ./tools/database/clients/client-1/init:/docker-entrypoint-initdb.d/01-client-1:ro
      - ./tools/database/clients/client-2/init:/docker-entrypoint-initdb.d/02-client-2:ro
      # Multi-database initialization script
      - ./tools/database/init-multiple-databases.sh:/docker-entrypoint-initdb.d/99-init-multiple-databases.sh:ro
    networks:
      - portfolio_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Client Frontend Service

```yaml
  client-1-frontend:
    build:
      context: .
      dockerfile: apps/client-1/frontend/Dockerfile
      target: development
    container_name: portfolio_client_1_frontend_dev
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./apps/client-1/frontend:/app/apps/client-1/frontend
      - ./packages/shared:/app/packages/shared
      - /app/apps/client-1/frontend/.next
    ports:
      - "${CLIENT_1_FRONTEND_PORT:-3001}:${CLIENT_1_FRONTEND_PORT:-3001}"
    depends_on:
      client-1-backend:
        condition: service_healthy
    networks:
      - portfolio_network
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=1
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://127.0.0.1:${CLIENT_1_FRONTEND_PORT:-3001} || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

### Client Backend Service

```yaml
  client-1-backend:
    build:
      context: .
      dockerfile: apps/client-1/backend/Dockerfile
      target: development
    container_name: portfolio_client_1_backend_dev
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./apps/client-1/backend:/app/apps/client-1/backend
      - ./packages/shared:/app/packages/shared
      - backend_logs:/app/apps/client-1/backend/logs
    ports:
      - "${CLIENT_1_BACKEND_PORT:-4001}:${CLIENT_1_BACKEND_PORT:-4001}"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - portfolio_network
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/client_1_db
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://127.0.0.1:${CLIENT_1_BACKEND_PORT:-4001}/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🌐 Nginx Configuration Example

### Production Configuration (`tools/nginx/prod.conf`)

```nginx
# Client 1: HTTP redirect
server {
    listen 80;
    listen [::]:80;
    server_name client-1.owndom.com;
    return 301 https://$host$request_uri;
}

# Client 1: HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name client-1.owndom.com;

    # SSL configuration (use wildcard cert for all subdomains)
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_dhparam /etc/nginx/ssl/dhparam.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:...';
    ssl_prefer_server_ciphers on;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API routes - proxy to client backend
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        
        proxy_pass http://client-1-backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Static assets
    location /_next/static/ {
        proxy_pass http://client-1-frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # All other routes to client frontend
    location / {
        limit_req zone=web burst=20 nodelay;
        
        proxy_pass http://client-1-frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}

# Repeat for client-2, client-3, etc.
```

### Upstream Definitions

Add upstream servers for each client:

```nginx
upstream client-1-frontend {
    server client-1-frontend:${CLIENT_1_FRONTEND_PORT:-3001} max_fails=3 fail_timeout=30s;
    keepalive 32;
}

upstream client-1-backend {
    server client-1-backend:${CLIENT_1_BACKEND_PORT:-4001} max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

## 📝 Environment Variables Example

### Environment Template (`documentation/env-templates/env.example`)

```bash
# =============================================================================
# CLIENT-1 CONFIGURATION
# =============================================================================
CLIENT_1_FRONTEND_PORT=3001
CLIENT_1_BACKEND_PORT=4001
CLIENT_1_DB_NAME=client_1_db
CLIENT_1_URL=https://client-1.owndom.com
CLIENT_1_API_URL=${CLIENT_1_URL}/api/v1

# =============================================================================
# CLIENT-2 CONFIGURATION
# =============================================================================
CLIENT_2_FRONTEND_PORT=3002
CLIENT_2_BACKEND_PORT=4002
CLIENT_2_DB_NAME=client_2_db
CLIENT_2_URL=https://client-2.owndom.com
CLIENT_2_API_URL=${CLIENT_2_URL}/api/v1

# =============================================================================
# MULTI-DATABASE CONFIGURATION
# =============================================================================
POSTGRES_MULTIPLE_DATABASES=portfolio_db,client_1_db,client_2_db
```

## 🚀 Adding a New Client: Step-by-Step

### Step 1: Create Directory Structure

```bash
# Create application directories
mkdir -p apps/client-name/frontend
mkdir -p apps/client-name/backend
mkdir -p tools/database/clients/client-name/init

# Optional: Client-specific shared code
mkdir -p apps/client-name/shared
```

### Step 2: Initialize Applications

**Frontend (Next.js example):**
```bash
cd apps/client-name/frontend
# Initialize Next.js or your preferred framework
```

**Backend (Express.js example):**
```bash
cd apps/client-name/backend
# Initialize Express.js or your preferred framework
```

### Step 3: Create Database Schema

Create initialization script: `tools/database/clients/client-name/init/01-init.sql`

```sql
-- Client Name Database Initialization Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create your tables here
CREATE TABLE example_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- your columns
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Step 4: Add Environment Variables

Add to `.env` and `documentation/env-templates/env.example`:

```bash
CLIENT_NAME_FRONTEND_PORT=3001
CLIENT_NAME_BACKEND_PORT=4001
CLIENT_NAME_DB_NAME=client_name_db
CLIENT_NAME_URL=https://client-name.owndom.com
CLIENT_NAME_API_URL=${CLIENT_NAME_URL}/api/v1
```

Update `POSTGRES_MULTIPLE_DATABASES`:
```bash
POSTGRES_MULTIPLE_DATABASES=portfolio_db,client_1_db,client_name_db
```

### Step 5: Update Docker Compose

Add services to `docker-compose.yml` and `docker-compose.prod.yml`:

```yaml
  # Client Name Frontend
  client-name-frontend:
    build:
      context: .
      dockerfile: apps/client-name/frontend/Dockerfile
      target: development
    container_name: portfolio_client_name_frontend_dev
    env_file:
      - .env
    volumes:
      - ./apps/client-name/frontend:/app/apps/client-name/frontend
    ports:
      - "${CLIENT_NAME_FRONTEND_PORT:-3001}:${CLIENT_NAME_FRONTEND_PORT:-3001}"
    networks:
      - portfolio_network
    # ... (full config similar to examples above)

  # Client Name Backend
  client-name-backend:
    build:
      context: .
      dockerfile: apps/client-name/backend/Dockerfile
      target: development
    container_name: portfolio_client_name_backend_dev
    env_file:
      - .env
    volumes:
      - ./apps/client-name/backend:/app/apps/client-name/backend
    ports:
      - "${CLIENT_NAME_BACKEND_PORT:-4001}:${CLIENT_NAME_BACKEND_PORT:-4001}"
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${CLIENT_NAME_DB_NAME}
    networks:
      - portfolio_network
    depends_on:
      postgres:
        condition: service_healthy
    # ... (full config similar to examples above)
```

### Step 6: Update Nginx Configuration

Add to `tools/nginx/prod.conf`:

1. Add upstream definitions
2. Add HTTP redirect server block
3. Add HTTPS server block with routing

See Nginx Configuration section above for template.

### Step 7: Configure DNS

Add DNS records:
```
Type    Name                Value
A       client-name         <your-server-ip>
```

### Step 8: Set Up SSL Certificate

**Option A: Wildcard Certificate** (Recommended)
- Certificate for `*.owndom.com`
- Covers all subdomains automatically

**Option B: Separate Certificate**
- Individual certificate for each subdomain

### Step 9: Update Database Initialization

Ensure database name is in `POSTGRES_MULTIPLE_DATABASES` and volume mount is added:

```yaml
volumes:
  - ./tools/database/clients/client-name/init:/docker-entrypoint-initdb.d/XX-client-name:ro
```

### Step 10: Test and Deploy

```bash
# Test locally
docker-compose up client-name-frontend client-name-backend postgres nginx

# Verify database connection
docker-compose exec client-name-backend sh
# Test database connection from within container

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 Naming Conventions

### Services and Containers
- **Frontend service**: `client-name-frontend`
- **Backend service**: `client-name-backend`
- **Container names**: `portfolio_client_name_frontend_dev`, `portfolio_client_name_backend_dev`

### Databases
- **Database name**: `client_name_db` (snake_case)
- **Schema files**: `tools/database/clients/client-name/init/`

### Ports
- **Frontend ports**: Sequential (3001, 3002, 3003...)
- **Backend ports**: Sequential (4001, 4002, 4003...)

### Domains
- **Subdomain**: `client-name.owndom.com` (kebab-case)

### Environment Variables
- **Prefix**: `CLIENT_NAME_` (uppercase with underscores)
- **Example**: `CLIENT_NAME_FRONTEND_PORT`, `CLIENT_NAME_DB_NAME`

## 🔒 Security Considerations

### Database Isolation
- Each backend connects only to its own database
- No cross-database access by default
- Use separate database users for enhanced security (optional)

### CORS Configuration
Each backend should explicitly allow only its own frontend:

```typescript
const corsOptions = {
  origin: [
    'https://client-name.owndom.com',
  ],
  credentials: true,
};
```

### SSL/TLS
- Use wildcard certificate (`*.owndom.com`) for easier management
- Enable HSTS with `includeSubDomains`
- Use modern TLS protocols (1.2+)

### Rate Limiting
- Separate rate limit zones per client in Nginx
- Monitor and adjust based on usage
- Protect API endpoints with appropriate limits

## 📊 Scaling Considerations

### When to Scale PostgreSQL

**Single Instance (Recommended for 5-20 clients):**
- All databases in one PostgreSQL instance
- Easy management and backup
- Low overhead

**Multiple Instances (For 20+ clients or special requirements):**
- Separate PostgreSQL instances for portfolio vs clients
- Different PostgreSQL versions per client
- Regulatory/compliance requirements

### Resource Management

**Memory Usage:**
- PostgreSQL shared_buffers: Shared across all databases
- Each database: ~10-20MB overhead
- Configure: `shared_buffers = 256MB` for 5-10 databases

**Connection Pooling:**
- Each backend maintains its own connection pool
- Total connections = Sum of all backend pools
- Configure: `max_connections = 200` (adjust based on clients)

## ❓ Frequently Asked Questions (AI generated)

### Q: Can I use the same database for multiple clients?

**A:** Technically yes, but not recommended. Use separate databases for:
- Complete data isolation
- Easy backup/restore per client
- Easy migration to separate servers
- Clear security boundaries

### Q: What if a client needs a different tech stack?

**A:** That's fine! Each client can use different frameworks. Just ensure:
- Dockerfile builds correctly
- Container exposes correct ports
- Health checks work

### Q: How many clients can I host?

**A:** Depends on resources:
- **5-20 clients**: Single PostgreSQL instance works well
- **20-50 clients**: Still manageable, monitor resources
- **50+ clients**: Consider organizing into separate instances

### Q: Can clients share code/utilities?

**A:** Yes! Create shared packages:
```
packages/
├── shared/          # Portfolio utilities
└── flashcards/      # Shared component (example)
```

Then import in client apps:
```typescript
import { FlashcardDeck } from '@portfolio/flashcards';
```

### Q: How do I deploy a single client without affecting others?

**A:** 
```bash
# Deploy only client-1 services
docker-compose up -d client-1-frontend client-1-backend

# Restart specific service
docker-compose restart client-1-backend
```

### Q: What about development workflow?

**A:** Start only what you need:
```bash
# Work on portfolio
docker-compose up frontend backend postgres nginx

# Work on client-1
docker-compose up client-1-frontend client-1-backend postgres nginx

# Work on everything
docker-compose up
```

## ✅ Quick Checklist for New Client

- [ ] Create directory structure (`apps/client-name/frontend/`, `apps/client-name/backend/`)
- [ ] Initialize frontend and backend applications
- [ ] Create database initialization scripts
- [ ] Add environment variables to `.env` and template
- [ ] Update `POSTGRES_MULTIPLE_DATABASES` environment variable
- [ ] Add services to `docker-compose.yml` and `docker-compose.prod.yml`
- [ ] Update Nginx configuration (upstreams and server blocks)
- [ ] Configure DNS records
- [ ] Set up SSL certificate (wildcard recommended)
- [ ] Test database connection
- [ ] Test frontend and backend services
- [ ] Deploy and verify

## 📚 Related Documentation

- **`SETUP_GUIDE.md`** - Initial project setup
- **`DOCKER_README.md`** - Docker deployment details
- **`ENVIRONMENT_SETUP.md`** - Environment variable management
- **`PROJECT_ARCHITECTURE.md`** - Overall project architecture

---

**Ready to add your first client?** Follow the step-by-step guide above, and you'll have a new client application running in no time! 🚀

