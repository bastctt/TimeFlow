# Changelog

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) et [Semantic Versioning](https://semver.org/lang/fr/).

## [1.0.0] - 2025-10-27

### ✨ Nouvelles fonctionnalités

**Backend**
- Authentification JWT + bcrypt
- CRUD utilisateurs, pointages, absences, équipes
- Rapports de temps travaillé
- Service email (MailHog)
- Réinitialisation mot de passe
- PostgreSQL + TypeScript

**Frontend**
- React 19 + Vite + shadcn/ui + Tailwind
- Dashboard par rôle (Employé/Manager)
- Pointage temps réel
- Calendrier absences
- Profil utilisateur
- Accessibilité WCAG 2.1 AA

**DevOps**
- Docker Compose multi-conteneurs
- GitHub Actions CI
- Tests Jest (89 tests, 36% coverage)
- Variables d'environnement

### 📝 Conventions de commit

Types : `feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `test`, `build`, `ci`, `chore`

Exemples :
```
feat(auth): add password reset
fix(clock): correct timezone
docs(readme): update install
```
