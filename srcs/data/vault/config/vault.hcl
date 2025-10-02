# Enable the Vault web interface
ui = true
disable_mlock = true

# Listener configuration: Listen on port 8200 without TLS
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 0
  tls_cert_file = "/etc/nginx/certs/fullchain.pem"  # Route to the public certificate
  tls_key_file  = "/etc/nginx/certs/privkey.pem"    # Path to the private key

}

# File storage within the container
storage "file" {
  path = "/vault/file"
}

# Optional if other containers use the DNS vault
# api_addr = "http://vault:8200"

# Optional: log level (info, warn, err, debug)
log_level = "info"
