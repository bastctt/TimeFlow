# Configuration Email pour le Reset de Mot de Passe

Ce guide explique comment configurer le service email pour le système de réinitialisation de mot de passe.

## 📧 Fonctionnalités Email

Le système d'email gère automatiquement :

1. **Email de bienvenue** : Envoyé automatiquement lors de la création d'un nouveau compte employé par un manager
2. **Reset de mot de passe** : Demandé par l'utilisateur via "Mot de passe oublié"

Les deux emails contiennent un lien sécurisé avec un token unique valide 24h.

---

## 🔧 Configuration

### Mode Développement (par défaut)

En développement, le système utilise **Ethereal Email** (service de test d'emails).

**Aucune configuration requise !** Les emails ne sont pas réellement envoyés, mais vous pouvez les visualiser via un lien de preview dans la console backend.

**Logs console backend :**
```bash
📧 Email service running in TEST mode (Ethereal)
📧 Welcome email sent!
Preview URL: https://ethereal.email/message/abc123...
```

Cliquez sur le lien "Preview URL" pour voir l'email dans votre navigateur.

---

### Mode Production

Pour envoyer de vrais emails en production, configurez un serveur SMTP.

#### Option 1 : Gmail (Gratuit, 500 emails/jour)

1. **Activer l'authentification à deux facteurs sur Gmail**
2. **Générer un mot de passe d'application** :
   - Allez dans https://myaccount.google.com/apppasswords
   - Créez un nouveau mot de passe d'application pour "Autre (nom personnalisé)"
   - Copiez le mot de passe généré (16 caractères)

3. **Configurer `.env` backend** :
```env
NODE_ENV=production
EMAIL_FROM=votre-email@gmail.com
APP_URL=https://votre-domaine.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-dapplication
```

#### Option 2 : SendGrid (Gratuit, 100 emails/jour)

1. **Créer un compte SendGrid** : https://sendgrid.com/
2. **Générer une API Key** :
   - Settings → API Keys → Create API Key
   - Copier la clé générée

3. **Configurer `.env` backend** :
```env
NODE_ENV=production
EMAIL_FROM=noreply@votre-domaine.com
APP_URL=https://votre-domaine.com

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=votre-sendgrid-api-key
```

#### Option 3 : Autres serveurs SMTP

N'importe quel serveur SMTP compatible fonctionne (Mailgun, AWS SES, Postmark, etc.) :

```env
NODE_ENV=production
EMAIL_FROM=noreply@votre-domaine.com
APP_URL=https://votre-domaine.com

SMTP_HOST=votre-smtp-host.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-username
SMTP_PASS=votre-password
```

---

## 🔒 Sécurité

Le système de reset de mot de passe est sécurisé :

- **Tokens aléatoires** : Générés avec `crypto.randomBytes(32)` (64 caractères hex)
- **Hash en base de données** : Les tokens sont hashés (SHA-256) avant stockage
- **Expiration 24h** : Les tokens expirent automatiquement
- **Usage unique** : Un token ne peut être utilisé qu'une seule fois
- **Anti-énumération** : Le système ne révèle jamais si un email existe ou non

---

## 🧪 Tester en Développement

### 1. Créer un employé (en tant que Manager)

Connectez-vous en tant que manager et créez un nouvel employé :

```
Email: test@example.com
First Name: John
Last Name: Doe
Password: password123
```

Un email de bienvenue sera "envoyé" (visible via Ethereal).

### 2. Tester le reset de mot de passe

1. Allez sur `/login`
2. Cliquez sur "Mot de passe oublié ?"
3. Entrez l'email d'un utilisateur existant
4. Vérifiez la console backend pour le lien de preview
5. Cliquez sur "Réinitialiser mon mot de passe" dans l'email
6. Définissez un nouveau mot de passe

---

## 📊 Templates Email

Les emails utilisent des templates HTML responsifs avec :

- Design moderne avec gradient violet/indigo
- Bouton CTA principal
- Lien de secours (copier-coller)
- Instructions claires en français
- Footer branding TimeFlow

**Templates dans** : `backend/src/services/email.service.ts`

---

## 🛠️ Dépannage

### Les emails ne sont pas envoyés

1. **Vérifiez les logs backend** : Le service email log tous les envois et erreurs
2. **Vérifiez NODE_ENV** : En développement, utilisez Ethereal (pas besoin de SMTP)
3. **Vérifiez les credentials SMTP** : Testez avec un client SMTP externe
4. **Vérifiez les ports** : Port 587 (TLS) ou 465 (SSL) selon votre serveur

### Les liens de reset ne fonctionnent pas

1. **Vérifiez APP_URL** : Doit correspondre à l'URL frontend réelle
2. **Vérifiez que la DB contient la table** : `password_reset_tokens`
3. **Vérifiez l'expiration** : Les tokens expirent après 24h

### Erreur "Token invalide ou expiré"

- Le token a été utilisé
- Le token a expiré (>24h)
- Le token n'existe pas en base
- L'utilisateur a été supprimé

---

## 📝 Endpoints API

### POST `/api/auth/request-reset`

Demande un reset de mot de passe.

**Body :**
```json
{
  "email": "user@example.com"
}
```

**Response :**
```json
{
  "message": "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."
}
```

### POST `/api/auth/verify-reset-token`

Vérifie la validité d'un token.

**Body :**
```json
{
  "token": "abc123..."
}
```

**Response :**
```json
{
  "valid": true,
  "email": "user@example.com",
  "first_name": "John"
}
```

### POST `/api/auth/reset-password`

Réinitialise le mot de passe avec un token valide.

**Body :**
```json
{
  "token": "abc123...",
  "password": "newpassword123"
}
```

**Response :**
```json
{
  "message": "Mot de passe réinitialisé avec succès",
  "token": "jwt-token-for-auto-login"
}
```

---

## ✅ Checklist Déploiement

Avant de déployer en production :

- [ ] Configurer un vrai serveur SMTP (Gmail, SendGrid, etc.)
- [ ] Mettre à jour `NODE_ENV=production`
- [ ] Configurer `APP_URL` avec votre domaine réel
- [ ] Configurer `EMAIL_FROM` avec un email professionnel
- [ ] Tester l'envoi d'un email réel
- [ ] Vérifier que les liens de reset pointent vers le bon domaine
- [ ] Mettre en place un monitoring des erreurs email
- [ ] Documenter les credentials SMTP de manière sécurisée

---

## 🔄 Maintenance

### Nettoyer les tokens expirés

Les tokens expirés peuvent être nettoyés automatiquement :

```typescript
// Dans backend/src/models/PasswordResetToken.model.ts
await PasswordResetTokenModel.cleanupExpired();
```

Envisagez de créer un cron job pour exécuter cette commande quotidiennement.

---

## 📚 Ressources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid Guides](https://docs.sendgrid.com/)
- [Ethereal Email (Testing)](https://ethereal.email/)

---

**Besoin d'aide ?** Consultez les logs backend ou contactez l'équipe de développement.
