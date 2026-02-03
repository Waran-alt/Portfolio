#!/bin/bash
# Rebuild and optionally restart a specific client's containers
#
# Usage:
#   yarn clients:rebuild memoon-card                  # From Portfolio root
#   yarn clients:rebuild memoon-card -- --restart     # Rebuild + restart
#   ../../scripts/rebuild-client.sh memoon-card       # From clients/memoon-card/

set -e

INITIAL_CWD="$(pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Auto-detect client-id when run from clients/<id>/
if [[ -z "${1:-}" ]] && [[ "$INITIAL_CWD" == "$PROJECT_ROOT/clients/"* ]]; then
  REL="${INITIAL_CWD#$PROJECT_ROOT/clients/}"
  CLIENT_ID="${REL%%/*}"
else
  CLIENT_ID="${1:?Usage: $0 <client-id> [--restart]  (or run from clients/<id>/)}"
fi
RESTART=false
[[ "${2:-}" == "--restart" ]] && RESTART=true

BACKEND="${CLIENT_ID}-backend"
FRONTEND="${CLIENT_ID}-frontend"

echo "Rebuilding client: $CLIENT_ID"
./scripts/docker-stack.sh build "$BACKEND" "$FRONTEND"

if [[ "$RESTART" == "true" ]]; then
  echo "Restarting $CLIENT_ID services..."
  ./scripts/docker-stack.sh up -d --force-recreate "$BACKEND" "$FRONTEND"
  echo "Done."
fi
