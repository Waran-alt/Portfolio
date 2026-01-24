#!/bin/sh
set -e

# Directory where SSL certificates are stored
CERT_DIR="/etc/nginx/ssl"
# Certificate, key, and DH param file paths
CERT="$CERT_DIR/nginx-selfsigned.crt"
KEY="$CERT_DIR/nginx-selfsigned.key"
DHPARAM="$CERT_DIR/dhparam.pem"

# Use NGINX_HOSTNAME if set, otherwise extract from NGINX_URL
# This is used for both SSL certificate generation and server_name in nginx config
if [ -n "${NGINX_HOSTNAME}" ]; then
  HOSTNAME="${NGINX_HOSTNAME}"
else
  # Fallback: Extract hostname from NGINX_URL (remove protocol and port)
  HOSTNAME=$(echo "${NGINX_URL}" | sed -E 's|^https?://||' | sed -E 's|:.*$||')
fi

# Step 1: Generate SSL certificates if they don't exist
if [ ! -f "$CERT" ] || [ ! -f "$KEY" ] || [ ! -f "$DHPARAM" ]; then
  echo "Generating self-signed certificates for development..."
  mkdir -p "$CERT_DIR"
  # Generate self-signed certificate and private key
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY" \
    -out "$CERT" \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=${HOSTNAME}"
  # Generate Diffie-Hellman parameters for extra security (2048 bits for dev speed)
  openssl dhparam -out "$DHPARAM" 2048
  # Set permissions for security
  chmod 600 "$KEY"
  chmod 644 "$CERT" "$DHPARAM"
else
  echo "Certificates already exist, skipping generation."
fi

# Step 2: Copy client Nginx configurations if they exist
if [ -f "/app/.generated/nginx.clients.conf" ]; then
  echo "Copying client Nginx configurations..."
  cp /app/.generated/nginx.clients.conf /etc/nginx/conf.d/clients.conf
  echo "✓ Client configurations integrated"
else
  echo "⚠️  No client configurations found (this is OK if no clients are configured)"
  # Remove old clients.conf if it exists
  rm -f /etc/nginx/conf.d/clients.conf
fi

# Step 3: Substitute environment variables in nginx config
echo "Substituting environment variables in nginx configuration..."
# Default values
FRONTEND_PORT=${FRONTEND_PORT}
BACKEND_PORT=${BACKEND_PORT}

# Substitute placeholders in the template
# Use '|' as delimiter to avoid issues with URLs containing forward slashes
sed -e "s|{{FRONTEND_PORT}}|$FRONTEND_PORT|g" \
    -e "s|{{BACKEND_PORT}}|$BACKEND_PORT|g" \
    -e "s|{{NGINX_URL}}|${HOSTNAME}|g" \
    /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Starting nginx..."
# Step 4: Start nginx
exec nginx -g "daemon off;" 