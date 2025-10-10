# Guide de Contribution

## Git Flow

**Branches**:
- `main` → Production (protégée)
- `develop` → Intégration (défaut)
- `feature/*`, `bugfix/*`, `hotfix/*` → Développement

**Workflow**:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/ma-feature
# Développer...
git commit -m "feat: description"
git push origin feature/ma-feature
# Créer PR sur GitHub: feature/* → develop
```

## Commits (Conventional Commits)

**Format**: `<type>: <description>`

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `security`, `perf`

**Exemples**:
```bash
feat: ajouter authentification OAuth
fix: corriger suppression membre équipe
security: implémenter rate limiting
```

## Pull Requests

**Requis avant merge**:
- ✅ CI/CD verte (build + tests passent)
- ✅ 1-2 code reviews approuvées
- ✅ Pas de conflits avec branche cible
- ✅ Commits suivent la norme

## Tests

```bash
# Backend
cd backend
npm test
npm test -- --coverage

# Frontend
cd frontend
npm run lint
```

## Branch Protection

**À configurer sur GitHub** (Settings → Branches):

**`main`**:
- Require PR + 2 approvals
- Require status checks: Backend Build, Backend Tests, Frontend Build
- No force push, no delete

**`develop`**:
- Require PR + 1 approval
- Require status checks: Backend Build, Backend Tests
- No force push

## CI/CD

Pipeline automatique sur push/PR (`main`, `develop`):
- Backend: Build + Tests + Coverage
- Frontend: Build + Lint
- Docker: Build test

Logs dans GitHub Actions.
