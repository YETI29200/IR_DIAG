# Configuration Microsoft Exchange pour l'envoi d'emails

## Vue d'ensemble

Par défaut, l'application simule l'envoi d'emails (stockage en base de données uniquement). Vous pouvez optionnellement configurer Microsoft Exchange pour envoyer de vrais emails via SMTP.

## Étape 1 : Obtenir les informations SMTP Exchange

### Pour Office 365 / Microsoft 365

- **Serveur SMTP** : `smtp.office365.com`
- **Port** : `587` (STARTTLS) ou `465` (SSL)
- **Authentification** : Oui (nom d'utilisateur et mot de passe)

### Pour Exchange Server (on-premise)

- **Serveur SMTP** : Votre serveur Exchange (ex: `mail.votre-domaine.com`)
- **Port** : `587` (STARTTLS) ou `465` (SSL)
- **Authentification** : Oui

## Étape 2 : Créer un mot de passe d'application (Office 365)

Si vous utilisez l'authentification à deux facteurs (2FA), vous devez créer un mot de passe d'application :

1. Allez sur <https://account.microsoft.com/security>
2. Connectez-vous avec votre compte Microsoft
3. Allez dans "Sécurité" → "Mots de passe d'application"
4. Créez un nouveau mot de passe d'application
5. **Copiez le mot de passe** (vous ne pourrez plus le voir après)

⚠️ **Important** : Utilisez ce mot de passe d'application, pas votre mot de passe principal.

## Étape 3 : Configurer les variables d'environnement

1. Créez un fichier `.env` à la racine du projet
2. Copiez le contenu de `ENV.example` dans `.env`
3. Remplissez les valeurs :

```env
# Configuration Exchange SMTP
EXCHANGE_HOST=smtp.office365.com
EXCHANGE_PORT=587
EXCHANGE_USER=votre-email@votre-domaine.com
EXCHANGE_PASSWORD=votre-mot-de-passe-ou-app-password
EXCHANGE_FROM_EMAIL=votre-email@votre-domaine.com
EXCHANGE_SECURE=false

# Secret de session
SESSION_SECRET=votre-secret-session-securise-min-32-caracteres

# Port du serveur (optionnel, défaut: 3000)
PORT=3000
```

### Paramètres détaillés

- **EXCHANGE_HOST** : Adresse du serveur SMTP
  - Office 365 : `smtp.office365.com`
  - Exchange on-premise : Votre serveur Exchange

- **EXCHANGE_PORT** : Port SMTP
  - `587` : STARTTLS (recommandé)
  - `465` : SSL/TLS direct

- **EXCHANGE_USER** : Votre adresse email complète
  - Format : `nom@domaine.com`

- **EXCHANGE_PASSWORD** :
  - Sans 2FA : Votre mot de passe
  - Avec 2FA : Mot de passe d'application (voir étape 2)

- **EXCHANGE_FROM_EMAIL** : Adresse email expéditrice
  - Doit correspondre à EXCHANGE_USER ou être un alias autorisé

- **EXCHANGE_SECURE** :
  - `false` : Utilise STARTTLS (port 587)
  - `true` : Utilise SSL direct (port 465)

## Étape 4 : Vérification

1. Démarrez le serveur : `npm run dev`
2. Vérifiez dans les logs que Exchange est configuré
3. Testez l'envoi d'un email depuis l'interface
4. Vérifiez votre boîte de réception

## Statuts des emails

- `simulated_sent` : Email simulé (Exchange non configuré)
- `sent` : Email envoyé avec succès via Exchange
- `failed` : Échec d'envoi via Exchange (fallback en simulation)

## Dépannage

### Erreur "EXCHANGE_USER and EXCHANGE_PASSWORD must be configured"

- Vérifiez que le fichier `.env` existe
- Vérifiez que `EXCHANGE_USER` et `EXCHANGE_PASSWORD` sont définis
- Redémarrez le serveur après modification de `.env`

### Erreur "SMTP connection error"

- Vérifiez que `EXCHANGE_HOST` et `EXCHANGE_PORT` sont corrects
- Vérifiez votre connexion réseau
- Vérifiez que le pare-feu autorise la connexion SMTP

### Erreur "AUTH LOGIN failed" ou "Password authentication failed"

- Vérifiez que `EXCHANGE_USER` et `EXCHANGE_PASSWORD` sont corrects
- Si vous avez 2FA activé, utilisez un mot de passe d'application
- Vérifiez que l'authentification SMTP est activée sur votre compte

### Erreur "MAIL FROM failed"

- Vérifiez que `EXCHANGE_FROM_EMAIL` correspond à votre compte
- Vérifiez que vous avez les permissions d'envoi

### Emails non reçus

- Vérifiez le dossier spam
- Vérifiez les logs du serveur pour les erreurs
- Vérifiez que l'adresse destinataire est valide

### Problèmes de certificat SSL

- Le code accepte les certificats auto-signés (`rejectUnauthorized: false`)
- Pour la production, configurez correctement les certificats

## Sécurité

⚠️ **Important** :

- Ne commitez JAMAIS le fichier `.env` dans Git
- Le fichier `.env` est déjà dans `.gitignore`
- Utilisez des mots de passe d'application plutôt que votre mot de passe principal
- Changez `SESSION_SECRET` en production
- En production, configurez correctement les certificats SSL

## Limites Exchange

- **Office 365** : Limites d'envoi selon votre plan
  - Plan gratuit : 300 emails/jour
  - Plan payant : Jusqu'à 10 000 emails/jour
- **Exchange on-premise** : Selon votre configuration serveur

## Alternative : Utiliser un compte de test

Pour les tests, vous pouvez créer un compte Office 365 de test gratuit :

1. Créez un compte Microsoft 365 Business Basic (essai gratuit)
2. Configurez les variables d'environnement avec ce compte
3. Testez l'envoi d'emails
