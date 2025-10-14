# Time Manager

App de gestion du temps avec rôles Manager/Employé.

## Stack

- **Backend**: Node.js 20, Express, TypeScript, PostgreSQL 16
- **Frontend**: React 19, Vite, Tailwind CSS
- **Infra**: Docker, Nginx

## Quick Start

```bash
docker compose up -d
```

- Frontend: http://localhost
- API: http://localhost/api

## Comptes Test

- **Manager**: manager1@timemanager.com / password123
- **Employé**: marketing1@timemanager.com / password123

## Installation Locale

```bash
# Backend
cd backend
npm install
cp .env.dist .env
npm run dev  # Port 3000

# Frontend
cd frontend
npm install
echo "VITE_API_URL=http://localhost:3000" > .env
npm run dev  # Port 5173
```

## Commandes

```bash
docker compose up -d          # Démarrer
docker compose logs -f        # Logs
docker compose down -v        # Reset complet
npm test                      # Tests
```

## Documentation

- [API](./API_DOCUMENTATION.md)
- [Base de données](./backend/DATABASE_STRUCTURE.md)

## Licence

ISC
