# Sécurité

## Fonctionnalités Implémentées

### 🔐 Authentification
- JWT (HS256, expiration 24h, issuer/audience validation)
- Bcrypt (10 rounds)
- Validation rôles (Manager/Employé)
- Détection erreurs JWT (expired, invalid)

### 🚦 Rate Limiting
**Application (Express)**:
- Auth: 5 req/15min
- API: 100 req/15min
- Payload max: 10KB

**Nginx**:
- Auth: 5 req/min (burst 2)
- API: 10 req/s (burst 20)
- Connexions max: 10/IP

### 🛡️ Validation & Sanitisation
- SQL injection: Parameterized queries + pattern detection
- XSS: Suppression `<>`, limite 1000 chars
- Email: RFC-compliant validation
- Types: string, number, email, boolean

### 🔒 Headers HTTP (Helmet)
- CSP (Content Security Policy)
- HSTS (1 an)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### 🌐 CORS
- Origins autorisées configurables (`ALLOWED_ORIGINS`)
- Credentials: true
- Default dev: localhost:5173, localhost:3000

### 💾 PostgreSQL
- Parameterized queries (anti-SQL injection)
- Connection pooling (5-20)
- Timeouts: 30s
- Auth: scram-sha-256
- SSL: optionnel (`DB_SSL_ENABLED=true`)

### 🐳 Docker
- User non-root (postgres)
- Read-only filesystem
- Capabilities minimales
- Network isolation
- Port DB: 127.0.0.1 only

### ⚙️ Nginx
- Version cachée
- Limite taille body: 1MB
- Timeouts: 10s
- Blocage fichiers sensibles (.env, .git, .sql)

## Checklist Production

**Obligatoire**:
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# .env
JWT_SECRET=<64+ chars>
NODE_ENV=production
DB_PASSWORD=<16+ chars>
ALLOWED_ORIGINS=https://yourdomain.com
```

**Recommandé**:
- [ ] SSL/TLS (HTTPS)
- [ ] PostgreSQL SSL (`DB_SSL_ENABLED=true`)
- [ ] Firewall configuré
- [ ] Port DB non exposé (retirer mapping)
- [ ] Monitoring + logs
- [ ] Backups DB automatiques
- [ ] Mot de passe 12+ chars
- [ ] Lockout après tentatives échouées
- [ ] IDS (Intrusion Detection System)

## Variables Sécurité

```env
# Production
NODE_ENV=production
JWT_SECRET=<64-char-secret>
DB_PASSWORD=<strong-password>
ALLOWED_ORIGINS=https://yourdomain.com

# SSL Database (AWS RDS, Azure, etc.)
DB_SSL_ENABLED=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

## OWASP Top 10

✅ **A01** - Broken Access Control: RBAC implémenté
✅ **A02** - Cryptographic Failures: bcrypt + JWT
✅ **A03** - Injection: Parameterized queries
✅ **A04** - Insecure Design: Architecture sécurisée
✅ **A05** - Security Misconfiguration: Defaults sécurisés
✅ **A07** - Authentication Failures: Rate limiting + hashing
✅ **A08** - Integrity: Validation stricte
✅ **A09** - Logging: Logs de sécurité
✅ **A10** - SSRF: Validation inputs

## Tests Sécurité

```bash
# Vulnérabilités
npm audit

# Rate limiting
for i in {1..10}; do curl http://localhost/api/auth/login -X POST; done

# Headers
curl -I http://localhost/api/health

# SQL injection (doit échouer)
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"admin@test.com","password":"' OR 1=1--"}'
```

## Support

Vulnérabilités: security@yourcompany.com (réponse sous 48h)
