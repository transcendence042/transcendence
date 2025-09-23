# To execute : bash init_waf_and_vault.sh

#!/usr/bin/env bash
# init_waf_and_vault.sh
# Initialize log folders for Nginx/ModSecurity and configure Vault:
# - Step 3: init + unseal + login
# - Step 4: Enable KV v2 and create secrets
# - Step 5: Least-privilege policy
# - Step 6: AppRole (RoleID/SecretID saved in the repo)
#
# Sensitive files are saved in:
# ./secrets/vault/{root_token,unseal_key,init.txt}
# ./secrets/api-approle/{role_id,secret_id}
#
# IMPORTANT! Make sure you have "secrets/" in .gitignore.

set -euo pipefail

# --------- Local routes in the repo ----------
LOGS_NGX_DIR="./logs/nginx"
LOGS_MODSEC_DIR="./logs/modsec"
SECRETS_VAULT_DIR="./secrets/vault"
SECRETS_APPROLE_DIR="./secrets/api-approle"

# --------- Helpers docker/Vault --------------
# Execute commands inside the 'vault' container with the correct VAULT_ADDR.
v() { 
docker compose exec -T vault sh -lc "export VAULT_ADDR=http://127.0.0.1:8200; $*"
}

ensure_line_in_file() { 
local line="$1" file="$2" 
grep -qxF "$line" "$file" 2>/dev/null || echo "$line" >> "$file"
}

echo "==> Preparing local folders..."
mkdir -p "$LOGS_NGX_DIR" "$LOGS_MODSEC_DIR" "$SECRETS_VAULT_DIR" "$SECRETS_APPROLE_DIR"
chmod -R 775 ./logs || true

echo "==> Securing .gitignore for secrets..."
ensure_line_in_file "secrets/" ".gitignore"
ensure_line_in_file "*.pem" ".gitignore"
ensure_line_in_file "*.key" ".gitignore"

echo "==> Bringing up the vault if it's not running..."
docker compose up -d vault

echo "==> Waiting for the vault to respond..."
# Wait for the socket to be ready (may return non-0 codes when sealed; this is normal).
for i in {1..30}; do
if v "vault status >/dev/null 2>&1"; then 
break 
fi 
sleep 1
donated

# -------------------------------
# (3) INIT + UNSEAL + LOGIN
# -------------------------------
ROOT_TOKEN_FILE="$SECRETS_VAULT_DIR/root_token"
UNSEAL_KEY_FILE="$SECRETS_VAULT_DIR/unseal_key"

echo "==> Checking if Vault is already initialized..."
if v "vault status -format=json" | grep -q '"initialized":true'; then 
echo "Vault is already initialized."
else 
echo "==> Initializing Vault (1 share, threshold 1)..." 
INIT_OUT="$(v 'vault operator init -key-shares=1 -key-threshold=1' || true)" 
if [ -z "$INIT_OUT" ]; then 
echo "ERROR: Could not initialize Vault"; exit 1 
fi 
echo "$INIT_OUT" > "$SECRETS_VAULT_DIR/init.txt" 
UNSEAL_KEY="$(echo "$INIT_OUT" | awk -F': ' '/Unseal Key 1/ {print $2}')" 
ROOT_TOKEN="$(echo "$INIT_OUT" | awk -F': ' '/Initial Root Token/ {print $2}')" 
printf "%s" "$UNSEAL_KEY" > "$UNSEAL_KEY_FILE" 
printf "%s" "$ROOT_TOKEN" > "$ROOT_TOKEN_FILE" 
echo " Unseal Key and Root Token saved in ./secrets/vault/"
fi

echo "==> Checking if Vault is sealed..."
if v "vault status -format=json" | grep -q '"sealed":true'; then
echo "==> Unsealing Vault..."
UNSEAL_KEY="$(cat "$UNSEAL_KEY_FILE")"
v "vault operator unseal '$UNSEAL_KEY'"
else
echo "Vault is already unsealed."
fi

echo "==> Login with Root Token..."
ROOT_TOKEN="$(cat "$ROOT_TOKEN_FILE")"
v "vault login '$ROOT_TOKEN' >/dev/null"

# -------------------------------
# (4) KV v2 + sample data
# -------------------------------
echo "==> Enabling KV v2 on path 'kv' (if it doesn't exist)..."
v "vault secrets enable -path=kv kv-v2 || true"

# You can load from your .env if it exists; if not, sample values.
echo "==> Creating/updating secrets kv/transcendence/api..."
if [ -f ".env" ]; then
# Load variables from .env into the current shell (safe if only K=V pairs)
set -a
# shellcheck disable=SC1091
. ./.env 
set +a
fi

JWT_SECRET_VAL="${JWT_SECRET:-superjwt}"
DB_PASSWORD_VAL="${DB_PASSWORD:-sup3r_pwd}"
OAUTH_SECRET_VAL="${OAUTH_CLIENT_SECRET:-foo_bar_baz}"

v "vault kv put kv/transcendence/api \ 
JWT_SECRET='$JWT_SECRET_VAL' \ 
DB_PASSWORD='$DB_PASSWORD_VAL' \ 
OAUTH_CLIENT_SECRET='$OAUTH_SECRET_VAL' >/dev/null"

# -------------------------------
# (5) least-privilege policy
# -------------------------------
echo "==> Creating policy 'transcendence-api' (least privilege)..."
v "cat > /tmp/transcendence-api.hcl <<'EOF'
path \"kv/data/transcendence/*\" { 
capabilities = [\"read\"]
}
path \"kv/metadata/transcendence/*\" { 
capabilities = [\"list\", \"read\"]
}
"EOF"
v "vault policy write transcendence-api /tmp/transcendence-api.hcl >/dev/null"

# -------------------------------
#(6) AppRole for API
# (RoleID/SecretID in ./secrets/api-approle)
# -------------------------------
echo '==> Enabling auth AppRole...'
v "vault auth enable approle || true"

echo "==> Creating/updating role 'transcendence-api'..."
v "vault write auth/approle/role/transcendence-api \ 
token_policies='transcendence-api' \ 
token_ttl=24h token_max_ttl=72h \ 
secret_id_ttl=24h secret_id_num_uses=10 >/dev/null"

echo "==> Getting RoleID and generating SecretID..."
ROLE_ID="$(v 'vault read -field=role_id auth/approle/role/transcendence-api/role-id' | tr -d '\r')"
SECRET_ID="$(v 'vault write -f -field=secret_id auth/approle/role/t

printf "%s" "$ROLE_ID" > "$SECRETS_APPROLE_DIR/role_id"
printf "%s" "$SECRET_ID" > "$SECRETS_APPROLE_DIR/secret_id"

echo
echo "===============================================================================
echo "✅ Done."
echo " - ModSecurity Logs: $LOGS_NGX_DIR / $LOGS_MODSEC_DIR"
echo " - Vault root token: $ROOT_TOKEN_FILE"
echo " - Vault unseal key: $UNSEAL_KEY_FILE"
echo " - AppRole files: $SECRETS_APPROLE_DIR/role_id, secret_id"
echo
echo "Add this volume to your 'api' service in docker-compose.yml, if it is not there:"
echo 'volumes:'
echo " - ./secrets/api-approle:/run/approle:ro"
echo
echo "And use VAULT_ADDR=http://vault:8200 within the API."
echo "===============================================================================