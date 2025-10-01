# To execute : bash srcs/scripts/00.init_waf_and_vault.sh (From Transcendence)

#!/usr/bin/env bash
# Initializes ModSecurity log dirs (inside srcs/) and configures Vault:
#  - (3) init + unseal + login
#  - (4) enable KV v2 and write demo secrets
#  - (5) least-privilege policy
#  - (6) AppRole (role_id/secret_id saved in repo under srcs/)
set -euo pipefail

# ---------- Paths (everything under srcs/) ----------
BASE_DIR="$(cd "$(dirname "$0")/../.." && pwd)"     # repo root
SRC_DIR="$BASE_DIR/srcs"

LOGS_NGX_DIR="$SRC_DIR/logs/nginx"
LOGS_MODSEC_DIR="$SRC_DIR/logs/modsec"
SECRETS_VAULT_DIR="$SRC_DIR/secrets/vault"
SECRETS_APPROLE_DIR="$SRC_DIR/secrets/api-approle"

VAULT_CFG_DIR="$SRC_DIR/data/vault/config"
VAULT_DATA_DIR="$SRC_DIR/data/vault/file"
VAULT_HCL="$VAULT_CFG_DIR/vault.hcl"

# ---------- Helpers ----------
v() { docker compose exec -T vault sh -lc "export VAULT_ADDR=http://127.0.0.1:8200; $*"; }

ensure_line_in_file() {
  local line="$1" file="$2"
  grep -qxF "$line" "$file" 2>/dev/null || echo "$line" >> "$file"
}

# ---------- Prepare local folders ----------
echo "==> Preparing local folders under srcs/ ..."
mkdir -p "$LOGS_NGX_DIR" "$LOGS_MODSEC_DIR" "$SECRETS_VAULT_DIR" "$SECRETS_APPROLE_DIR" \
         "$VAULT_CFG_DIR" "$VAULT_DATA_DIR"
chmod -R 775 "$SRC_DIR/logs" || true

# Minimal vault.hcl if missing
if [ ! -f "$VAULT_HCL" ]; then
  cat > "$VAULT_HCL" <<'HCL'
ui = true
disable_mlock = true
listener "tcp" { address = "0.0.0.0:8200"; tls_disable = 1 }
storage  "file" { path = "/vault/file" }
log_level = "info"
HCL
  echo "   Created $VAULT_HCL"
fi

# ---------- .gitignore safety ----------
echo "==> Securing .gitignore for secrets..."
ensure_line_in_file "srcs/secrets/" "$BASE_DIR/.gitignore"
ensure_line_in_file "*.pem"         "$BASE_DIR/.gitignore"
ensure_line_in_file "*.key"         "$BASE_DIR/.gitignore"
ensure_line_in_file "srcs/.env"     "$BASE_DIR/.gitignore"

# ---------- Bring up Vault ----------
echo "==> Bringing up vault ..."
docker compose up -d vault || true

# quick health/log hint if config is wrong
sleep 1
if ! docker compose ps vault | grep -q "Up"; then
  echo "Vault is not Up. Showing last logs:"
  docker compose logs --tail=50 vault || true
  echo "Fix: ensure docker-compose.yml mounts ./srcs/data/vault/config:/vault/config and ./srcs/data/vault/file:/vault/file"
  exit 1
fi

echo "==> Waiting for vault to respond ..."
for i in {1..30}; do
  if v "vault status >/dev/null 2>&1"; then break; fi
  sleep 1
done

# ---------- (3) INIT + UNSEAL + LOGIN ----------
ROOT_TOKEN_FILE="$SECRETS_VAULT_DIR/root_token"
UNSEAL_KEY_FILE="$SECRETS_VAULT_DIR/unseal_key"

echo "==> Checking if initialized ..."
if v "vault status -format=json" | grep -q '"initialized":true'; then
  echo "   Already initialized."
