# GitHub Actions Secrets Configuration

Ce projet utilise GitHub Actions pour le CI/CD. Vous devez configurer les secrets suivants dans votre dépôt GitHub.

## Comment ajouter des secrets

1. Allez dans votre dépôt GitHub
2. Cliquez sur `Settings` > `Secrets and variables` > `Actions`
3. Cliquez sur `New repository secret`
4. Ajoutez chaque secret ci-dessous

## Secrets requis

### Database Configuration

- **`DB_USER`**
  - Description : Nom d'utilisateur PostgreSQL
  - Valeur recommandée : `dev`

- **`DB_PASSWORD`**
  - Description : Mot de passe PostgreSQL
  - Valeur recommandée : `user`

- **`DB_NAME`**
  - Description : Nom de la base de données
  - Valeur recommandée : `timemanager`

- **`DB_PORT`**
  - Description : Port PostgreSQL
  - Valeur recommandée : `5432`

### Application Configuration

- **`JWT_SECRET`**
  - Description : Clé secrète pour JWT
  - Valeur recommandée : Générez une chaîne aléatoire forte (minimum 32 caractères)
  - Exemple : `your-super-secret-jwt-key-change-this-in-production`

- **`VITE_API_URL`**
  - Description : URL de l'API pour le frontend
  - Valeur recommandée : `http://localhost:3000`

## Notes importantes

- ⚠️ **Ne commitez JAMAIS ces valeurs dans le code**
- 🔒 Les secrets GitHub sont chiffrés et ne sont visibles que pendant l'exécution des workflows
- 🔄 Changez les secrets en production (surtout `JWT_SECRET` et `DB_PASSWORD`)
- ✅ Pour le CI, vous pouvez utiliser les valeurs de développement

## Vérification

Une fois les secrets configurés, le workflow CI s'exécutera automatiquement sur :
- Push sur `main` ou `develop`
- Pull requests vers `main` ou `develop`

Le workflow effectuera :
- Backend : Build + Tests avec PostgreSQL
- Frontend : Build + Lint + Tests
