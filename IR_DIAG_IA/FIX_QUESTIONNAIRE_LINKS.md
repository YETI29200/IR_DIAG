# Correction des liens questionnaire

## Problème
Les liens "Accéder au questionnaire" pointaient vers une URL de production (`https://diagnostic.images-reseaux.fr`) qui n'existe pas en développement, causant une erreur de connexion.

## Solution appliquée

### 1. Modification de `generateUniqueLink` dans `server/routes/missions.js`
- Utilise maintenant une URL relative par défaut
- Peut être surchargée avec la variable d'environnement `BASE_URL`
- Format : `/questionnaire/${type}/${missionId}?service=${serviceCode}`

### 2. Mise à jour de `ENV.example`
- Ajout de la variable `BASE_URL` (optionnelle)
- En développement : laisser vide pour utiliser des URLs relatives
- En production : définir `BASE_URL=https://diagnostic.images-reseaux.fr`

### 3. Correction du seed.js
- Utilise maintenant la même logique pour générer les liens

## Pour que ça fonctionne

1. **Démarrer le serveur** :
   ```bash
   npm run dev
   ```
   Cela démarre à la fois le serveur Node.js (port 3000) et le client Vite (port 5173)

2. **Vérifier que les deux serveurs sont actifs** :
   - Serveur API : http://localhost:3000
   - Client Vite : http://localhost:5173

3. **Les liens générés** :
   - En développement : `/questionnaire/flash/1?service=SRV123` (URL relative)
   - En production : `https://diagnostic.images-reseaux.fr/questionnaire/flash/1?service=SRV123` (si BASE_URL est défini)

## Routes du questionnaire

Le frontend attend la route : `/questionnaire/:type/:missionId?service=CODE`

Où :
- `type` = `flash` ou `full`
- `missionId` = ID de la mission
- `service` = Code du service (optionnel)

## Test

1. Créer une mission avec un service
2. Cliquer sur "Accéder au questionnaire" dans l'onglet "Liens"
3. Le lien devrait ouvrir le questionnaire dans un nouvel onglet