else
  echo "==> Initializing Vault ..."
  INIT_OUT="$(v 'vault operator init -key-shares=1 -key-threshold=1')"
  echo "$INIT_OUT" > "$SECRETS_VAULT_DIR/init.txt"
  UNSEAL_KEY="$(echo "$INIT_OUT" | awk -F': ' '/Unseal Key 1/ {print $2}')"
  ROOT_TOKEN="$(echo "$INIT_OUT" |  awk -F': ' '/Initial Root Token/ {print $2}')"
  printf "%s" "$UNSEAL_KEY" > "$UNSEAL_KEY_FILE"
  printf "%s" "$ROOT_TOKEN" > "$ROOT_TOKEN_FILE"
  echo "   Saved unseal key and root token under srcs/secrets/vault/"
fi

echo "==> Checking sealed state ..."
if v "vault status -format=json" | grep -q '"sealed":true'; then
  echo "==> Unsealing ..."
  UNSEAL_KEY="$(cat "$UNSEAL_KEY_FILE")"
  v "vault operator unseal '$UNSEAL_KEY'"
else
  echo "   Already unsealed."
fi

echo "==> Login with root token ..."
ROOT_TOKEN="$(cat "$ROOT_TOKEN_FILE")"
v "vault login '$ROOT_TOKEN' >/dev/null"

# ---------- (4) KV v2 + demo data ----------
echo "==> Enabling KV v2 at 'kv' ..."
v "vault secrets enable -path=kv kv-v2 || true"

# Optional: read srcs/.env for initial values
JWT_SECRET_VAL="superjwt"
DB_PASSWORD_VAL="sup3r_pwd"
OAUTH_SECRET_VAL="foo_bar_baz"
if [ -f "$SRC_DIR/.env" ]; then
  # shellcheck disable=SC1090
  . "$SRC_DIR/.env"
  JWT_SECRET_VAL="${JWT_SECRET:-$JWT_SECRET_VAL}"
  DB_PASSWORD_VAL="${DB_PASSWORD:-$DB_PASSWORD_VAL}"
  OAUTH_SECRET_VAL="${OAUTH_CLIENT_SECRET:-$OAUTH_SECRET_VAL}"
fi

echo "==> Writing sample secrets at kv/transcendence/api ..."
v "vault kv put kv/transcendence/api JWT_SECRET='$JWT_SECRET_VAL' DB_PASSWORD='$DB_PASSWORD_VAL' OAUTH_CLIENT_SECRET='$OAUTH_SECRET_VAL' >/dev/null"

# ---------- (5) Least-privilege policy ----------
echo "==> Writing policy 'transcendence-api' ..."
v "cat > /tmp/transcendence-api.hcl <<'EOF'
path \"kv/data/transcendence/*\"      { capabilities = [\"read\"] }
path \"kv/metadata/transcendence/*\"  { capabilities = [\"list\",\"read\"] }
EOF"
v "vault policy write transcendence-api /tmp/transcendence-api.hcl >/dev/null"

# ---------- (6) AppRole ----------
echo "==> Enabling AppRole and creating role ..."
v "vault auth enable approle || true"
v "vault write auth/approle/role/transcendence-api token_policies='transcendence-api' token_ttl=24h token_max_ttl=72h secret_id_ttl=24h secret_id_num_uses=10 >/dev/null"

echo "==> Fetching RoleID and generating SecretID ..."
ROLE_ID="$(v 'vault read -field=role_id auth/approle/role/transcendence-api/role-id' | tr -d '\r')"
SECRET_ID="$(v 'vault write -f -field=secret_id auth/approle/role/transcendence-api/secret-id' | tr -d '\r')"
printf "%s" "$ROLE_ID"   > "$SECRETS_APPROLE_DIR/role_id"
printf "%s" "$SECRET_ID" > "$SECRETS_APPROLE_DIR/secret_id"

echo
echo "===================================================================="
echo "✅ Done."
echo "  Logs (ModSec):      $LOGS_NGX_DIR  |  $LOGS_MODSEC_DIR"
echo "  Vault root token:   $ROOT_TOKEN_FILE"
echo "  Vault unseal key:   $UNSEAL_KEY_FILE"
echo "  AppRole files:      $SECRETS_APPROLE_DIR/role_id, secret_id"
echo
echo "Next: run 'bash srcs/scripts/01.read_vault_from_host.sh' to read secrets."
echo "===================================================================="
