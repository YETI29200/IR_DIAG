# Dossier d'Architecture et Pré-requis Techniques (Pour la DSI)

## 1. Présentation de l'Application (IR_DIAG_IA)
L'application est une plateforme de diagnostic de maturité IA. Elle se compose :
- D'un **portail d'administration** pour les consultants (création de missions, suivi, génération de rapports).
- D'une **interface publique** pour les répondants aux questionnaires (ex: "Flash Diag").

**Stack Technique :**
- **Backend / Serveur Web** : Node.js (Version 18 ou supérieure recommandée). Ne nécessite pas de framework lourd.
- **Frontend** : Vue.js 3 (compilé en fichiers statiques HTML/JS/CSS). Les fichiers compilés sont servis nativement par le backend Node.js.
- **Base de données** : SQLite 3 (fichier local auto-contenu, pas d'installation de serveur SGBD tiers nécessaire).

---

## 2. Pré-requis Serveur (Sizing recommandé)
L'application est très légère et peu gourmande en ressources :
- **OS** : Windows Server (2016+) ou Linux (Ubuntu/Debian/RHEL).
- **vCPU** : 2 coeurs minimum.
- **RAM** : 4 Go minimum.
- **Stockage** : 20 Go (L'application elle-même pèse moins de 500Mo, prévoir de l'espace pour les sauvegardes de la base SQLite et la génération occasionnelle de PDF temporaires).

*Outils à installer sur le serveur :*
- Node.js (v18.x ou v20.x LTS)
- NPM (inclus avec Node)
- PM2 (Gestionnaire de processus Node.js, installable via `npm install -g pm2`)

---

## 3. Flux Réseau & Sécurité (Règles Firewall)

### A. Flux entrants (Inbound)
Pour répondre à la contrainte : *"Les collaborateurs communiquent en VPN mais le flash diag est accessible librement"*, il faut exposer l'application sur le web de manière sécurisée.
- **Port 443 (HTTPS)** / **Port 80 (HTTP)** : Depuis Internet (pour le Flash Diag) et depuis le VPN (pour les collaborateurs). 
- *Recommandation d'architecture* : Ne pas exposer Node.js directement. Utiliser un **Reverse Proxy** (ex: Nginx, Apache, ou IIS avec ARR/URL Rewrite) configuré avec un certificat SSL/TLS valide. Le Reverse Proxy redirigera le trafic vers le port local de l'application Node.js (par défaut `3000`).

*(Note Sécurité : L'accès à l'espace administration est protégé au niveau applicatif par un système de login/mot de passe avec tokens JWT. Si la DSI souhaite restreindre l'accès à la page de connexion de l'administration `https://domaine.com/admin` uniquement aux adresses IP du VPN, cela peut être configuré au niveau du Reverse Proxy).*

### B. Flux sortants (Outbound)
Le serveur Node.js aura besoin des accès sortants suivants :
- **Serveur mail Exchange interne** : Autoriser le trafic sortant vers votre serveur Exchange sur le port approprié (`25`, `587` pour STARTTLS, ou `465` pour SSL) afin que l'application puisse envoyer les liens de diagnostic et les rapports.
- **API d'Intelligence Artificielle (Extérieur)** :
  - L'application consomme l'API Google Gemini (et/ou OpenAI si configuré).
  - Autoriser le trafic HTTPS sortant (Port `443`) vers `generativelanguage.googleapis.com` (Google) et/ou `api.openai.com` (OpenAI).

---

## 4. Configuration Applicative (.env)
Un fichier de configuration `.env` doit être placé à la racine du projet sur le serveur de production. La DSI devra fournir/valider ces variables :

```env
# URL publique de l'application (ESSENTIEL pour la génération correcte des liens envoyés par mail)
BASE_URL=https://diagnostic-ia.votre-domaine.com

# Configuration SMTP (Microsoft Exchange)
EXCHANGE_HOST=IP_OU_FQDN_DU_SERVEUR_EXCHANGE
EXCHANGE_PORT=25 # ou 587 / 465
EXCHANGE_USER=compte_applicatif@votre-domaine.com
EXCHANGE_PASSWORD=mot_de_passe_ou_app_password
EXCHANGE_FROM_EMAIL=compte_applicatif@votre-domaine.com
EXCHANGE_SECURE=false # false pour port 25 ou 587 (STARTTLS), true pour port 465

# Base de données
DB_PATH=./data/diagnostic.db

# Sécurité des sessions (A générer : chaîne de caractères aléatoire de 32+ caractères)
SESSION_SECRET=VOTRE_CLE_SECRETE_TRES_LONGUE_ET_COMPLEXE

# Port d'écoute local du serveur Node (si différent de 3000)
PORT=3000

# Clés API IA
GEMINI_API_KEY=cle_api_fournie_par_le_projet
```

---

## 5. Déploiement & Sauvegarde

**Procédure de démarrage :**
1. Cloner ou copier le code source.
2. Installer les dépendances : `npm install`
3. Compiler le frontend public : `npm run build`
4. Initialiser la DB : `npm run db:migrate`
5. Lancer l'app : `pm2 start ecosystem.config.cjs`
6. Enregistrer PM2 pour le démarrage auto : `pm2 save` et `pm2 startup` (sous Linux) ou avec `pm2-windows-startup` (sous Windows).

**Politique de Sauvegarde (Backup) :**
La base de données est contenue dans un seul fichier SQLite : `[racine_projet]/data/diagnostic.db`.
- **Pré-requis** : Configurer l'outil de sauvegarde du serveur (Veeam, Windows Backup, script cron...) pour réaliser une copie quotidienne (ou horaire) du dossier `data/`.
- La restauration en cas de crash (PRA/PCA) consiste simplement à restaurer ce fichier `diagnostic.db`. Aucune ré-installation de SGBD (comme SQL Server ou MySQL) n'est requise.
