#!/bin/bash
# Client Integration Script
#
# This script integrates auto-generated client configurations into:
# - Docker Compose (merges .generated/docker-compose.clients.yml)
# - Nginx (includes .generated/nginx.clients.conf)
# - Environment variables (updates POSTGRES_MULTIPLE_DATABASES)
#
# Usage: ./scripts/integrate-clients.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GENERATED_DIR="$PROJECT_ROOT/.generated"

echo "🔍 Discovering clients and generating configurations..."

# Run discovery script
cd "$PROJECT_ROOT"
yarn discover:clients

if [ ! -f "$GENERATED_DIR/clients.json" ]; then
    echo "⚠️  No clients found. Skipping integration."
    exit 0
fi

echo ""
echo "📦 Integrating client configurations..."

# Generate client setup documentation (SETUP.md)
echo "   Generating client setup documentation..."
set +e
yarn generate:client-setup
GENERATE_EXIT_CODE=$?
set -e

if [ $GENERATE_EXIT_CODE -ne 0 ]; then
    echo "⚠️  Warning: Failed to generate client setup documentation (continuing...)"
fi

# Read database names
if [ -f "$GENERATED_DIR/database-names.txt" ]; then
    CLIENT_DATABASES=$(cat "$GENERATED_DIR/database-names.txt")
    echo "   Database names: $CLIENT_DATABASES"
    
    # Update .env file (if it exists)
    if [ -f "$PROJECT_ROOT/.env" ]; then
        # Check if POSTGRES_MULTIPLE_DATABASES exists
        if grep -q "^POSTGRES_MULTIPLE_DATABASES=" "$PROJECT_ROOT/.env"; then
            # Update existing line
            sed -i "s|^POSTGRES_MULTIPLE_DATABASES=.*|POSTGRES_MULTIPLE_DATABASES=portfolio_db,$CLIENT_DATABASES|" "$PROJECT_ROOT/.env"
        else
            # Add new line
            echo "POSTGRES_MULTIPLE_DATABASES=portfolio_db,$CLIENT_DATABASES" >> "$PROJECT_ROOT/.env"
        fi
        echo "   ✓ Updated .env with database names"
    fi
fi

# Verify integration
echo ""
echo "🔍 Verifying integration..."

# Check generated files exist
MISSING_FILES=0
for file in docker-compose.clients.yml nginx.clients.conf clients.json database-names.txt; do
    if [ ! -f "$GENERATED_DIR/$file" ]; then
        echo "❌ Missing: .generated/$file"
        MISSING_FILES=1
    fi
done

if [ $MISSING_FILES -eq 1 ]; then
    echo "❌ Integration verification failed: Missing required files"
    exit 1
fi

# Validate Docker Compose syntax (if docker-compose is available)
if command -v docker-compose >/dev/null 2>&1; then
    set +e
    docker-compose -f "$GENERATED_DIR/docker-compose.clients.yml" config >/dev/null 2>&1
    DOCKER_COMPOSE_VALID=$?
    set -e
    
    if [ $DOCKER_COMPOSE_VALID -ne 0 ]; then
        echo "⚠️  Warning: Docker Compose syntax validation failed (docker-compose config check)"
        echo "   This may be due to missing environment variables or invalid configuration"
        echo "   Please review .generated/docker-compose.clients.yml manually"
    else
        echo "   ✓ Docker Compose syntax valid"
    fi
fi

echo "✅ Integration verified"

echo ""
echo "✅ Client integration complete!"
echo ""
echo "Next steps:"
echo "  1. Review .generated/docker-compose.clients.yml"
echo "  2. Review .generated/nginx.clients.conf"
echo "  3. Merge client services into docker-compose.yml (or use docker-compose -f docker-compose.yml -f .generated/docker-compose.clients.yml)"
echo "  4. Include nginx.clients.conf in your Nginx configuration"
echo "  5. Run migrations: yarn migrate:clients"

