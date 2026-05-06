#!/bin/bash
# Docker Compose helper - Portfolio stack only
#
# Usage: ./scripts/docker-stack.sh <docker-compose-args...>
# Example: ./scripts/docker-stack.sh up -d
#          ./scripts/docker-stack.sh down
#          ./scripts/docker-stack.sh logs -f

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

COMPOSE_FILES="-f docker-compose.yml"

exec docker-compose $COMPOSE_FILES "$@"
