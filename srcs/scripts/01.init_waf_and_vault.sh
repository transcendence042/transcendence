#!/usr/bin/env bash
# filepath: /mnt/c/users/usuario/desktop/Transcendence/srcs/scripts/01.init_waf_and_vault.sh
# Prepares logs, certificates, Vault and AppRole for the Transcendence stack (HTTPS only).

set -euo pipefail

# ---------- Paths ----------
BASE_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SRC_DIR="$BASE_DIR/srcs"

LOGS_NGX_DIR="$SRC_DIR/logs/nginx"
LOGS_MODSEC_DIR="$SRC_DIR/logs/modsec"
SECRETS_VAULT_DIR="$SRC_DIR/secrets/vault"
SECRETS_APPROLE_DIR="$SRC_DIR/secrets/api-approle"
CERTS_DIR="$SRC_DIR/secrets/certs"

VAULT_CFG_DIR="$SRC_DIR/data/vault/config"
VAULT_DATA_DIR="$SRC_DIR/data/vault/file"
VAULT_HCL="$VAULT_CFG_DIR/vault.hcl"

# ---------- Helpers ----------
v() {
  docker compose exec -T vault sh -lc \
    "export VAULT_ADDR=https://127.0.0.1:8200; export VAULT_SKIP_VERIFY=true; $*"
}

ensure_line_in_file() {
  local line="$1" file="$2"
  grep -qxF "$line" "$file" 2>/dev/null || echo "$line" >> "$file"
}

wait_for_vault() {
  echo "==> Waiting for Vault to respond ..."
  for i in {1..30}; do
    out=$(v "vault status" 2>&1 || true)
    if echo "$out" | grep -qE 'Initialized|Sealed|Unsealed'; then
      echo "   Vault is responding."
      return 0
    fi
    sleep 1
  done
  echo "⚠️  Vault did not respond in time. This is normal with self-signed certificates in localhost."
  echo "   You can continue; scripts will work with VAULT_SKIP_VERIFY=true."
  return 0
}

# ---------- Prepare local folders ----------
echo "==> Preparing local folders under srcs/ ..."

mkdir -p "$LOGS_NGX_DIR" "$LOGS_MODSEC_DIR" "$SECRETS_VAULT_DIR" "$SECRETS_APPROLE_DIR" \
         "$VAULT_CFG_DIR" "$VAULT_DATA_DIR" "$CERTS_DIR"
mkdir -p "$BASE_DIR/frontend/dist"

chmod -R 775 "$SRC_DIR/logs" || true

# ---------- Ensure .gitkeep in always-empty folders ----------
#touch "$BASE_DIR/frontend/dist/.gitkeep"
#touch "$SECRETS_APPROLE_DIR/.gitkeep"

# ---------- Ensure .gitkeep in empty folders ----------
#touch "$SRC_DIR/conf/nginx/entrypoint-empty/.gitkeep"
#touch "$SRC_DIR/conf/nginx/templates-empty/.gitkeep"

# ---------- Ensure ModSecurity log files exist ----------
touch "$LOGS_MODSEC_DIR/modsec_audit.log" "$LOGS_MODSEC_DIR/modsec_debug.log"
chmod 666 "$LOGS_MODSEC_DIR/modsec_audit.log" "$LOGS_MODSEC_DIR/modsec_debug.log"

# ---------- Ensure Nginx log files exist ----------
touch "$LOGS_NGX_DIR/access.log" "$LOGS_NGX_DIR/error.log"
chmod 666 "$LOGS_NGX_DIR/access.log" "$LOGS_NGX_DIR/error.log"

# ---------- Ensure test certificates (self-signed) ----------
if [ ! -f "$CERTS_DIR/fullchain.pem" ] || [ ! -f "$CERTS_DIR/privkey.pem" ]; then
  echo "==> Generating self-signed TLS certificates for localhost ..."
  cat > "$CERTS_DIR/cert.conf" <<EOF
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
    -keyout "$CERTS_DIR/privkey.pem" \
    -out "$CERTS_DIR/fullchain.pem" \
    -config "$CERTS_DIR/cert.conf" \
    -extensions v3_req

  chmod 600 "$CERTS_DIR/privkey.pem"
  chmod 644 "$CERTS_DIR/fullchain.pem"
fi

# ---------- Minimal vault.hcl if missing ----------
if [ ! -f "$VAULT_HCL" ]; then
  cat > "$VAULT_HCL" <<'HCL'
ui = true
disable_mlock = true
listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = 0
  tls_cert_file = "/vault/certs/fullchain.pem"
  tls_key_file  = "/vault/certs/privkey.pem"
}
storage  "file" { path = "/vault/file" }
log_level = "info"
HCL
  echo "   Created $VAULT_HCL"
fi

# ---------- .gitignore safety ----------
#echo "==> Securing .gitignore for secrets..."
#ensure_line_in_file "srcs/secrets/" "$BASE_DIR/.gitignore"
#ensure_line_in_file "*.pem"         "$BASE_DIR/.gitignore"
#ensure_line_in_file "*.key"         "$BASE_DIR/.gitignore"
#ensure_line_in_file "srcs/.env"     "$BASE_DIR/.gitignore"

# ---------- Bring up Vault ----------
echo "==> Bringing up Vault ..."
docker compose up -d vault || true

