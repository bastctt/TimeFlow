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

- **Manager**: manager1@timeflow.com / password123
- **Employé**: marketing1@timeflow.com / password123

## Installation Locale

```bash
# Backend
cd backend
npm install
cp .env.example .env
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

## Versioning et Releases

Ce projet utilise le **Semantic Versioning** (SemVer) et **Conventional Commits**.

### Créer une release

```bash
# Analyse les commits et crée automatiquement la version appropriée
bun run release

# Ou spécifiez le type de release
bun run release:patch   # 1.0.0 -> 1.0.1 (bug fixes)
bun run release:minor   # 1.0.0 -> 1.1.0 (nouvelles fonctionnalités)
bun run release:major   # 1.0.0 -> 2.0.0 (breaking changes)

# Pousser la release
git push --follow-tags origin main
```

### Format des commits

```bash
feat(scope): description      # Nouvelle fonctionnalité (MINOR)
fix(scope): description       # Correction de bug (PATCH)
feat(scope)!: description     # Breaking change (MAJOR)

# Exemples
git commit -m "feat(auth): add password reset"
git commit -m "fix(clock): correct timezone handling"
git commit -m "docs: update installation guide"
```

📖 Guide complet : [VERSIONING.md](./VERSIONING.md)

## Documentation

- [API](./API_DOCUMENTATION.md)
- [Base de données](./backend/DATABASE_STRUCTURE.md)
- [Environnements](./ENVIRONMENTS.md)
- [Versioning](./VERSIONING.md)
- [Testing & Coverage](./TESTING.md)
- [CHANGELOG](./CHANGELOG.md)

## Licence

MIT
