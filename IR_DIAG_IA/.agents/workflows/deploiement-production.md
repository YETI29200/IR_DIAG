---
description: Déploiement de IR-DIAG-IA sur serveur de production
---

## Pré-requis sur le serveur cible

- Windows Server (ou Linux) avec accès réseau au serveur Exchange
- Node.js v18+ installé
- Python 3.10+ installé
- npm 9+ installé
- Git installé (optionnel mais recommandé)
- Accès au port d'entrée souhaité (ex: 80, 443 ou 3000/5173)

## Étape 1 — Copier les fichiers sur le serveur

// turbo
Transférer l'ensemble du projet vers le répertoire cible sur le serveur (ex: `C:\Apps\IR_DIAG_IA` ou `/opt/ir-diag-ia`). Utiliser SCP, FTP, ou une copie réseau.

## Étape 2 — Installer les dépendances Node.js

// turbo

```
npm install
```

## Étape 3 — Installer les dépendances Python

// turbo

```
pip install playwright matplotlib numpy
```

## Étape 4 — Installer le navigateur Playwright (pour la génération PDF)

// turbo

```
python -m playwright install chromium
```

## Étape 5 — Créer et configurer le fichier .env

Copier `.env.example` en `.env` puis éditer les valeurs :

```
# Serveur Exchange
EXCHANGE_HOST=exchange.images-et-reseaux.com
EXCHANGE_PORT=25
EXCHANGE_FROM_EMAIL=diag@images-et-reseaux.com

# URL publique de l'application (OBLIGATOIRE en production)
# C'est cette URL qui sera incluse dans les emails aux participants
BASE_URL=https://diag.images-et-reseaux.com
# ou si pas de domaine : BASE_URL=http://IP_DU_SERVEUR:5173

# Sécurité
SESSION_SECRET=<chaîne aléatoire longue et sécurisée, min 32 caractères>

# Base de données
DB_PATH=./data/diagnostic.db

# API Gemini (pour les recommandations IA)
GEMINI_API_KEY=<clé API Gemini>
GEMINI_MODEL=gemini-2.0-flash

# Port du serveur API
PORT=3000
```

> ⚠️ Ne jamais versionner le fichier `.env` en production.

## Étape 6 — Initialiser la base de données

// turbo

```
npm run db:migrate
```

Si la commande n'existe pas, lancer directement :

```
node server/db/migrate.js
```

## Étape 7 — Créer le compte administrateur

// turbo

```
node server/db/create-admins.js
```

Ou utiliser le script dédié si disponible pour définir le premier compte admin.

## Étape 8 — Builder le client (interface web)

// turbo

```
npm run build
```

Cela génère le dossier `dist/` contenant l'interface web optimisée pour la production.

## Étape 9 — Tester le démarrage en mode production

```
npm run start
```

Ou si le script n'existe pas :

```
node server/index.js
```

Vérifier que :

- Le serveur répond sur `http://IP_SERVEUR:3000/api/health`
- L'interface est accessible sur `http://IP_SERVEUR:5173` (ou le port configuré)

## Étape 10 — Tester l'envoi email

// turbo

```
node test-smtp-quick.js
```

Vérifier que le résultat affiche `success: true` et `status: 'sent'`.

## Étape 11 — Configurer le démarrage automatique (Windows)

Utiliser le Planificateur de tâches Windows ou NSSM pour démarrer le serveur automatiquement au démarrage :

```
# Installer NSSM (Non-Sucking Service Manager)
# Puis créer le service :
nssm install IR-DIAG-IA "node" "C:\Apps\IR_DIAG_IA\server\index.js"
nssm set IR-DIAG-IA AppDirectory "C:\Apps\IR_DIAG_IA"
nssm start IR-DIAG-IA
```

## Étape 12 — (Optionnel) Configurer un reverse proxy

Si un domaine est configuré (ex: `diag.images-et-reseaux.com`), mettre en place un reverse proxy IIS ou Nginx qui redirige le port 80/443 vers le port 3000/5173 de l'application.

Exemple IIS ARR : proxy `diag.images-et-reseaux.com` → `http://localhost:3000`

## Vérifications finales

- [ ] L'interface web s'ouvre correctement depuis un navigateur externe
- [ ] La connexion administrateur fonctionne
- [ ] L'envoi d'un email de test est validé (`test-smtp-quick.js`)
- [ ] La génération d'un PDF Flash Diag fonctionne depuis l'interface admin
- [ ] Un questionnaire peut être rempli via un lien du type `http://IP_SERVEUR:5173/questionnaire/full/1?service=XXX`
- [ ] Les résultats et recommandations s'affichent correctement
