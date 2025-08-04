# Enable the Vault web interface
ui = true

# Listener configuration: Listen on port 8200 without TLS
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

# File storage within the container
storage "file" {
  path = "/vault/data"
}

# Optional: log level (info, warn, err, debug)
log_level = "info"
