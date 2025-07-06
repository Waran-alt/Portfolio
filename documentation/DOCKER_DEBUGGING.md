# Docker Container Debugging Setup

This document explains how to set up Docker container debugging for the Portfolio project using VS Code's attach configurations.

## Overview

The VS Code configuration includes `attach:frontend` and `attach:backend` configurations that can connect to Node.js processes running inside Docker containers. This allows you to debug applications as they run in containers, providing a production-like debugging environment.

## Required Docker Configuration

To enable container debugging, you must expose the Node.js debug ports in your `docker-compose.yml`:

### Backend Service Configuration

```yaml
services:
  backend:
    build: ./apps/backend
    ports:
      - "4000:4000"  # Application port
      - "9229:9229"  # Node.js debug port
    environment:
      - NODE_ENV=development
      - DEBUG_PORT=9229
    command: >
      ts-node-dev 
      --respawn 
      --transpile-only 
      --host 0.0.0.0 
      --inspect=0.0.0.0:9229 
      --inspect-brk 
      src/index.ts
```

### Frontend Service Configuration

```yaml
services:
  frontend:
    build: ./apps/frontend
    ports:
      - "3000:3000"  # Application port
      - "9228:9228"  # Next.js debug port (different from backend)
    environment:
      - NODE_ENV=development
      - DEBUG_PORT=9228
    command: >
      next dev 
      --hostname 0.0.0.0 
      --port 3000 
      --inspect=0.0.0.0:9228
```

## Environment Variables

Configure debug ports in your `.env` file:

```bash
# Debug ports for container debugging
DEBUG_PORT=9229        # Backend debug port
FRONTEND_DEBUG_PORT=9228  # Frontend debug port (Next.js)

# Hostname for container access
HOSTNAME=0.0.0.0       # Allow external access
```

## VS Code Debug Configurations

### Available Attach Configurations

1. **`attach:backend`** - Connect to backend container debugger
   - Port: `${env:DEBUG_PORT:-9229}`
   - Address: `${env:HOSTNAME:-localhost}`

2. **`attach:frontend`** - Connect to frontend container debugger
   - Port: `${env:FRONTEND_DEBUG_PORT:-9228}`
   - Address: `${env:HOSTNAME:-localhost}`

3. **`attach:full-stack`** - Attach to both frontend and backend
   - PreLaunch Task: `dev:full` (starts containers)
   - Attaches to both debuggers simultaneously

4. **`attach:full-stack-with-db`** - Full stack with database
   - PreLaunch Task: `dev:full-with-db` (starts DB + containers)
   - Complete debugging environment

## Usage Workflow

### 1. Start Containers with Debugging

```bash
# Start all services with debug ports exposed
docker-compose up --build

# Or use VS Code task
# Run: "docker:up" task
```

### 2. Attach Debugger

1. Open VS Code Run and Debug panel
2. Select `attach:backend` or `attach:frontend`
3. Click the play button to attach
4. Set breakpoints in your code
5. Debug as normal

### 3. Full Stack Debugging

1. Select `attach:full-stack-with-db`
2. VS Code will automatically:
   - Start database service
   - Start development servers
   - Attach to both debuggers
3. Debug both frontend and backend simultaneously

## Debug Port Configuration

### Default Ports
- **Backend**: 9229 (ts-node-dev)
- **Frontend**: 9228 (Next.js)

### Custom Ports
To avoid conflicts, you can use different ports:

```bash
# .env file
DEBUG_PORT=9230        # Backend debug port
FRONTEND_DEBUG_PORT=9231  # Frontend debug port
```

### Multiple Debug Sessions
You can run multiple debug sessions with different ports:

```bash
# Terminal 1 - Backend
DEBUG_PORT=9229 docker-compose up backend

# Terminal 2 - Frontend  
FRONTEND_DEBUG_PORT=9228 docker-compose up frontend
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change `DEBUG_PORT` in `.env`
   - Kill existing Node.js processes
   - Restart Docker containers

2. **Cannot Connect to Debugger**
   - Verify ports are exposed in `docker-compose.yml`
   - Check firewall settings
   - Ensure containers are running with debug flags

3. **Source Maps Not Working**
   - Verify `sourceMaps: true` in launch configuration
   - Check `outFiles` path matches your build output
   - Ensure TypeScript compilation includes source maps

### Debug Commands

```bash
# Check if debug ports are exposed
docker-compose ps
netstat -tulpn | grep 9229

# View container logs
docker-compose logs backend
docker-compose logs frontend

# Restart with debug
docker-compose down
docker-compose up --build
```

## Benefits

### Production-Like Environment
- Debug in containerized environment
- Test with production-like configuration
- Identify container-specific issues

### Team Collaboration
- Consistent debugging environment
- Easy setup for new team members
- Reproducible debugging scenarios

### Advanced Debugging
- Debug both frontend and backend simultaneously
- Container-specific breakpoints
- Network debugging capabilities

## Security Considerations

### Development Only
- Debug ports should only be exposed in development
- Use `HOSTNAME=localhost` for local-only access
- Never expose debug ports in production

### Network Security
- Debug ports allow code execution
- Restrict access to trusted networks
- Use VPN for remote debugging

## Next Steps

1. Update your `docker-compose.yml` with debug port exposure
2. Configure environment variables in `.env`
3. Test attach configurations with simple breakpoints
4. Set up full stack debugging workflow
5. Document team debugging procedures

This setup provides a powerful debugging environment that closely mirrors production while maintaining the convenience of local development. 