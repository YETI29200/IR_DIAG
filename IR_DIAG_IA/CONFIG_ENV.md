# Guide de configuration du fichier .env

## Étape 1 : Créer le fichier .env

À la racine du projet (même niveau que `package.json`), créez un fichier nommé `.env`

### Sur Windows (PowerShell) :
```powershell
# Depuis la racine du projet
New-Item -Path .env -ItemType File
```

### Sur Windows (CMD) :
```cmd
type nul > .env
```

### Sur Mac/Linux :
```bash
touch .env
```

## Étape 2 : Copier le contenu de l'exemple

Ouvrez le fichier `ENV.example` et copiez tout son contenu dans votre nouveau fichier `.env`

## Étape 3 : Remplir les valeurs

Voici un exemple complet avec des valeurs à remplacer :

```env
# Configuration Exchange SMTP
EXCHANGE_HOST=smtp.office365.com
EXCHANGE_PORT=587
EXCHANGE_USER=votre-email@votre-domaine.com
EXCHANGE_PASSWORD=votre-mot-de-passe-ou-app-password
EXCHANGE_FROM_EMAIL=votre-email@votre-domaine.com
EXCHANGE_SECURE=false

# Secret de session (générez une chaîne aléatoire de 32+ caractères)
SESSION_SECRET=changez-moi-en-production-avec-une-chaine-aleatoire-securisee

# Port du serveur (optionnel, défaut: 3000)
PORT=3000

# Chemin de la base de données (optionnel, défaut: ./data/diagnostic.db)
DB_PATH=./data/diagnostic.db
```

## Exemple concret

Si votre email est `jean.dupont@images-reseaux.fr`, voici un exemple :

```env
# Configuration Exchange SMTP
EXCHANGE_HOST=smtp.office365.com
EXCHANGE_PORT=587
EXCHANGE_USER=jean.dupont@images-reseaux.fr
EXCHANGE_PASSWORD=MonMotDePasse123!
EXCHANGE_FROM_EMAIL=jean.dupont@images-reseaux.fr
EXCHANGE_SECURE=false

# Secret de session
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# Port du serveur
PORT=3000
```

## Détails des variables

### EXCHANGE_HOST
- **Office 365 / Microsoft 365** : `smtp.office365.com`
- **Exchange Server (on-premise)** : L'adresse de votre serveur Exchange
- **Exemple** : `smtp.office365.com` ou `mail.votre-domaine.com`

### EXCHANGE_PORT
- **587** : STARTTLS (recommandé pour Office 365)
- **465** : SSL direct
- **25** : Non sécurisé (non recommandé)

### EXCHANGE_USER
- Votre adresse email complète
- **Format** : `nom@domaine.com`
- **Exemple** : `jean.dupont@images-reseaux.fr`

### EXCHANGE_PASSWORD
- Votre mot de passe habituel (si pas de 2FA)
- **OU** un mot de passe d'application (si 2FA activé)
- ⚠️ **Important** : Si vous avez l'authentification à deux facteurs, vous DEVEZ créer un mot de passe d'application

### EXCHANGE_FROM_EMAIL
- L'adresse email qui apparaîtra comme expéditeur
- Généralement identique à `EXCHANGE_USER`
- Peut être un alias si autorisé

### EXCHANGE_SECURE
- `false` : Utilise STARTTLS (port 587) - **Recommandé**
- `true` : Utilise SSL direct (port 465)

### SESSION_SECRET
- Chaîne aléatoire de 32 caractères minimum
- Utilisé pour signer les tokens de session
- **Générez-en une aléatoire** pour la production
- Exemple de génération :
  ```bash
  # Sur Linux/Mac
  openssl rand -hex 32
  
  # Sur Windows PowerShell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
  ```

## Si vous avez l'authentification à deux facteurs (2FA)

1. Allez sur https://account.microsoft.com/security
2. Connectez-vous
3. Allez dans "Sécurité" → "Mots de passe d'application"
4. Créez un nouveau mot de passe d'application
5. **Utilisez ce mot de passe** dans `EXCHANGE_PASSWORD` (pas votre mot de passe principal)

## Vérification

1. Sauvegardez le fichier `.env`
2. Redémarrez le serveur : `npm run dev`
3. Vérifiez dans les logs qu'il n'y a pas d'erreur de chargement
4. Testez l'envoi d'un email

## Sécurité importante

⚠️ **NE COMMITEZ JAMAIS LE FICHIER .env DANS GIT**

Le fichier `.env` est déjà dans `.gitignore`, mais vérifiez qu'il n'est pas suivi :
```bash
git status
# Le fichier .env ne doit PAS apparaître dans la liste
```

## Dépannage

### Le serveur ne charge pas les variables
- Vérifiez que le fichier s'appelle bien `.env` (avec le point au début)
- Vérifiez qu'il est à la racine du projet
- Redémarrez le serveur après modification

### Erreur "EXCHANGE_USER and EXCHANGE_PASSWORD must be configured"
- Vérifiez que les variables sont bien définies dans `.env`
- Vérifiez qu'il n'y a pas d'espaces autour du `=`
- Vérifiez qu'il n'y a pas de guillemets inutiles

### Erreur de connexion SMTP
- Vérifiez `EXCHANGE_HOST` et `EXCHANGE_PORT`
- Vérifiez votre connexion internet
- Vérifiez que le pare-feu autorise la connexion

