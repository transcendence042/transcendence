#!/usr/bin/env bash
# filepath: /mnt/c/users/usuario/desktop/Transcendence/srcs/scripts/00.gen_selfsigned_cert.sh

set -euo pipefail

CERT_DIR="./srcs/secrets/certs"

# Create the certificate directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate a self-signed certificate
if [ ! -f "$CERT_DIR/fullchain.pem" ] || [ ! -f "$CERT_DIR/privkey.pem" ]; then
  echo "==> Generating self-signed TLS certificates for localhost ..."
  cat > "$CERT_DIR/cert.conf" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
CN = localhost

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
EOF

  openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/fullchain.pem" \
    -config "$CERT_DIR/cert.conf" \
    -extensions v3_req

  chmod 600 "$CERT_DIR/privkey.pem"
  chmod 644 "$CERT_DIR/fullchain.pem"
else
  echo "   Certificates already exist at $CERT_DIR."
fi