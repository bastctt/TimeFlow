# Time Manager

Application de gestion du temps d'équipe avec contrôle d'accès par rôle.

## Stack

**Backend**: Node.js 20, Express 5, TypeScript, PostgreSQL 16, JWT
**Frontend**: React 19, Vite 7, Tailwind CSS
**Infra**: Docker, Nginx

## Installation

### Docker (Recommandé)

```bash
cp backend/.env.dist backend/.env
# Éditer backend/.env
docker-compose up -d
# Frontend: http://localhost
# API: http://localhost:3000
```

### Local

```bash
# Backend
cd backend && npm install && cp .env.dist .env
psql -U postgres -c "CREATE DATABASE timemanager;"
psql -U postgres -d timemanager -f init.sql
npm run dev  # Port 3000

# Frontend
cd frontend && npm install
echo "VITE_API_URL=http://localhost:3000" > .env
npm run dev  # Port 5173
```

## Comptes Test

**Manager**: manager1@timemanager.com / password123
**Employé**: marketing1@timemanager.com / password123

## Env Variables

**Backend**: `JWT_SECRET` (min 32 chars), `DB_*`, `ALLOWED_ORIGINS`
**Frontend**: `VITE_API_URL`

⚠️ **Production**: Changer `JWT_SECRET` et `DB_PASSWORD`

## Contribution

**Git Flow**: `main` (prod) ← `develop` (défaut) ← `feature/*`

**Commits**: `feat: description`, `fix: description`, `security: description`

**PR**: CI verte + 1-2 approvals requis

**CI/CD**: Build + Tests auto sur PR → [CONTRIBUTING.md](./CONTRIBUTING.md)

## Docs

- [API](./API_DOCUMENTATION.md)
- [Guide Utilisateur](./USER_GUIDE.md)
- [Sécurité](./SECURITY.md)
- [Contribuer](./CONTRIBUTING.md)

## Commandes

```bash
docker-compose up -d             # Démarrer
docker-compose logs -f           # Logs
docker-compose down -v           # Reset
npm test                         # Tests backend
```

## Licence

ISC