sleep 1
if ! docker compose ps vault | grep -q "Up"; then
  echo "Vault is not Up. Showing last logs:"
  docker compose logs --tail=50 vault || true
  echo "Fix: ensure docker-compose.yml mounts ./srcs/data/vault/config:/vault/config, ./srcs/data/vault/file:/vault/file, and ./srcs/secrets/certs:/vault/certs"
  exit 1
fi

wait_for_vault

# ---------- (3) INIT + UNSEAL + LOGIN ----------
ROOT_TOKEN_FILE="$SECRETS_VAULT_DIR/root_token"
UNSEAL_KEY_FILE="$SECRETS_VAULT_DIR/unseal_key"

echo "==> Checking if Vault is initialized ..."
# Use a simpler check that works reliably
if [ -f "$ROOT_TOKEN_FILE" ] && [ -f "$UNSEAL_KEY_FILE" ]; then
  echo "   Already initialized (found existing token files)."
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
VAULT_STATUS=$(v "vault status" 2>&1 || true)
if echo "$VAULT_STATUS" | grep -q "Sealed.*true"; then
  echo "==> Unsealing ..."
  UNSEAL_KEY="$(cat "$UNSEAL_KEY_FILE")"
  v "vault operator unseal '$UNSEAL_KEY'"
else
  echo "   Already unsealed."
fi

echo "==> Login with root token ..."
ROOT_TOKEN="$(cat "$ROOT_TOKEN_FILE")"
v "vault login '$ROOT_TOKEN'"

# ---------- (4) KV v2 + demo data ----------
echo "==> Enabling KV v2 at 'kv' ..."
# idempotent: ignore if already enabled
v "vault secrets enable -path=kv kv-v2 >/dev/null 2>&1 || true"

JWT_SECRET_VAL="superjwt"
DB_PASSWORD_VAL="sup3r_pwd"
OAUTH_SECRET_VAL="foo_bar_baz"

# Load variables from .env if it exists and is valid
if [ -f "$SRC_DIR/secrets/.env" ]; then
  # Check if .env file has valid syntax before sourcing
  if bash -n "$SRC_DIR/secrets/.env" 2>/dev/null; then
    . "$SRC_DIR/secrets/.env"
    JWT_SECRET_VAL="${JWT_SECRET:-$JWT_SECRET_VAL}"
    DB_PASSWORD_VAL="${DB_PASSWORD:-$DB_PASSWORD_VAL}"
    OAUTH_SECRET_VAL="${OAUTH_CLIENT_SECRET:-$OAUTH_SECRET_VAL}"
  else
    echo "⚠️  Warning: .env file has syntax errors, using default values"
  fi
fi

echo "==> Writing sample secrets at kv/transcendence/api ..."
v "vault kv put kv/transcendence/api JWT_SECRET='$JWT_SECRET_VAL' DB_PASSWORD='$DB_PASSWORD_VAL' OAUTH_CLIENT_SECRET='$OAUTH_SECRET_VAL'"

# ---------- (5) Least-privilege policy ----------
echo "==> Writing policy 'transcendence-api' ..."
v "sh -lc 'cat >/tmp/transcendence-api.hcl <<\"HCL\"
path \"kv/data/transcendence/*\" {
  capabilities = [\"read\", \"list\"]
}
path \"kv/metadata/transcendence/*\" {
  capabilities = [\"list\"]
}
HCL
vault policy write transcendence-api /tmp/transcendence-api.hcl >/dev/null
rm -f /tmp/transcendence-api.hcl'"

# ---------- (6) AppRole ----------
echo "==> Enabling AppRole and creating role ..."
# idempotent: ignore if approle already enabled
v "vault auth enable approle >/dev/null 2>&1 || true"

# Create/Update role
v "vault write auth/approle/role/transcendence-api \
  token_policies=transcendence-api \
  token_ttl=1h token_max_ttl=24h" >/dev/null

echo "==> Fetching RoleID and generating SecretID ..."
ROLE_ID="$(v 'vault read -field=role_id auth/approle/role/transcendence-api/role-id' | tr -d '\r')"
SECRET_ID="$(v 'vault write -f -field=secret_id auth/approle/role/transcendence-api/secret-id' | tr -d '\r')"

mkdir -p "$SECRETS_APPROLE_DIR"
printf "%s" "$ROLE_ID"   > "$SECRETS_APPROLE_DIR/role_id"
printf "%s" "$SECRET_ID" > "$SECRETS_APPROLE_DIR/secret_id"
chmod 600 "$SECRETS_APPROLE_DIR/role_id" "$SECRETS_APPROLE_DIR/secret_id"

echo
echo "===================================================================="
echo "✅ Done."
echo "  Logs (Nginx):       $LOGS_NGX_DIR"
echo "  Logs (ModSec):      $LOGS_MODSEC_DIR"
echo "  Vault root token:   $ROOT_TOKEN_FILE"
echo "  Vault unseal key:   $UNSEAL_KEY_FILE"
echo "  AppRole files:      $SECRETS_APPROLE_DIR/role_id, secret_id"
echo
echo "Next: run 'bash srcs/scripts/02.read_vault_from_host.sh' to read secrets."
echo "===================================================================="