# Guide de démarrage rapide

## Prérequis

- Node.js >= 18.0.0
- npm

## Installation

```bash
# Installer les dépendances
npm install

# Initialiser la base de données
npm run db:migrate

# Charger les données de test
npm run db:seed
```

## Démarrage

```bash
# Démarrer le serveur et le client en parallèle
npm run dev
```

- **Client** : http://localhost:5173
- **Serveur API** : http://localhost:3000

## Comptes de test

Après `npm run db:seed` :

- **Admin** :
  - Email : `admin@images-reseaux.fr`
  - Password : `admin123`

- **Consultant** :
  - Email : `consultant@images-reseaux.fr`
  - Password : `consultant123`

## Workflow de test

### 1. Connexion
1. Aller sur http://localhost:5173
2. Cliquer sur "Accès Consultant"
3. Se connecter avec un compte de test

### 2. Créer une mission
1. Cliquer sur "Nouvelle mission"
2. Remplir le wizard 4 étapes :
   - Organisation : Nom, secteur, employés, type questionnaire
   - Services : Ajouter au moins un service
   - Contacts : Ajouter au moins un contact
   - Confirmation : Vérifier et créer

### 3. Accéder au questionnaire
1. Dans les détails de la mission, onglet "Liens"
2. Copier le lien unique du service
3. Ouvrir dans un nouvel onglet (navigation privée)
4. Compléter le questionnaire

### 4. Voir les résultats
1. Après finalisation, redirection vers `/results`
2. Vérifier les scores par dimension
3. Vérifier le radar chart

### 5. Générer le rapport
1. Retourner au dashboard
2. Ouvrir la mission
3. Onglet "Rapports"
4. Cliquer sur "Générer le rapport"
5. Tester l'impression PDF

## Vérification santé

```bash
# Vérifier que le serveur répond
curl http://localhost:3000/api/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-..."
}
```

## Structure de la base de données

La base de données est créée dans `data/diagnostic.db`.

Pour la réinitialiser :
```bash
rm data/diagnostic.db
npm run db:migrate
npm run db:seed
```

## Dépannage

### Erreur "Cannot find module"
```bash
npm install
```

### Erreur "Database locked"
- Fermer toutes les connexions à la DB
- Redémarrer le serveur

### Erreur CORS
- Vérifier que le client est sur http://localhost:5173
- Vérifier que le serveur est sur http://localhost:3000

### Port déjà utilisé
- Modifier le port dans `server/index.js` (serveur)
- Modifier le port dans `client/vite.config.ts` (client)

## Commandes disponibles

```bash
# Développement
npm run dev              # Serveur + client
npm run dev:server       # Serveur uniquement
npm run dev:client       # Client uniquement

# Base de données
npm run db:migrate       # Initialiser/migrer DB
npm run db:seed          # Charger données test

# Build
npm run build            # Build production client
npm run preview          # Prévisualiser build
```

## Prochaines étapes

1. Tester tous les workflows
2. Vérifier les fonctionnalités
3. Consulter `VERIFICATION.md` pour la checklist complète
4. Consulter `ARCHITECTURE.md` pour les détails techniques

