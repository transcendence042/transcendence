# 🚀 **Transcendence**

![Docker](https://img.shields.io/badge/docker-compose-blue?logo=docker)
![ModSecurity](https://img.shields.io/badge/modsecurity-CRS-orange)
![Vault](https://img.shields.io/badge/vault-secrets-yellow)
![Nginx](https://img.shields.io/badge/nginx-reverse--proxy-green)
![Status](https://img.shields.io/badge/status-active-brightgreen)

---

## 📝 **Project Overview**

**Transcendence** is a secure, containerized web stack featuring:
- **Nginx** as a reverse proxy
- **ModSecurity** (OWASP CRS) as a Web Application Firewall (WAF)
- **Vault** for secrets management
- **Frontend** and **Backend** services
- Automated scripts for setup, testing, and security validation

---

## 🏗️ **Stack Architecture**

```
[ Client ] ⇄ [ Nginx + ModSecurity (WAF) ] ⇄ [ Frontend ] ⇄ [ Backend ] ⇄ [ Vault ]
```

- **Nginx**: Handles HTTPS, reverse proxy, and WAF
- **ModSecurity**: Protects against OWASP Top 10 threats
- **Vault**: Secure secrets storage and AppRole authentication
- **Frontend/Backend**: Your application logic

---

## ⚡ **Quick Start**

```bash
# 1. Clone the repository
git clone https://github.com/youruser/transcendence.git
cd transcendence

# 2. Initialize secrets, logs, Vault, and policies
bash srcs/scripts/00.init_waf_and_vault.sh

# 3. Start all services
docker compose up -d

# 4. Run security and integration tests
bash srcs/scripts/99.test_modsec_rules.sh
```

---

## 🔐 **Security Features**

- **WAF**: ModSecurity with OWASP CRS and custom rules
- **HTTPS**: Self-signed certificates by default (replace for production)
- **Vault**: AppRole-based secrets access for backend
- **Rate limiting, CSRF, SSRF, LFI, XSS, SQLi**: All covered by rules & tests

---

## 🧪 **Testing**

- **Automated WAF/CRS tests**:  
  `bash srcs/scripts/99.test_modsec_rules.sh`
- **Vault secrets test (host)**:  
  `bash srcs/scripts/01.read_vault_from_host.sh`
- **Vault secrets test (container)**:  
  `docker compose exec backend bash srcs/scripts/02.test_vault_secrets_from_container.sh`

---

## 📁 **Project Structure**

```
srcs/
  ├── conf/           # Nginx, ModSecurity, CRS configs
  ├── logs/           # Log folders (nginx, modsec)
  ├── scripts/        # Automation and test scripts
  ├── secrets/        # Vault, AppRole, certs (gitignored)
  └── data/           # Vault persistent data
frontend/
backend/
docker-compose.yml
README.md
```

---

## 🛠️ **Development Notes**

- **Empty folders** are tracked with `.gitkeep` files.
- **Secrets** and sensitive files are excluded via `.gitignore`.
- **Self-signed certs** are generated for local HTTPS.

---

## 🤝 **Contributing**

Pull requests and issues are welcome!  
Please open an issue for bugs, suggestions, or improvements.

---

## 📜 **License**

[MIT](LICENSE)

---

**Made with ❤️ for security and learning.**