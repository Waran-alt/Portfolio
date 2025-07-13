#!/bin/bash
# scripts/renew-certs.sh
# Certificate renewal script using certbot's built-in hooks

set -e

# Set your domain
DOMAIN=${DOMAIN:-"focus-on-pixel.com"}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔄 Starting certificate renewal process for $DOMAIN..."
echo "📁 Project root: $PROJECT_ROOT"

# Use certbot's --post-hook to restart nginx only when certificates are renewed
# Use relative path from project root for better portability
certbot renew --quiet --no-self-upgrade --post-hook "cd $PROJECT_ROOT && docker-compose -f docker-compose.prod.yml restart nginx"

echo "✅ Certificate renewal process completed"
echo "ℹ️  Note: Nginx was only restarted if certificates were actually renewed" 