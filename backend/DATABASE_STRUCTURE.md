# Structure de la Base de Données - Time Manager

## Tables

### 1. `users` - Table des Utilisateurs

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identifiant unique de l'utilisateur |
| `email` | VARCHAR(255) | UNIQUE NOT NULL | Email de l'utilisateur |
| `password_hash` | VARCHAR(255) | NOT NULL | Mot de passe hashé (bcrypt) |
| `first_name` | VARCHAR(100) | NOT NULL | Prénom |
| `last_name` | VARCHAR(100) | NOT NULL | Nom de famille |
| `role` | VARCHAR(50) | NOT NULL, CHECK IN ('Manager', 'Employé') | Rôle de l'utilisateur |
| `team_id` | INTEGER | FOREIGN KEY → teams(id), ON DELETE SET NULL | Équipe à laquelle l'utilisateur appartient |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Date de dernière modification |

**Index :**
- `idx_users_email` sur `email`
- `idx_users_team` sur `team_id`

---

### 2. `teams` - Table des Équipes

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identifiant unique de l'équipe |
| `name` | VARCHAR(255) | NOT NULL | Nom de l'équipe |
| `description` | TEXT | NULL | Description de l'équipe |
| `manager_id` | INTEGER | FOREIGN KEY → users(id), ON DELETE SET NULL | Manager responsable de l'équipe |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Date de dernière modification |

**Index :**
- `idx_teams_manager` sur `manager_id`

---

## Relations

### Relation Circulaire : Users ↔ Teams

```
┌─────────┐                    ┌─────────┐
│  users  │                    │  teams  │
├─────────┤                    ├─────────┤
│ id      │◄───────────────────│ manager_id (FK)
│ team_id │────────────────────►│ id      │
└─────────┘                    └─────────┘
```

**Explications :**

1. **`users.team_id` → `teams.id`**
   - Un utilisateur appartient à **une seule équipe** (ou aucune si NULL)
   - Relation : Many-to-One (Plusieurs users → 1 team)
   - Suppression : Si une équipe est supprimée, `team_id` des users devient NULL

2. **`teams.manager_id` → `users.id`**
   - Une équipe a **un seul manager**
   - Relation : One-to-One (1 team → 1 manager user)
   - Suppression : Si le manager est supprimé, `manager_id` devient NULL

### Important : Le Manager fait partie de son équipe

Dans la configuration actuelle :
- Le manager d'une équipe **doit aussi avoir `team_id` pointant vers cette équipe**
- Exemple : Alice (id=1) est manager de l'équipe Dev (id=1)
  - `teams[1].manager_id = 1` (Alice est le manager)
  - `users[1].team_id = 1` (Alice fait partie de l'équipe Dev)

---

## Données Exemples

### Managers
| id | email | first_name | last_name | role | team_id |
|----|-------|------------|-----------|------|---------|
| 1 | manager1@timemanager.com | Alice | Dubois | Manager | 1 |
| 2 | manager2@timemanager.com | Marc | Martin | Manager | 2 |
| 3 | manager3@timemanager.com | Sophie | Bernard | Manager | 3 |

### Teams
| id | name | description | manager_id |
|----|------|-------------|------------|
| 1 | Équipe Développement | Équipe en charge du développement des applications | 1 |
| 2 | Équipe Marketing | Équipe en charge des campagnes marketing | 2 |
| 3 | Équipe Support | Équipe en charge du support client | 3 |

### Employés
| id | email | first_name | last_name | role | team_id |
|----|-------|------------|-----------|------|---------|
| 4 | dev1@timemanager.com | Jean | Dupont | Employé | 1 |
| 5 | dev2@timemanager.com | Marie | Leroy | Employé | 1 |
| 6 | dev3@timemanager.com | Pierre | Moreau | Employé | 1 |
| 7 | marketing1@timemanager.com | Julie | Petit | Employé | 2 |
| 8 | marketing2@timemanager.com | Thomas | Roux | Employé | 2 |
| 9 | support1@timemanager.com | Emma | Simon | Employé | 3 |
| 10 | support2@timemanager.com | Lucas | Laurent | Employé | 3 |
| 11 | support3@timemanager.com | Chloé | Michel | Employé | 3 |

---

## Problème Identifié : Planning Page

### Issue
La page Planning recherche l'équipe du manager avec :
```typescript
const managerTeam = teams.find(team => team.manager_id === user?.id);
```

**Cela fonctionne correctement** si :
1. Le manager existe dans la base de données
2. Une équipe a `manager_id` pointant vers ce manager
3. Le manager a son `team_id` pointant vers cette équipe

### Cas où ça ne fonctionne pas
- Si vous vous connectez avec un compte qui n'est **pas** `manager1`, `manager2`, ou `manager3`
- Si vous avez créé un nouveau compte Manager mais sans équipe associée
- Si la base de données n'a pas été initialisée avec `init.sql`

### Solution
La logique actuelle est correcte. Le problème vient probablement de :
1. Base de données non initialisée
2. Connexion avec un mauvais compte
3. Backend Docker pas démarré (utilisation du backend local avec base vide)
