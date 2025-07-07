# Docker Debugging Guide

This guide covers debugging applications running in Docker containers using VS Code.

## Overview

The project includes optimized Docker debugging configurations that allow you to:
- Debug applications running inside Docker containers
- Set breakpoints in containerized code
- Hot reload during development
- Multi-container debugging
- Database monitoring capabilities
- Clean, maintainable configuration structure

## Prerequisites

- Docker Desktop running
- VS Code with Docker extension installed
- Containers built and running with debug ports exposed

## Debug Configurations

### Individual Container Debugging

#### Backend Container Debugging
```json
"docker:attach-backend"
```
- **Port**: 9229 (mapped from container)
- **Purpose**: Debug Node.js/Express backend running in Docker
- **Features**: Source maps, hot reload, breakpoint debugging
- **Usage**: Start backend container, then attach debugger

#### Frontend Container Debugging
```json
"docker:attach-frontend"
```
- **Port**: 9228 (mapped from container)
- **Purpose**: Debug Next.js frontend running in Docker
- **Features**: Source maps, hot reload, breakpoint debugging
- **Usage**: Start frontend container, then attach debugger

#### Database Monitoring
```json
"docker:monitor-postgres"
```
- **Port**: 5432 (PostgreSQL)
- **Purpose**: Monitor database connections and queries
- **Features**: Connection monitoring, query tracking
- **Usage**: Monitor database interactions during debugging

### Multi-Container Debugging

#### Full Stack Debugging
```json
"docker:debug-full-stack"
```
- **Components**: Frontend + Backend containers
- **Pre-launch**: Starts all Docker services
- **Features**: Simultaneous debugging of both services
- **Usage**: Debug complete application flow

#### Full Stack with Database
```json
"docker:debug-full-stack-with-db"
```
- **Components**: Frontend + Backend + Database
- **Pre-launch**: Starts all Docker services
- **Features**: Complete stack debugging including database
- **Usage**: End-to-end debugging with data flow

## VS Code Tasks for Docker Debugging

### Container Management Tasks

#### Start Individual Services
- `docker:debug-backend` - Start backend container for debugging
- `docker:debug-frontend` - Start frontend container for debugging

#### Container Interaction
- `docker:exec-backend` - Open shell in backend container
- `docker:exec-frontend` - Open shell in frontend container
- `docker:logs` - Follow container logs

#### Container Management
- `docker:up` - Start all services
- `docker:down` - Stop all services
- `docker:build` - Build all images
- `docker:rebuild` - Rebuild without cache

## Debugging Workflow

### 1. Start Containers
```bash
# Start all services
docker-compose up -d

# Or start individual services
docker-compose up -d backend
docker-compose up -d frontend
```

### 2. Attach Debugger
1. Open VS Code Debug panel (Ctrl+Shift+D)
2. Select appropriate debug configuration:
   - `docker:attach-backend` for backend debugging
   - `docker:attach-frontend` for frontend debugging
   - `docker:debug-full-stack` for multi-container debugging
3. Click "Start Debugging" (F5)

### 3. Set Breakpoints
- Set breakpoints in your source code
- Breakpoints work across container boundaries
- Source maps ensure accurate debugging

### 4. Debug Features
- **Step through code**: F10 (step over), F11 (step into), Shift+F11 (step out)
- **Variable inspection**: Hover over variables or use Debug Console
- **Call stack**: View function call hierarchy
- **Watch expressions**: Monitor specific variables
- **Hot reload**: Code changes trigger automatic reload

## Configuration Details

### Source Map Configuration
```json
{
  "sourceMaps": true,
  "localRoot": "${workspaceFolder}/apps/backend",
  "remoteRoot": "/app",
  "resolveSourceMapLocations": [
    "${workspaceFolder}/**",
    "!**/node_modules/**"
  ]
}
```

### Environment Variables
- All debug configurations load `.env` file
- Container environment variables are preserved
- Debug-specific variables can be overridden

### Timeout and Restart
```json
{
  "restart": true,
  "timeout": 30000
}
```

## Troubleshooting

### Common Issues

