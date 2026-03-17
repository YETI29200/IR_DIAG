# Correction de la navigation vers la page d'accueil

## Modifications effectuées

### 1. Logo cliquable
- ✅ Logo du Dashboard : ajout d'un `router-link` vers `/`
- ✅ Logo de la Landing page : ajout d'un `router-link` vers `/` (header et footer)
- ✅ Styles hover ajoutés pour indiquer que le logo est cliquable

### 2. Configuration Vite SPA
- ✅ Plugin SPA fallback ajouté pour servir `index.html` sur toutes les routes
- ✅ Le routeur se synchronise avec l'URL au chargement

## Comment revenir à l'accueil

### Méthode 1 : Cliquer sur le logo
- Sur n'importe quelle page, cliquez sur le logo "Images & Réseaux" en haut à gauche
- Cela vous ramènera à la page d'accueil (`/`)

### Méthode 2 : Utiliser la barre d'adresse
- Tapez `/` dans la barre d'adresse du navigateur
- Appuyez sur Entrée

### Méthode 3 : Utiliser le bouton retour du navigateur
- Utilisez le bouton "Retour" de votre navigateur
- Ou utilisez les boutons "Retour" dans l'interface (ex: "Retour au dashboard")

## Routes disponibles

- `/` - Page d'accueil (Landing)
- `/auth` - Page de connexion
- `/admin/dashboard` - Tableau de bord consultant
- `/admin/missions/new` - Créer une nouvelle mission
- `/admin/missions/:id` - Détails d'une mission
- `/questionnaire/:type/:missionId` - Questionnaire
- `/results` - Résultats du diagnostic
- `/report/:missionId` - Rapport PDF

## Test

1. Allez sur n'importe quelle page (ex: `/admin/dashboard`)
2. Cliquez sur le logo en haut à gauche
3. Vous devriez être redirigé vers la page d'accueil (`/`)

