# Architecture des Recommandations

## 📋 Principe Fondamental

**Les recommandations sont générées uniquement à deux niveaux :**
1. **Niveau SERVICE** : Recommandations spécifiques à chaque service/pôle
2. **Niveau GLOBAL/ORGANISATION** : Recommandations pour l'ensemble de l'organisation

**Les recommandations individuelles par répondant ne sont PAS générées.**

---

## 🎯 Pourquoi cette architecture ?

### Résultats Individuels
- ✅ **Affichés** : Les scores individuels de chaque répondant sont calculés et peuvent être consultés
- ✅ **Utiles** : Permettent d'analyser la dispersion des réponses et de calculer la médiane
- ✅ **Visibilité** : Le chef de projet peut voir qui a répondu et les scores individuels

### Recommandations
- ❌ **Non générées par individu** : Pas de recommandations personnalisées par répondant
- ✅ **Générées par service** : Chaque service/pôle reçoit des recommandations basées sur les scores agrégés de tous ses répondants
- ✅ **Générées au global** : L'organisation reçoit des recommandations basées sur les scores moyens de tous les services

### Justification
1. **Cohérence stratégique** : Les recommandations doivent être actionnables au niveau organisationnel, pas individuel
2. **Anonymat** : Les recommandations individuelles pourraient compromettre l'anonymat des réponses
3. **Pertinence** : Les actions d'amélioration se font au niveau service/organisation, pas individuel
4. **Simplicité** : Évite la surcharge d'information et se concentre sur l'essentiel

---

## 🔧 Implémentation Technique

### Backend (`server/routes/results.js`)

#### Recommandations par Service
```javascript
// Pour chaque service, génération de recommandations basées sur :
// - Les scores agrégés de tous les répondants du service
// - La médiane des scores individuels
// - Les scores moyens par dimension

for (const service of missionServices) {
  // Calcul des scores du service (agrégation de tous les répondants)
  const serviceDimensionScores = calculateDimensionScores(serviceResponses, ...)
  
  // Génération des recommandations pour le SERVICE
  const serviceRecommendations = await generateRecommendations(
    serviceDimensionScores,
    questionnaireType,
    `${organizationName} - ${service.name}`
  )
}
```

#### Recommandations Globales
```javascript
// Génération de recommandations basées sur :
// - Les scores moyens de tous les services
// - L'ensemble de l'organisation

const globalRecommendations = await generateRecommendations(
  globalDimensionScores, // Moyenne de tous les services
  questionnaireType,
  organizationName
)
```

### Frontend (`client/src/pages/Results.vue`)

#### Vue Globale (Comparison)
- Affiche les recommandations **globales** de l'organisation
- Basées sur les scores moyens de tous les services

#### Vue Service (Details)
- Affiche les recommandations **spécifiques au service** sélectionné
- Basées sur les scores agrégés des répondants de ce service

---

## 📊 Flux de Données

```
Répondants Individuels
    ↓
Calcul des Scores Individuels (pour affichage et médiane)
    ↓
Agrégation par Service
    ↓
    ├─→ Recommandations par SERVICE
    │
    └─→ Agregation Globale
         └─→ Recommandations GLOBALES
```

---

## ✅ Points de Vérification

- [x] Les recommandations sont générées uniquement au niveau service
- [x] Les recommandations sont générées au niveau global
- [x] Aucune recommandation individuelle n'est générée
- [x] Les scores individuels sont calculés (pour affichage et médiane)
- [x] Les commentaires dans le code clarifient cette architecture

---

## 🔄 Évolution Future

Si besoin d'ajouter des recommandations individuelles (non recommandé) :
1. Modifier `server/routes/results.js` pour générer des recommandations par session
2. Ajouter une table `individual_recommendations` dans la base de données
3. Modifier le frontend pour afficher ces recommandations individuelles
4. **Attention** : Cela pourrait compromettre l'anonymat et la pertinence stratégique

---

## 📝 Notes

- Les résultats individuels restent visibles pour le chef de projet
- La médiane est calculée à partir des scores individuels
- Les recommandations restent au niveau service/organisation pour rester actionnables

