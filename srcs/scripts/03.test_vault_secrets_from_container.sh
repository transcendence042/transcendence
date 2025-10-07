#!/usr/bin/env sh

set -e

VAULT_ADDR="https://localhost:8200"

# Rutas locales
ROLE_FILE="srcs/secrets/api-approle/role_id"
SECRET_FILE="srcs/secrets/api-approle/secret_id"
UNSEAL_KEY_FILE="srcs/secrets/vault/unseal_key"
ROOT_TOKEN_FILE="srcs/secrets/vault/root_token"
CERT_DIR="srcs/secrets/certs"

# Verificar que los archivos necesarios existen
for f in "$ROLE_FILE" "$SECRET_FILE" "$UNSEAL_KEY_FILE"; do
  if [ ! -f "$f" ]; then
    echo "❌ Missing $f."
    echo "Available files in srcs/secrets/:"
    ls -la srcs/secrets/ 2>/dev/null || echo "Directory not found"
    exit 1
  fi
done

# Verificar si Vault está sellado usando curl
echo "==> Checking seal status..."
SEALED=$(curl -sk "$VAULT_ADDR/v1/sys/seal-status" | grep '"sealed":true' || echo "")
if [ -n "$SEALED" ]; then
  echo "==> Unsealing Vault..."
  UNSEAL_KEY="$(cat "$UNSEAL_KEY_FILE")"
  curl -sk -X POST -d "{\"key\":\"$UNSEAL_KEY\"}" "$VAULT_ADDR/v1/sys/unseal" >/dev/null
fi

# Autenticación con AppRole usando curl
echo "==> Logging in to Vault with AppRole..."
ROLE_ID="$(cat "$ROLE_FILE")"
SECRET_ID="$(cat "$SECRET_FILE")"

TOKEN=$(curl -sk -X POST "$VAULT_ADDR/v1/auth/approle/login" \
  -d "{\"role_id\":\"$ROLE_ID\",\"secret_id\":\"$SECRET_ID\"}" | \
  grep -o '"client_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Couldn't get token. Is Vault running and unsealed?"
  exit 1
fi

# Leer secretos de Vault KV usando curl
echo "==> Reading secrets from kv/transcendence/api ..."
JSON=$(curl -sk -H "X-Vault-Token: $TOKEN" "$VAULT_ADDR/v1/kv/data/transcendence/api")

# Extraer valores usando grep y cut (sin jq)
JWT_SECRET=$(echo "$JSON" | grep -o '"JWT_SECRET":"[^"]*"' | cut -d'"' -f4 || echo "empty")
DB_PASSWORD=$(echo "$JSON" | grep -o '"DB_PASSWORD":"[^"]*"' | cut -d'"' -f4 || echo "empty")
OAUTH_SECRET=$(echo "$JSON" | grep -o '"OAUTH_CLIENT_SECRET":"[^"]*"' | cut -d'"' -f4 || echo "empty")

# Leer certificados del sistema de archivos
if [ -r "$CERT_DIR/fullchain.pem" ]; then
  FULLCHAIN="$(cat "$CERT_DIR/fullchain.pem")"
else
  FULLCHAIN="File not found"
fi
if [ -r "$CERT_DIR/privkey.pem" ]; then
  PRIVKEY="$(cat "$CERT_DIR/privkey.pem")"
else
  PRIVKEY="File not found"
fi

echo
echo "✅ Secrets from Vault (AppRole from local):"
echo "JWT_SECRET=$JWT_SECRET"
echo "DB_PASSWORD=$DB_PASSWORD"
echo "OAUTH_CLIENT_SECRET=$OAUTH_SECRET"
echo "FULLCHAIN:"
echo "$FULLCHAIN"
echo "PRIVKEY:"
echo "$PRIVKEY"

# Sellar Vault usando root_token si está disponible
if [ -f "$ROOT_TOKEN_FILE" ]; then
  echo "==> Sealing Vault..."
  ROOT_TOKEN="$(cat "$ROOT_TOKEN_FILE")"
  HTTP_CODE=$(curl -sk -w '%{http_code}' -o /dev/null -X PUT \
    -H "X-Vault-Token: $ROOT_TOKEN" "$VAULT_ADDR/v1/sys/seal")
  if [ "$HTTP_CODE" = "204" ]; then
    echo "✅ Vault has been sealed successfully."
  else
    echo "⚠️  Could not seal Vault (HTTP $HTTP_CODE)."
  fi
else
  echo "⚠️  root_token not found; skipping seal."
fi