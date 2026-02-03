#!/bin/bash
# Docker Compose helper - resolves compose files (Portfolio + Clients when available)
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
if [ -f ".generated/docker-compose.clients.yml" ]; then
  COMPOSE_FILES="$COMPOSE_FILES -f .generated/docker-compose.clients.yml"
fi

exec docker-compose $COMPOSE_FILES "$@"
