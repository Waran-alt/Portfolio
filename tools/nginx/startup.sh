#!/bin/sh
set -e

# Directory where SSL certificates are stored
CERT_DIR="/etc/nginx/ssl"
# Certificate, key, and DH param file paths
CERT="$CERT_DIR/nginx-selfsigned.crt"
KEY="$CERT_DIR/nginx-selfsigned.key"
DHPARAM="$CERT_DIR/dhparam.pem"

# Step 1: Generate SSL certificates if they don't exist
if [ ! -f "$CERT" ] || [ ! -f "$KEY" ] || [ ! -f "$DHPARAM" ]; then
  echo "Generating self-signed certificates for development..."
  mkdir -p "$CERT_DIR"
  # Generate self-signed certificate and private key
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY" \
    -out "$CERT" \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
  # Generate Diffie-Hellman parameters for extra security (2048 bits for dev speed)
  openssl dhparam -out "$DHPARAM" 2048
  # Set permissions for security
  chmod 600 "$KEY"
  chmod 644 "$CERT" "$DHPARAM"
else
  echo "Certificates already exist, skipping generation."
fi

# Step 2: Substitute environment variables in nginx config
echo "Substituting environment variables in nginx configuration..."
# Default values
FRONTEND_PORT=${FRONTEND_PORT:-3000}
BACKEND_PORT=${BACKEND_PORT:-4000}

# Substitute placeholders in the template
sed -e "s/{{FRONTEND_PORT}}/$FRONTEND_PORT/g" \
    -e "s/{{BACKEND_PORT}}/$BACKEND_PORT/g" \
    /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Starting nginx..."
# Step 3: Start nginx
exec nginx -g "daemon off;" 