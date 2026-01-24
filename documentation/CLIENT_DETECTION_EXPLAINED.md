# Client Detection & Integration System Explained

## Overview

The Portfolio monorepo uses an **auto-discovery system** that automatically detects clients in the `clients/` directory and generates all necessary configuration files for Docker, Nginx, and database setup. This allows you to add new clients without manually editing configuration files.

---

## 🔍 How Client Detection Works

### Step 1: Discovery Process

When you run `yarn discover:clients`, the script (`scripts/discover-clients.ts`) performs the following:

1. **Scans the `clients/` directory**
   ```typescript
   // Looks for subdirectories in clients/
   const entries = await readdir(CLIENTS_DIR, { withFileTypes: true });
   ```

2. **Validates each client**
   - Checks for `client.config.json` file
   - Validates required fields: `id`, `subdomain`, `ports`, `database`
   - Skips disabled clients (`enabled: false`)
   - Validates no conflicts (duplicate IDs, subdomains, ports, database names)

3. **Builds client metadata**
   ```typescript
   {
     id: "test-client",
     name: "Test Client",
     subdomain: "test-client",
     ports: { frontend: 3010, backend: 4010 },
     database: { name: "test_client_db" },
     // ... paths to frontend, backend, migrations
   }
   ```

### Step 2: Configuration Generation

The discovery script generates **4 files** in `.generated/`:

#### 1. `docker-compose.clients.yml`
Contains Docker service definitions for each client:
- Frontend service (Next.js)
- Backend service (Express)
- Volume definitions
- Health checks
- Network configuration
- Environment variables

#### 2. `nginx.clients.conf`
Contains Nginx server blocks for each client:
- HTTP → HTTPS redirect
- HTTPS server block with SSL
- Dynamic upstream resolution (using variables + resolver)
- Route proxying (`/api/` → backend, `/` → frontend)
- Static file handling
- WebSocket support

#### 3. `clients.json`
JSON metadata for all discovered clients (useful for tooling)

#### 4. `database-names.txt`
Comma-separated list of database names (for PostgreSQL initialization)

---

## 🐳 How Docker Works in This System

### Docker Compose Architecture

The system uses **Docker Compose** with **multiple compose files**:

```
docker-compose.yml                    # Main Portfolio services
+ .generated/docker-compose.clients.yml  # Auto-generated client services
= Complete stack
```

**Command:**
```bash
docker-compose -f docker-compose.yml -f .generated/docker-compose.clients.yml up
```

### Service Structure

Each client gets **2 Docker services**:

#### Frontend Service
```yaml
test-client-frontend:
  build:
    context: .  # Portfolio root
    dockerfile: clients/test-client/frontend/Dockerfile
  ports:
    - "3010:3010"
  networks:
    - portfolio_network
  depends_on:
    test-client-backend:
      condition: service_healthy
```

#### Backend Service
```yaml
test-client-backend:
  build:
    context: .  # Portfolio root
    dockerfile: clients/test-client/backend/Dockerfile
  ports:
    - "4010:4010"
  networks:
    - portfolio_network
  depends_on:
    postgres:
      condition: service_healthy
```

### Docker Networking

All services are on the **`portfolio_network`** Docker network, which enables:

1. **Service Discovery**: Services can reach each other by name
   - `test-client-frontend` can reach `test-client-backend:4010`
   - Nginx can reach `test-client-frontend:3010`

2. **Internal DNS**: Docker provides DNS resolution
   - `test-client-backend` resolves to the container's IP
   - Works even if containers restart (IP changes)

3. **Isolation**: Services are isolated from the host network
   - Only exposed ports are accessible from outside

### Multi-Stage Dockerfiles

Client Dockerfiles use **multi-stage builds**:

```dockerfile
# Stage 1: Base (Yarn setup)
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Stage 2: Dependencies
FROM base AS deps
COPY clients/test-client/package.json ...
RUN yarn install

# Stage 3: Build
FROM deps AS builder
COPY clients/test-client/frontend ...
RUN yarn build

# Stage 4: Runtime
FROM base AS runner
COPY --from=builder /app/frontend/.next ...
CMD ["node", "server.js"]
```

**Benefits:**
- Smaller final images (only runtime dependencies)
- Faster rebuilds (cached layers)
- Better security (minimal attack surface)

---

## 🌐 How Nginx Integration Works

### Nginx Configuration Flow

1. **Startup Script** (`tools/nginx/startup.sh`)
   ```bash
   # Copies generated client config into nginx
   if [ -f "/app/.generated/nginx.clients.conf" ]; then
     cp /app/.generated/nginx.clients.conf /etc/nginx/conf.d/clients.conf
   fi
   ```

