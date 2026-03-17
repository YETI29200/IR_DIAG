# Architecture - AI & Data Maturity Diagnostic Platform

## Vue d'ensemble

Application web de type SPA (Single Page Application) avec architecture local-first utilisant SQLite comme base de données locale.

## Stack technique

### Frontend
- **Framework**: Vue.js 3 (Composition API)
- **Language**: TypeScript
- **Build tool**: Vite
- **Styling**: SCSS intégré (pas de framework CSS externe)
- **Routing**: Routeur minimal maison (pas de vue-router)

### Backend
- **Runtime**: Node.js
- **HTTP Server**: Module `http` natif (pas de framework)
- **Database**: SQLite via `better-sqlite3`
- **Auth**: Crypto natif Node.js (scrypt, HMAC)

### Dépendances
- **Vue 3** : Framework frontend
- **Vite** : Build tool et dev server
- **TypeScript** : Typage statique
- **better-sqlite3** : Binding SQLite pour Node.js
- **sass** : Compilateur SCSS
- **concurrently** : Exécution parallèle en dev

**Aucune autre dépendance externe** (pas de chart libs, PDF libs, email libs, auth libs, ORM, state libs).

## Architecture applicative

### Structure des dossiers

```
.
├── client/                 # Application Vue.js
│   ├── src/
│   │   ├── pages/         # Pages de l'application
│   │   │   ├── Landing.vue
│   │   │   ├── Auth.vue
│   │   │   ├── Questionnaire.vue
│   │   │   ├── Results.vue
│   │   │   ├── ReportPreview.vue
│   │   │   └── admin/      # Pages consultant
│   │   ├── components/    # Composants réutilisables
│   │   │   └── RadarChart.vue
│   │   ├── router/        # Routeur maison
│   │   │   ├── index.ts
│   │   │   └── routes.ts
│   │   ├── styles/        # Styles SCSS
│   │   │   ├── main.scss
│   │   │   ├── _variables.scss
│   │   │   ├── _mixins.scss
│   │   │   └── _base.scss
│   │   ├── App.vue
│   │   └── main.ts
│   └── vite.config.ts
│
├── server/                 # Serveur Node.js
│   ├── db/                # Gestion base de données
│   │   ├── schema.sql     # Schéma SQLite
│   │   ├── index.js       # Connection DB
│   │   ├── migrate.js    # Script migration
│   │   └── seed.js       # Données de test
│   ├── routes/            # Handlers de routes
│   │   ├── auth.js
│   │   ├── missions.js
│   │   ├── questionnaire.js
│   │   ├── results.js
│   │   ├── emails.js
│   │   └── health.js
│   └── index.js           # Serveur HTTP principal
│
├── shared/                 # Code partagé
│   └── types.ts           # Types TypeScript partagés
│
└── data/                   # Base de données (généré)
    └── diagnostic.db
```

## Schéma de base de données

### Tables principales

1. **consultants** : Utilisateurs consultants
   - Authentification email/password
   - Profil (nom, prénom, poste, téléphone, signature)

2. **user_roles** : Rôles utilisateurs (admin, consultant)

3. **missions** : Missions de diagnostic
   - Organisation, secteur, nombre d'employés
   - Type de questionnaire (flash/full)
   - Statut (draft/active/closed)

4. **mission_services** : Services/directions à évaluer
   - Code unique généré
   - Lien unique pour questionnaire

5. **mission_contacts** : Contacts par mission
   - Liés à un service optionnel
   - Contact principal identifié

6. **sessions** : Sessions anonymes de questionnaire
   - Token anonyme unique
   - Dates début/fin

7. **responses** : Réponses aux questions
   - Une réponse par question/session
   - Valeur 0-5

8. **recommendations** : Recommandations générées
   - Payload JSON
   - Statut (draft/approved/rejected)
   - Historique des modifications

9. **email_logs** : Logs d'emails simulés
   - Template utilisé
   - Contenu rendu
   - Statut (simulated_sent/copied)

### Contraintes et intégrité

- **Foreign keys** : Activées avec `PRAGMA foreign_keys = ON`
- **Cascades** : Suppression en cascade où approprié
- **Indexes** : Sur les colonnes fréquemment requêtées
- **WAL mode** : Pour meilleure concurrence

## Authentification

### Flux

1. **Inscription** (`POST /api/auth/signup`)
   - Email, password, nom, prénom
   - Hash password avec `scrypt` + salt unique
   - Création consultant + rôle par défaut
   - Retourne token de session

2. **Connexion** (`POST /api/auth/login`)
   - Vérification email/password
   - Génération token signé (HMAC)
   - Retourne token + profil consultant

3. **Vérification** (`GET /api/auth/me`)
   - Validation token (à améliorer avec DB)

### Sécurité

- **Hachage** : `scrypt` avec salt unique par utilisateur
- **Tokens** : Signés avec HMAC (secret en env)
- **Sessions** : Actuellement en mémoire (à migrer vers DB)

