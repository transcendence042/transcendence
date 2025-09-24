#!/usr/bin/env bash
set -euo pipefail

# Paths where the init saved your AppRole credentials
ROLE_FILE="./secrets/api-approle/role_id"
SECRET_FILE="./secrets/api-approle/secret_id"

if [ ! -f "$ROLE_FILE" ] || [ ! -f "$SECRET_FILE" ]; then 
echo "I can't find $ROLE_FILE or $SECRET_FILE. Run first: bash init_waf_and_vault.sh" 
exit 1
fi

ROLE_ID="$(cat "$ROLE_FILE")"
SECRET_ID="$(cat "$SECRET_FILE")"

VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"

#1) Login with AppRole → I get a temporary token
TOKEN="$(curl -s -X POST "$VAULT_ADDR/v1/auth/approle/login" \ 
-d "{\"role_id\":\"$ROLE_ID\",\"secret_id\":\"$SECRET_ID\"}" \ 
| thirst -n 's/.*"client_token":"\([^"]*\)".*/\1/p')"

if [ -z "$TOKEN" ]; then
echo "Couldn't get token. Vault is lifted and unsealed?" (docker compose up -d vault)" 
exit 1
fi

#2) Read secrets in kv/transcendence/api (KV v2 uses /data/)
JSON="$(curl -s -H "X-Vault-Token: $TOKEN" "$VAULT_ADDR/v1/kv/data/transcendence/api")"

#3) Extract values ​​without depending on 'jq' (I do it with simple sed/grep)
JWT_SECRET="$(echo "$JSON" | sed -n 's/.*"JWT_SECRET":"\([^"]*\)".*/\1/p')"
DB_PASSWORD="$(echo "$JSON" | sed -n 's/.*"DB_PASSWORD":"\([^"]*\)".*/\1/p')"
OAUTH_SECRET="$(echo "$JSON" | sed -n 's/.*"OAUTH_CLIENT_SECRET":"\([^"]*\)".*/\1/p')"

echo "JWT_SECRET=$JWT_SECRET"
echo "DB_PASSWORD=$DB_PASSWORD"
echo "OAUTH_CLIENT_SECRET=$OAUTH_SECRET"