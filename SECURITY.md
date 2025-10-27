# Sécurité

## Implémenté

### Auth
- JWT (HS256, 24h)
- Bcrypt (10 rounds)
- Rôles: Manager/Employé

### Validation
- SQL injection: Parameterized queries
- XSS: Suppression `<>`
- Email: RFC validation

### Database
- PostgreSQL 16
- Parameterized queries
- Connection pooling

### Headers HTTP
- Helmet activé
- CORS configuré

## Production

**Obligatoire**:
```bash
# Générer JWT secret (64+ chars)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# .env
JWT_SECRET=<generated-secret>
NODE_ENV=production
DB_PASSWORD=<strong-password>
ALLOWED_ORIGINS=https://yourdomain.com
```

**Recommandé**:
- SSL/TLS (HTTPS)
- Firewall
- Monitoring
- Backups DB
- Mots de passe 12+ chars

## Tests

```bash
# Vulnérabilités
npm audit

# Headers
curl -I http://localhost/api/health
```
