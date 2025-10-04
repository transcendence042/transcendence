#!/usr/bin/env bash
# Ejecuta esto dentro del contenedor backend o nginx-waf:
# docker compose exec backend bash srcs/scripts/99.test_modsec_rules.sh

set -euo pipefail

ROLE_FILE="/srcs/secrets/api-approle/role_id"
SECRET_FILE="/srcs/secrets/api-approle/secret_id"

if [ ! -f "$ROLE_FILE" ] || [ ! -f "$SECRET_FILE" ]; then 
  echo "❌ Missing $ROLE_FILE or $SECRET_FILE."
  exit 1
fi

ROLE_ID="$(cat "$ROLE_FILE")"
SECRET_ID="$(cat "$SECRET_FILE")"

VAULT_ADDR="${VAULT_ADDR:-https://vault:8200}"
VAULT_SKIP_VERIFY="${VAULT_SKIP_VERIFY:-true}"

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ jq is required but not installed."
  exit 1
fi

echo "==> Logging in to Vault with AppRole..."
TOKEN="$(curl -sk \
  -X POST "$VAULT_ADDR/v1/auth/approle/login" \
  -d "{\"role_id\":\"$ROLE_ID\",\"secret_id\":\"$SECRET_ID\"}" \
  | jq -r '.auth.client_token')"

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Couldn't get token. Is Vault running and unsealed?"
  exit 1
fi

echo "==> Reading secrets from kv/transcendence/api ..."
JSON="$(curl -sk -H "X-Vault-Token: $TOKEN" "$VAULT_ADDR/v1/kv/data/transcendence/api")"

JWT_SECRET="$(echo "$JSON" | jq -r '.data.data.JWT_SECRET // empty')"
DB_PASSWORD="$(echo "$JSON" | jq -r '.data.data.DB_PASSWORD // empty')"
OAUTH_SECRET="$(echo "$JSON" | jq -r '.data.data.OAUTH_CLIENT_SECRET // empty')"

echo
echo "✅ Secrets from Vault (inside container):"
echo "JWT_SECRET=$JWT_SECRET"
echo "DB_PASSWORD=$DB_PASSWORD"
echo "OAUTH_CLIENT_SECRET=$OAUTH_SECRET"
echo