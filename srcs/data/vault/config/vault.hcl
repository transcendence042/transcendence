ui = true
disable_mlock = true

listener "tcp" {
  address     = "0.0.0.0:8202"
  tls_disable = 1
}

storage "file" {
  path = "/vault/file"
}

log_level = "info"
