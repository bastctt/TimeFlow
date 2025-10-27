# Environnements - TimeFlow

## Vue d'ensemble

L'application supporte 3 environnements distincts avec des configurations différentes.

| Environnement | Usage | Base de données | Email | Logs |
|---------------|-------|-----------------|-------|------|
| **Development** | Local dev | PostgreSQL local | MailHog | Debug |
| **Test** | CI/Tests | PostgreSQL (service) | Mock | Error |
| **Production** | Déploiement | PostgreSQL distant | SMTP réel | Error |

## Development (Local)

### Configuration

```bash
# .env
NODE_ENV=development
DB_HOST=postgres
DB_NAME=timeflow
SMTP_HOST=mailhog  # Email local
LOG_LEVEL=debug
```

### Caractéristiques

- ✅ Hot reload (nodemon)
- ✅ MailHog pour emails (http://localhost:8025)
- ✅ Logs verbeux
- ✅ Source maps activées
- ✅ CORS permissif

### Démarrer

```bash
docker-compose up -d
# Frontend: http://localhost
# API: http://localhost/api
# MailHog: http://localhost:8025
```

## Test (CI)

### Configuration

```bash
# CI environment variables
NODE_ENV=test
DB_HOST=localhost
DB_NAME=timeflow_test
SMTP_HOST=mock
LOG_LEVEL=error
```

### Caractéristiques

- ✅ Base de données éphémère
- ✅ Emails mockés
- ✅ Logs minimaux
- ✅ Coverage activé
- ✅ Workers limités (2)

### Utilisation

```bash
# GitHub Actions
npm run test:ci
```

## Production (Hypothétique)

### Configuration

```bash
# .env.production (exemple)
NODE_ENV=production
DB_HOST=production-db.example.com
DB_SSL_ENABLED=true
SMTP_HOST=smtp.sendgrid.net
LOG_LEVEL=error
FORCE_HTTPS=true
```

### Caractéristiques

- ✅ SSL/TLS forcé
- ✅ CORS strict
- ✅ Logs erreurs uniquement
- ✅ Build optimisé
- ✅ Rate limiting strict
- ✅ Secrets via variables d'env

### Différences clés

| Variable | Dev | Test | Prod |
|----------|-----|------|------|
| `DB_SSL_ENABLED` | false | false | **true** |
| `ALLOWED_ORIGINS` | * | localhost | domaine strict |
| `LOG_LEVEL` | debug | error | error |
| `RATE_LIMIT_MAX` | 100 | - | 50 |
| `SMTP_HOST` | mailhog | mock | smtp réel |

## Variables d'environnement

### Backend (.env)

```bash
# Database
DB_HOST=           # postgres (dev) | localhost (test) | RDS (prod)
DB_PORT=5432
DB_NAME=           # timeflow | timeflow_test | timeflow_prod
DB_USER=
DB_PASSWORD=
DB_SSL_ENABLED=    # false (dev/test) | true (prod)

# Server
PORT=3000
NODE_ENV=          # development | test | production

# JWT
JWT_SECRET=        # Simple (dev) | Fort (prod)

# CORS
ALLOWED_ORIGINS=   # http://localhost | domaine prod

# Email
EMAIL_FROM=
SMTP_HOST=         # mailhog | mock | smtp.sendgrid.net
SMTP_PORT=
SMTP_USER=         # (vide pour MailHog)
SMTP_PASSWORD=     # (vide pour MailHog)

# Logs
LOG_LEVEL=         # debug | error
```

### Frontend (.env)

```bash
# API URL
VITE_API_URL=      # http://localhost (dev) | https://api.prod (prod)
```

## Docker Compose

### Development

```bash
# Utilise .env par défaut
docker-compose up -d
```

### Test (optionnel)

```bash
# Utilise variables spécifiques
docker-compose -f docker-compose.test.yml up -d
```

## Sécurité

### ⚠️ Ne JAMAIS committer

- `.env` (local)
- `.env.production` (prod secrets)
- Tokens, mots de passe, clés API

### ✅ Commitable

- `.env.example` (template sans secrets)
- Configuration Docker
- Documentation

## Checklist déploiement

Si un jour l'application est déployée :

- [ ] Variables d'env configurées sur plateforme (Vercel, AWS, etc.)
- [ ] Base de données PostgreSQL provisionnée
- [ ] SSL/TLS activé
- [ ] SMTP configuré (SendGrid, Mailgun, etc.)
- [ ] CORS limité au domaine de production
- [ ] Logs centralisés (Sentry, Datadog, etc.)
- [ ] Backups automatiques DB
- [ ] Rate limiting configuré
- [ ] Monitoring activé

---

**Note** : Les configurations de staging/production sont documentées mais non déployées. L'application tourne uniquement en local (development) et CI (test).
