#!/bin/sh
# Nginx Client Configuration Integration
#
# This script integrates auto-generated client Nginx configurations
# into the main Nginx configuration during container startup.
#
# It should be called from the Nginx startup script.

set -e

GENERATED_NGINX_CONF="/app/.generated/nginx.clients.conf"
NGINX_CONF_DIR="/etc/nginx/conf.d"

if [ -f "$GENERATED_NGINX_CONF" ]; then
    echo "Including client Nginx configurations..."
    # Copy client config to nginx conf.d
    cp "$GENERATED_NGINX_CONF" "$NGINX_CONF_DIR/clients.conf"
    echo "✓ Client configurations integrated"
else
    echo "⚠️  No client configurations found (this is OK if no clients are configured)"
fi

