# Testing & Coverage

## Quick Start

```bash
npm test                    # Run tests
npm run test:coverage       # Tests + coverage report
npm run coverage:report     # Open HTML report
```

## Coverage actuel

```
Lines:       35.79%  (seuil: 30%)
Statements:  36.09%  (seuil: 30%)
Functions:   30.20%  (seuil: 25%)
Branches:    34.81%  (seuil: 30%)

✅ 89 tests | 7 suites | 0 failures
```

## Commandes

```bash
npm test                     # Tests uniquement
npm run test:watch           # Mode watch
npm run test:coverage        # Tests + coverage
npm run test:ci              # Pour CI (optimisé)
npm run coverage:report      # Ouvrir rapport HTML
```

## Écrire un test

```typescript
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../index';

describe('Feature', () => {
  it('should do something', async () => {
    // Arrange
    const data = { foo: 'bar' };

    // Act
    const response = await request(app)
      .post('/api/endpoint')
      .send(data);

    // Assert
    expect(response.status).toBe(200);
  });
});
```

## Bonnes pratiques

- ✅ Un test = un comportement
- ✅ Noms descriptifs (`should return 401 when token invalid`)
- ✅ Pattern AAA (Arrange, Act, Assert)
- ✅ Tests isolés et indépendants
- ✅ Mock des dépendances externes

## Quality Gates (CI)

La CI exécute automatiquement :
1. Tests avec coverage
2. Upload Codecov
3. Génération artifacts (30j)
4. Summary dans PR

## Fichiers prioritaires à tester

| Fichier | Coverage | Priorité |
|---------|----------|----------|
| `config/database.ts` | 0% | 🔴 |
| `models/User.model.ts` | 0% | 🔴 |
| `routes/absences.ts` | 8.58% | 🟠 |
| `services/email.service.ts` | 37.93% | 🟡 |

## Rapports générés

```
backend/coverage/
├── lcov-report/index.html  # Interactif
├── lcov.info               # Codecov
└── coverage-summary.json   # Badges
```

## Objectif : 70% coverage
