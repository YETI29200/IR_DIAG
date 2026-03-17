# AI & Data Maturity Diagnostic Platform – Images & Réseaux

Plateforme de diagnostic de maturité IA & Data pour consultants, propulsée par **Google Gemini**.

## 📚 Documentation

- **[GUIDE UTILISATEUR - CHEF DE PROJET](./GUIDE_UTILISATEUR_CHEF_PROJET.md)** : Guide complet pour créer des missions, inviter des participants et générer les rapports.
- [Architecture Technique](./ARCHITECTURE.md)

## Architecture

### Stack technique
- **Frontend**: Vue.js 3 + TypeScript + Vite
- **Backend**: Node.js (http natif, pas de framework)
- **Base de données**: SQLite (local)
- **Styling**: SCSS intégré (pas de Tailwind, pas de UI kits)
- **Dépendances externes**: Aucune (sauf Vue/Vite/TypeScript et better-sqlite3)

### Structure du projet

```
.
├── client/              # Application Vue.js
│   ├── src/
│   │   ├── pages/      # Pages de l'application
│   │   ├── components/ # Composants réutilisables
│   │   ├── router/     # Routeur minimal maison
│   │   └── styles/     # Styles SCSS
│   └── vite.config.ts
├── server/              # Serveur Node.js
│   ├── db/             # Gestion base de données
│   │   ├── schema.sql  # Schéma SQLite
│   │   ├── migrate.js  # Script de migration
│   │   └── seed.js     # Script de seed
│   ├── routes/         # Routes API
│   └── index.js        # Serveur HTTP
├── shared/              # Types partagés
│   └── types.ts
└── data/                # Base de données SQLite (généré)
```

## Installation

```bash
npm install
```

## Configuration

1. Initialiser la base de données :
```bash
npm run db:migrate
```

2. Charger les données de test :
```bash
npm run db:seed
```

## Démarrage

### Mode développement
Démarre simultanément le serveur et le client :
```bash
npm run dev
```

- Client : http://localhost:5173
- Serveur API : http://localhost:3000

### Build production
```bash
npm run build
```

## Base de données

### Schéma
Le schéma SQLite est défini dans `server/db/schema.sql` avec :
- Contraintes de clés étrangères activées
- Indexes pour les performances
- Mode WAL pour la concurrence

### Tables principales
- `consultants` : Consultants du système
- `missions` : Missions de diagnostic
- `mission_services` : Services/directions à évaluer
- `mission_contacts` : Contacts par mission
- `sessions` : Sessions anonymes de questionnaire
- `responses` : Réponses aux questions
- `recommendations` : Recommandations générées
- `email_logs` : Logs d'emails simulés

## Authentification

- Hachage de mot de passe : `scrypt` (Node crypto)
- Sessions : Tokens signés avec HMAC
- Stockage : Sessions en mémoire (à améliorer avec DB)

### Comptes de test (après seed)
- Admin : `admin@images-reseaux.fr` / `admin123`
- Consultant : `consultant@images-reseaux.fr` / `consultant123`

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/signup` - Inscription
- `GET /api/auth/me` - Vérification token

### Missions
- `GET /api/missions?consultantId=X` - Liste des missions
- `GET /api/missions/:id` - Détails mission
- `GET /api/missions/:id/sessions` - Sessions d'une mission
- `POST /api/missions` - Créer mission

### Questionnaire
- `GET /api/questionnaire/:type/:missionId?service=CODE` - Charger questionnaire
- `POST /api/questionnaire/response` - Sauvegarder réponse
- `POST /api/questionnaire/complete` - Finaliser questionnaire

### Résultats
- `GET /api/results?session=ID` - Résultats par session
- `GET /api/results?mission=ID` - Résultats par mission

### Santé
- `GET /api/health` - Vérification santé serveur/DB

## Fonctionnalités

### Pages publiques
- `/` - Landing page avec présentation des diagnostics
- `/questionnaire/:type/:missionId?service=CODE` - Questionnaire anonyme
- `/results?session=ID` - Résultats du questionnaire

### Pages consultant (authentifiées)
- `/auth` - Connexion/Inscription
- `/admin/dashboard` - Tableau de bord
- `/admin/missions/new` - Création mission (wizard 4 étapes)
- `/admin/missions/:id` - Détails mission (onglets)
- `/report/:missionId` - Prévisualisation rapport (print-to-PDF)

## Scoring

Le scoring est **déterministe** :
- Flash : 5 dimensions, 1 question chacune, max 5 points
- Complet : 10 dimensions, 8 questions chacune, max 40 points
- Niveaux : Low (<40%), Medium (40-70%), High (>70%)

## Visualisation

### Radar Chart
Composant SVG maison (`RadarChart.vue`) :
- Calcul des points polygonaux depuis les scores normalisés
- Rendu SVG natif (pas de bibliothèque)
- Compatible export PDF

## Export PDF

Utilise le workflow "Print to PDF" du navigateur :
1. Page de prévisualisation (`/report/:missionId`)
2. CSS print optimisé pour A4
3. Bouton "Imprimer / PDF" déclenche `window.print()`

## Email

Simulation d'envoi d'emails :
- Templates stockés en base
- Action "Envoyer" → log dans `email_logs` avec status `simulated_sent`
- Option copie dans presse-papiers

## Limitations connues

1. **Sessions auth** : Stockées en mémoire (à migrer vers DB)
2. **Validation** : Validation basique côté serveur (à renforcer)
3. **Questions** : Hardcodées (à externaliser en JSON/DB)
4. **Recommandations** : Statiques pour Flash (à améliorer)
5. **Email** : Simulation uniquement (pas d'envoi réel)

## Sécurité

- Mots de passe hashés avec `scrypt` + salt unique
- Tokens signés avec HMAC
- CORS configuré pour localhost uniquement
- Validation des entrées (basique)

## Roadmap

- [ ] Stockage sessions en DB
- [ ] Questions externalisées (JSON/DB)
- [ ] Recommandations dynamiques
- [ ] Export PDF amélioré
- [ ] Tests automatisés
- [ ] Documentation API complète

## Licence

Propriétaire - Images & Réseaux