## API REST

### Endpoints

#### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/signup` - Inscription
- `GET /api/auth/me` - Vérification token

#### Missions
- `GET /api/missions?consultantId=X` - Liste missions
- `GET /api/missions/:id` - Détails mission
- `GET /api/missions/:id/sessions` - Sessions d'une mission
- `POST /api/missions` - Créer mission

#### Questionnaire
- `GET /api/questionnaire/:type/:missionId?service=CODE` - Charger questionnaire
- `POST /api/questionnaire/response` - Sauvegarder réponse
- `POST /api/questionnaire/complete` - Finaliser questionnaire

#### Résultats
- `GET /api/results?session=ID` - Résultats par session
- `GET /api/results?mission=ID` - Résultats par mission

#### Emails
- `GET /api/emails/templates` - Liste templates
- `POST /api/emails/send` - Simuler envoi
- `GET /api/emails/logs?missionId=X` - Logs emails

#### Santé
- `GET /api/health` - Vérification serveur/DB

## Routing frontend

### Routeur maison

Implémentation minimale avec :
- Gestion historique navigateur (`popstate`)
- Parsing query params
- Matching de routes avec paramètres (`:id`)
- Injection dans composants via `provide/inject`

### Routes

**Publiques** :
- `/` - Landing page
- `/auth` - Connexion/Inscription
- `/questionnaire/:type/:missionId?service=CODE` - Questionnaire
- `/results?session=ID` - Résultats

**Authentifiées** :
- `/admin/dashboard` - Tableau de bord
- `/admin/missions/new` - Création mission
- `/admin/missions/:id` - Détails mission
- `/report/:missionId` - Rapport (print-to-PDF)

## Scoring déterministe

### Calcul des scores

1. **Par dimension** :
   - Somme des valeurs de réponses (0-5)
   - Score max = nombre de questions × 5
   - Score % = (somme / max) × 100

2. **Niveaux** :
   - Low : < 40%
   - Medium : 40-70%
   - High : > 70%

### Types de questionnaire

- **Flash** : 5 dimensions, 1 question chacune, max 5 points
- **Complet** : 10 dimensions, 8 questions chacune, max 40 points

## Visualisation

### Radar Chart SVG

Composant maison `RadarChart.vue` :

1. **Calcul géométrique** :
   - Dimensions distribuées uniformément autour du cercle
   - Angle = `(index × 2π) / totalDimensions - π/2` (démarre en haut)
   - Distance point = `(score / 100) × radius`

2. **Rendu SVG** :
   - Cercles de fond (5 niveaux)
   - Axes (lignes centre → dimensions)
   - Labels dimensions
   - Polygone de scores (filled)
   - Points de scores

3. **Export** : Compatible print-to-PDF

## Export PDF

### Workflow

1. Page de prévisualisation (`/report/:missionId`)
2. CSS print optimisé pour A4
3. Bouton "Imprimer / PDF" → `window.print()`
4. Utilisateur choisit "Enregistrer en PDF" dans le navigateur

### CSS Print

- `@page { size: A4; margin: 2cm; }`
- `page-break-inside: avoid` sur sections
- Masquage éléments UI (`@media print`)

## Email simulation

### Templates

Templates stockés avec variables :
- `{{organization_name}}`
- `{{contact_first_name}}`
- `{{questionnaire_link}}`
- etc.

### Moteur de template

Remplacement simple : `{{variable}}` → valeur

### Logs

Tous les "envois" sont loggés dans `email_logs` :
- Status : `simulated_sent`
- Contenu rendu stocké
- Option copie presse-papiers

## État de l'application

### Gestion d'état

- **Pas de Pinia/Vuex** : Utilisation réactivité Vue native
- **State local** : `ref` / `reactive` dans composants
- **API calls** : Fetch direct depuis composants
- **Auth state** : `localStorage` (token + consultant)

## Sécurité

### Données au repos

- SQLite local (fichier `.db`)
- Mots de passe hashés (scrypt)
- Tokens signés (HMAC)

### Données en transit

- HTTP (pas HTTPS en dev local)
- CORS configuré pour localhost uniquement

### Validation

- Validation basique côté serveur
- À renforcer avec schémas de validation

## Limitations connues

1. **Sessions auth** : En mémoire (à migrer vers DB)
2. **Validation** : Basique (à renforcer)
3. **Questions** : Hardcodées (à externaliser)
4. **Recommandations** : Statiques (à améliorer)
5. **Email** : Simulation uniquement
6. **HTTPS** : Pas en dev (nécessaire en prod)

## Roadmap

- [ ] Sessions auth en DB
- [ ] Questions externalisées (JSON/DB)
- [ ] Recommandations dynamiques
- [ ] Validation renforcée
- [ ] Tests automatisés
- [ ] HTTPS en production
- [ ] Documentation API complète

