# Versioning - TimeFlow

## Quick Start

```bash
# Créer une release automatique
bun run release

# Pousser la release
git push --follow-tags origin main
```

## Semantic Versioning

Format : `MAJOR.MINOR.PATCH` (ex: 1.2.3)

- **MAJOR** : Breaking changes
- **MINOR** : Nouvelles fonctionnalités
- **PATCH** : Bug fixes

## Format des commits

```bash
feat(scope): description    # MINOR bump
fix(scope): description     # PATCH bump
feat(scope)!: description   # MAJOR bump (breaking change)
docs/style/test/chore:      # Pas de bump
```

**Exemples** :
```bash
feat(auth): add password reset
fix(clock): correct timezone handling
feat(api)!: change authentication

BREAKING CHANGE: JWT expires after 24h
```

## Commandes

```bash
bun run release              # Auto (analyse commits)
bun run release:patch        # 1.0.0 -> 1.0.1
bun run release:minor        # 1.0.0 -> 1.1.0
bun run release:major        # 1.0.0 -> 2.0.0
bun run release:first        # Première release (1.0.0)
```

## Ce qui se passe automatiquement

1. Analyse des commits
2. Bump de version dans `package.json`
3. Mise à jour de `CHANGELOG.md`
4. Commit : `chore(release): x.y.z`
5. Tag Git : `vx.y.z`

## Scopes suggérés

**Backend** : `auth`, `api`, `db`, `email`, `clock`, `absence`, `user`, `report`
**Frontend** : `ui`, `dashboard`, `profile`, `schedule`, `team`, `accessibility`
**Global** : `deps`, `docker`, `config`

## Liens

- [Semantic Versioning](https://semver.org/lang/fr/)
- [Conventional Commits](https://www.conventionalcommits.org/fr/)
- [Guide détaillé](../.github/COMMIT_CONVENTION.md)
