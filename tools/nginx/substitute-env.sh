#!/bin/sh
# Script to substitute environment variables in Nginx config template

set -e

# Default values
FRONTEND_PORT=${FRONTEND_PORT:-3000}
BACKEND_PORT=${BACKEND_PORT:-4000}

# Substitute placeholders in the template
sed -e "s/{{FRONTEND_PORT}}/$FRONTEND_PORT/g" \
    -e "s/{{BACKEND_PORT}}/$BACKEND_PORT/g" \
    /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;" 