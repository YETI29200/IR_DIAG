# Procédure de développement et d'exploitation — IR_DIAG

## 1. Architecture globale

```
┌─────────────────────────────────────────────────────────────────────┐
│  DÉVELOPPEMENT (Windows — vous)                                      │
│                                                                       │
│  C:\Users\denia\IR_DIAG\IR_DIAG_IA\                                 │
│  ├── client/     ← Frontend Vue.js                                   │
│  ├── server/     ← Backend Node.js                                   │
│  ├── data/       ← Base SQLite LOCALE (vos données de test/prod)    │
│  └── .env        ← Clés API                                         │
│                                                                       │
│  Démarrage local : start-servers.bat                                 │
│  Accès : http://localhost:5173                                        │
└───────────────────┬─────────────────────────────────────────────────┘
                    │
                    │  git push (vous envoyez vos modifications)
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  GITHUB (code source centralisé)                                     │
│                                                                       │
│  https://github.com/YETI29200/IR_DIAG                               │
│  └── branches :                                                      │
│      ├── main                ← version stable à déployer            │
│      └── claude/launch-*     ← branche de travail Claude Code       │
└───────────────────┬─────────────────────────────────────────────────┘
                    │                           │
                    │  git pull + docker        │  Claude Code
                    │  compose up --build       │  modifie le code ici
                    ▼                           ▼
┌──────────────────────────────┐   ┌────────────────────────────────┐
│  SERVEUR DISTANT             │   │  CLAUDE CODE (WSL/Linux)        │
│  (informaticien)             │   │                                 │
│                              │   │  /home/user/IR_DIAG/...        │
│  Docker container            │   │  ├── code modifié              │
│  ├── App Node.js             │   │  └── DB de test vide (seed)    │
│  └── Volume : diagnostic.db  │   │                                 │
│      ← données réelles       │   │  git push → GitHub             │
│         persistantes         │   │  (puis vous tirez sur Windows) │
└──────────────────────────────┘   └────────────────────────────────┘
```

---

## 2. Flux de travail au quotidien

### Cas A — Vous modifiez du code sur Windows

```
Windows (vous modifiez)
  │
  ├─ git add / git commit / git push → GitHub (branche main)
  │
  └─ Serveur distant :
       git pull origin main
       docker compose up -d --build
       (données préservées dans le volume Docker)
```

### Cas B — Claude Code modifie du code

```
Claude Code (WSL)
  │
  ├─ modifie les fichiers
  ├─ git commit / git push → GitHub (branche claude/...)
  │
  └─ Vous (Windows) :
       git fetch origin
       git merge origin/claude/launch-application-ZA8gQ
       git push origin main
       (puis notifier l'informaticien)
```

---

## 3. Synchronisation des environnements

### Récupérer les modifications de Claude Code sur Windows

```cmd
cd C:\Users\denia\IR_DIAG\IR_DIAG_IA
git fetch origin
git merge origin/claude/launch-application-ZA8gQ
```

### Envoyer une mise à jour au serveur distant

```cmd
# Fusionner dans main et pousser
git checkout main
git merge claude/launch-application-ZA8gQ
git push origin main
```

L'informaticien fait ensuite sur le serveur :
```bash
git pull origin main
docker compose up -d --build
```

---

## 4. Où sont les données (base SQLite)

| Environnement | Emplacement | Contenu |
|---------------|-------------|---------|
| Windows (dev) | `data\diagnostic.db` | Vos données de développement |
| Claude Code (WSL) | `data/diagnostic.db` | Données de test (seed) — vide par défaut |
| Serveur distant | Volume Docker `ir-diag-data` | **Données de production réelles** |

> ⚠️ Les bases de données sont **indépendantes**.
> Le code est synchronisé via GitHub, pas les données.

---

## 5. Sauvegarde de la base de données

### Sur le serveur distant (informaticien)
```bash
docker cp ir-diag:/app/data/diagnostic.db /srv/backups/diagnostic_$(date +%Y%m%d).db
```

### Via l'interface admin (vous)
- Se connecter → bouton **💾 Sauvegarder BD** dans l'en-tête
- La sauvegarde est créée dans `data/backups/`

### Script bash (WSL/Linux)
```bash
./backup_db.sh                        # sauvegarde
./backup_db.sh --restore fichier.db  # restauration
```

---

## 6. Démarrer l'application

### Windows (développement)
```cmd
cd C:\Users\denia\IR_DIAG\IR_DIAG_IA
start-servers.bat
```
→ Frontend : http://localhost:5173
→ Backend : http://localhost:3000

### Serveur distant (production, Docker)
```bash
docker compose up -d
```
→ Application : http://ip-serveur:3000 (ou domaine configuré)

---

## 7. Fichier `.env` — variables d'environnement

À créer sur chaque environnement (jamais commité dans Git) :

```env
ANTHROPIC_API_KEY=sk-ant-api03-...   # Clé IA Claude
SMTP_HOST=smtp.votre-domaine.fr      # Serveur mail
SMTP_PORT=587
SMTP_USER=noreply@...
SMTP_PASS=...
SESSION_SECRET=changez-cette-valeur  # Sécurité sessions
PORT=3000
```

---

## 8. Structure des fichiers importants

```
IR_DIAG_IA/
├── Dockerfile                         ← Image Docker de l'application
├── docker-compose.yml                 ← Orchestration Docker (prod)
├── DEPLOIEMENT_INFORMATICIEN.md       ← Guide pour l'informaticien
├── PROCEDURE.md                       ← Ce fichier
├── backup_db.sh                       ← Script de sauvegarde DB
├── .env                               ← Variables d'environnement (non commité)
├── ENV.example                        ← Modèle de .env
├── server/
│   ├── index.js                       ← Serveur Node.js
│   ├── db/
│   │   ├── schema.sql                 ← Structure de la base
│   │   └── seed.js                    ← Données de test
│   └── routes/
│       ├── admin.js                   ← Routes admin (backup...)
│       ├── auth.js                    ← Authentification
│       ├── flash.js                   ← Flash diagnostics
│       └── missions.js                ← Missions
├── client/src/
│   ├── pages/admin/Dashboard.vue      ← Tableau de bord
│   └── components/HeaderKepler.vue    ← En-tête + bouton backup
└── data/
    ├── diagnostic.db                  ← Base de données
    ├── backups/                       ← Sauvegardes
    └── questionnaire_flash_v1.json    ← Questionnaire flash
```

---

## 9. Comptes par défaut

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@images-reseaux.fr | admin123 | admin + consultant |
| consultant@images-reseaux.fr | consultant123 | consultant |

> ⚠️ Changer les mots de passe en production !

---

## 10. Pourquoi Docker ?

| Sans Docker | Avec Docker |
|-------------|-------------|
| Installer Node.js, npm sur le serveur | Juste Docker |
| Gérer les versions (Node 18? 20?) | Version fixée dans le Dockerfile |
| "Ça marche chez moi mais pas sur le serveur" | Identique partout |
| Migration difficile | `docker compose up` sur n'importe quel serveur |
| Base de données perdue si on réinstalle | Volume Docker persistant |

Le fichier à fournir à l'informaticien : **`DEPLOIEMENT_INFORMATICIEN.md`**
