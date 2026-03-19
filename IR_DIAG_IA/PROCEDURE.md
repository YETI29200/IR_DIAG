# Procédure de développement et d'exploitation — IR_DIAG

## 1. Architecture globale

```
┌──────────────────────────────────────────────────────────────────┐
│                     MACHINE WINDOWS (Production)                  │
│                                                                    │
│  C:\Users\denia\IR_DIAG\IR_DIAG_IA\                              │
│  ├── server/          ← Backend Node.js (port 3000)              │
│  ├── client/          ← Frontend Vue.js (port 5173/5174)         │
│  ├── data/            ← BASE DE DONNÉES SQLite                   │
│  │   └── diagnostic.db  ◄── DONNÉES RÉELLES (missions, flash...) │
│  └── .env             ← Clés API (ANTHROPIC, SMTP...)            │
│                                                                    │
│  Démarrage : start-servers.bat                                    │
└─────────────────────┬────────────────────────────────────────────┘
                       │ git push / git pull
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                     GITHUB (Code source)                          │
│                                                                    │
│  https://github.com/YETI29200/IR_DIAG                            │
│  └── branches:                                                    │
│      ├── main                  ← version stable                  │
│      └── claude/launch-*      ← branche de travail Claude Code  │
└─────────────────────┬────────────────────────────────────────────┘
                       │ git fetch / git pull
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│               ENVIRONNEMENT CLAUDE CODE (WSL/Linux)               │
│                                                                    │
│  /home/user/IR_DIAG/IR_DIAG_IA/                                  │
│  ├── server/          ← Code modifié ici                         │
│  ├── client/          ← Code modifié ici                         │
│  ├── data/            ← BASE DE DONNÉES DE TEST (vide/seed)      │
│  │   └── diagnostic.db  ◄── PAS les données production !        │
│  └── .env             ← Variables d'environnement locales        │
│                                                                    │
│  Serveur de test : node server/index.js (port 3000)              │
└──────────────────────────────────────────────────────────────────┘
```

## 2. Flux de travail (workflow)

```
Claude Code (WSL)          GitHub              Windows (Production)
     │                       │                        │
     │── Modifie le code ──► │                        │
     │── git commit ───────► │                        │
     │── git push ──────────►│                        │
     │                       │◄── git pull ───────────│
     │                       │                        │
     │                       │     (l'utilisateur)    │
     │                       │   npm run dev / start  │
     │                       │   (serveur redémarre   │
     │                       │    avec nouveau code)  │
```

## 3. Où sont les données ?

| Environnement | Chemin base de données | Contenu |
|---------------|------------------------|---------|
| Windows (prod) | `C:\Users\denia\IR_DIAG\IR_DIAG_IA\data\diagnostic.db` | Données réelles (missions, flash diags, consultants) |
| WSL/Claude Code | `/home/user/IR_DIAG/IR_DIAG_IA/data/diagnostic.db` | Données de test uniquement (seed) |

> ⚠️ **IMPORTANT** : Les deux bases de données sont INDÉPENDANTES.
> Les modifications de code sont synchronisées via GitHub.
> Les données ne sont PAS synchronisées automatiquement.

## 4. Récupérer les données manquantes sur Windows

Si les données ont disparu sur Windows, chercher le fichier avec :
```cmd
where /R C:\Users\denia diagnostic.db
```

Pour restaurer depuis une sauvegarde :
```cmd
copy backup\diagnostic_YYYYMMDD_HHMMSS.db data\diagnostic.db
```

## 5. Sauvegarde de la base de données

### Méthode 1 : Script bash (Linux/WSL)
```bash
./backup_db.sh
```

### Méthode 2 : Bouton Admin dans l'interface
- Se connecter en tant qu'admin
- Cliquer sur "💾 Sauvegarder BD" dans l'en-tête
- La sauvegarde est créée dans `data/backups/`

### Méthode 3 : API directe
```bash
curl -X POST http://localhost:3000/api/admin/backup \
  -H "Authorization: Bearer <token>"
```

Les sauvegardes sont stockées dans `data/backups/diagnostic_YYYYMMDD_HHMMSS.db`.

## 6. Démarrage de l'application sur Windows

```cmd
cd C:\Users\denia\IR_DIAG\IR_DIAG_IA
start-servers.bat
```

Ou manuellement :
```cmd
# Terminal 1 - Backend
node server/index.js

# Terminal 2 - Frontend
cd client && npm run dev
```

## 7. Récupérer les modifications de Claude Code sur Windows

```cmd
cd C:\Users\denia\IR_DIAG\IR_DIAG_IA
git fetch origin
git pull origin claude/launch-application-ZA8gQ
```

Puis redémarrer le serveur.

## 8. Structure des fichiers importants

```
IR_DIAG_IA/
├── server/
│   ├── index.js          ← Point d'entrée serveur
│   ├── db/
│   │   ├── index.js      ← Connexion SQLite
│   │   ├── schema.sql    ← Schéma de la base
│   │   └── seed.js       ← Données de test
│   └── routes/
│       ├── auth.js       ← Authentification
│       ├── flash.js      ← Flash diagnostics
│       ├── missions.js   ← Missions
│       └── admin.js      ← Routes admin (backup...)
├── client/src/
│   ├── pages/admin/
│   │   └── Dashboard.vue ← Tableau de bord admin
│   └── components/
│       └── HeaderKepler.vue ← En-tête avec bouton backup
├── data/
│   ├── diagnostic.db     ← Base de données principale
│   ├── backups/          ← Sauvegardes automatiques
│   └── questionnaire_flash_v1.json
└── backup_db.sh          ← Script de sauvegarde
```

## 9. Variables d'environnement (.env)

```env
ANTHROPIC_API_KEY=...     # Clé IA Claude
SMTP_HOST=...             # Serveur mail
SMTP_USER=...             # Email expéditeur
SMTP_PASS=...             # Mot de passe mail
PORT=3000                 # Port backend
```

## 10. Comptes par défaut (seed)

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@images-reseaux.fr | Admin1234! | admin + consultant |
| consultant@images-reseaux.fr | consultant123 | consultant |

> ⚠️ Changer ces mots de passe en production !
