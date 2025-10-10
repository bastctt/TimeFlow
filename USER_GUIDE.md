# Guide Utilisateur

## Accès

**Local dev**: http://localhost:5173
**Docker**: http://localhost

## Comptes de Test

**Managers**:
-  / password123
-  / password123

**Employés**:
-  / password123
-  / password123

## Rôles

### Manager
**Permissions**: Gestion d'équipes, vue planning équipe, CRUD utilisateurs
**Pages**: Dashboard, Mon équipe, Planning, Mon profil

### Employé
**Permissions**: Vue personnelle, planning perso
**Pages**: Dashboard, Mon planning, Mon profil

## Fonctionnalités

### Connexion
1. Email + mot de passe → **Se connecter**
2. Session valide 24h

### Inscription
1. Email, mot de passe (6+ chars), prénom, nom, rôle
2. **S'inscrire** → Redirection dashboard

### Dashboard
- Résumé activité
- Statistiques personnalisées par rôle

### Mon équipe (Manager)
**Créer équipe**: Nom + description
**Modifier**: Cliquer sur équipe → éditer
**Supprimer**: Bouton supprimer (confirmation)
**Gérer membres**: Ajouter/retirer employés

### Planning
**Manager**: Planning hebdomadaire de l'équipe
**Employé**: Planning personnel
**Navigation**: ← Semaine précédente | Aujourd'hui | Semaine suivante →

### Profil
- Modifier: email, prénom, nom
- **Enregistrer** pour sauvegarder

### Déconnexion
Cliquer icône profil → **Se déconnecter**

## Navigation

Sidebar gauche:
- **Dashboard** 📊
- **Mon équipe** / **Pointage** (selon rôle)
- **Planning**
- **Mon profil** 👤
- **Se déconnecter** 🚪

## Troubleshooting

**Erreur connexion**: Vérifier email/mot de passe
**Session expirée**: Se reconnecter (token 24h)
**403 Forbidden**: Fonction réservée aux Managers
**Page blanche**: F5 ou vider cache navigateur