2. **Nginx Main Config** (`tools/nginx/nginx.conf`)
   ```nginx
   http {
     # Includes all .conf files from conf.d/
     include /etc/nginx/conf.d/*.conf;
   }
   ```

3. **Client Config** (`.generated/nginx.clients.conf`)
   - Automatically included via the `include` directive
   - Contains server blocks for each client

### Dynamic Upstream Resolution

**Key Innovation**: Nginx uses **variables + resolver** for dynamic service discovery:

```nginx
server {
    server_name test-client.localhost;
    
    # Docker's internal DNS resolver
    resolver 127.0.0.11 valid=30s;
    
    # Variables for upstream (resolved at request time)
    set $backend_upstream "test-client-backend:4010";
    set $frontend_upstream "test-client-frontend:3010";
    
    location /api/ {
        proxy_pass http://$backend_upstream;  # Resolved dynamically
    }
    
    location / {
        proxy_pass http://$frontend_upstream;  # Resolved dynamically
    }
}
```

**Why This Matters:**
- ✅ Nginx can start **even if client services aren't running**
- ✅ Services can be added/removed without restarting nginx
- ✅ No hardcoded upstream blocks that fail at startup

### Request Flow

```
User Request: https://test-client.localhost/
    ↓
Nginx (Port 443)
    ↓
Matches server_name: test-client.localhost
    ↓
Location / → proxy_pass http://$frontend_upstream
    ↓
Resolves: test-client-frontend:3010 (via Docker DNS)
    ↓
Forwards to: test-client-frontend container
    ↓
Next.js serves the page
```

---

## 🔄 Complete Integration Flow

### Adding a New Client

1. **Create client directory**
   ```bash
   mkdir -p clients/my-client/{frontend,backend}
   ```

2. **Add `client.config.json`**
   ```json
   {
     "id": "my-client",
     "name": "My Client",
     "subdomain": "my-client",
     "ports": { "frontend": 3011, "backend": 4011 },
     "database": { "name": "my_client_db" }
   }
   ```

3. **Run discovery**
   ```bash
   yarn discover:clients
   ```
   - Scans `clients/` directory
   - Validates configuration
   - Generates Docker Compose services
   - Generates Nginx configuration

4. **Start services**
   ```bash
   docker-compose -f docker-compose.yml -f .generated/docker-compose.clients.yml up -d
   ```

5. **Access client**
   - Frontend: `https://my-client.localhost/`
   - Backend API: `https://my-client.localhost/api/...`

### What Happens Behind the Scenes

1. **Docker Compose**:
   - Reads both compose files
   - Creates network: `portfolio_network`
   - Builds client images
   - Starts containers
   - Sets up health checks

2. **Nginx Startup**:
   - Copies `.generated/nginx.clients.conf` → `/etc/nginx/conf.d/clients.conf`
   - Nginx includes it automatically
   - Starts listening on ports 80/443

3. **Service Discovery**:
   - Docker DNS resolves service names
   - Nginx variables resolve at request time
   - Requests route to correct containers

---

## ✅ Validation & Safety

The system includes **automatic validation**:

1. **Conflict Detection**:
   - Duplicate client IDs
   - Duplicate subdomains
   - Duplicate ports
   - Duplicate database names

2. **Configuration Validation**:
   - Required fields present
   - Valid port numbers
   - Valid database names

3. **Health Checks**:
   - Backend must be healthy before frontend starts
   - Frontend must be healthy before nginx routes to it

---

## 🎯 Key Benefits

1. **Zero Manual Configuration**: Add a client, run discovery, done
2. **Type Safety**: TypeScript ensures correct configuration
3. **Conflict Prevention**: Automatic validation prevents errors
4. **Dynamic Routing**: Nginx adapts to running services
5. **Isolated Services**: Each client is independent
6. **Scalable**: Add unlimited clients without complexity

---

## 🔧 Troubleshooting

### Client Not Detected
- Check `client.config.json` exists and is valid JSON
- Verify `enabled: true` (or field not present)
- Check all required fields are present

### 502 Bad Gateway
- Service not running: `docker-compose ps`
- Service unhealthy: Check health check logs
- Nginx config not loaded: Check nginx logs

### Port Conflicts
- Run `yarn discover:clients` to see validation errors
- Check which ports are already used
- Update `client.config.json` with available ports

---

This system makes adding new clients to the Portfolio monorepo as simple as creating a directory and configuration file!