#### Debugger Won't Attach
1. **Check container status**: Ensure containers are running
2. **Verify debug ports**: Check port mappings in docker-compose.yml
3. **Check firewall**: Ensure ports 9228, 9229 are accessible
4. **Container logs**: Check for debug port binding errors

#### Source Maps Not Working
1. **Verify source map generation**: Ensure TypeScript/webpack generates source maps
2. **Check localRoot/remoteRoot**: Ensure paths match container structure
3. **Container rebuild**: Rebuild containers after source map changes

#### Breakpoints Not Hit
1. **Check file paths**: Ensure breakpoints are in correct source files
2. **Verify source maps**: Check source map accuracy
3. **Container restart**: Restart containers after code changes

### Debug Commands

#### Check Container Status
```bash
docker-compose ps
docker-compose logs backend
docker-compose logs frontend
```

#### Check Debug Ports
```bash
# Check if debug ports are listening
netstat -an | grep 9228
netstat -an | grep 9229
```

#### Container Shell Access
```bash
# Access backend container
docker-compose exec backend sh

# Access frontend container
docker-compose exec frontend sh
```

#### VS Code Tasks
```bash
# Use VS Code tasks for common operations
# Ctrl+Shift+P -> "Tasks: Run Task" -> Select task:
# - docker:up - Start all services
# - docker:debug-backend - Start backend for debugging
# - docker:debug-frontend - Start frontend for debugging
# - docker:exec-backend - Open shell in backend
# - docker:exec-frontend - Open shell in frontend
```

## Best Practices

### Development Workflow
1. **Use Docker for consistency**: Ensures production-like environment
2. **Leverage hot reload**: Make changes and see immediate results
3. **Debug early and often**: Catch issues before they become problems
4. **Use multi-container debugging**: Understand full application flow

### Performance Optimization
1. **Volume mounts**: Use volume mounts for fast file synchronization
2. **Source maps**: Ensure accurate debugging with proper source maps
3. **Container optimization**: Use multi-stage builds for smaller images
4. **Resource limits**: Set appropriate memory and CPU limits

### Security Considerations
1. **Debug ports**: Only expose debug ports in development
2. **Environment variables**: Use .env files for sensitive data
3. **Container isolation**: Ensure proper network isolation
4. **Access control**: Limit debug access to authorized developers

## Integration with CI/CD

### Development Environment
- Debug configurations work seamlessly with local development
- Hot reload supports rapid iteration
- Source maps ensure accurate debugging

### Production Considerations
- Debug ports should not be exposed in production
- Use proper logging instead of debugging in production
- Implement health checks for container monitoring

## Advanced Features

### Custom Debug Configurations
You can create custom debug configurations for specific scenarios:

```json
{
  "name": "docker:debug-specific-feature",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "address": "localhost",
  "cwd": "${workspaceFolder}/apps/backend",
  "protocol": "inspector",
  "sourceMaps": true,
  "localRoot": "${workspaceFolder}/apps/backend",
  "remoteRoot": "/app",
  "restart": true,
  "timeout": 30000,
  "detail": "Debug specific feature in backend container"
}
```

### Environment-Specific Debugging
Create different debug configurations for different environments:

```json
{
  "name": "docker:debug-staging",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "address": "staging-server",
  "envFile": "${workspaceFolder}/.env.staging"
}
```

## Configuration Optimizations

### Recent Improvements
The VS Code configurations have been optimized for better maintainability:

- **Simplified launch.json**: Removed redundant attach configurations
- **Streamlined tasks.json**: Eliminated duplicate Docker debug tasks
- **Reduced verbosity**: Simplified presentation settings
- **Cleaner structure**: Removed non-existent validation tasks
- **Better organization**: Streamlined compound configurations

### Benefits
- **Reduced complexity**: Fewer configurations to maintain
- **Improved performance**: Faster VS Code startup and configuration loading
- **Better discoverability**: Clearer task and launch configuration names
- **Professional standards**: Clean, maintainable configuration structure

## Conclusion

The optimized Docker debugging setup provides a powerful development environment that:
- Mirrors production conditions
- Enables rapid debugging and iteration
- Supports complex multi-container scenarios
- Integrates seamlessly with VS Code
- Maintains clean, professional configuration standards
