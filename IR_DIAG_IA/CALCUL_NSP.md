# Calcul des Scores et Taux "Ne sais pas" (NSP)

## Principe Fondamental

**"Ne sais pas" (valeur 4) n'est pas une note, c'est un signal opérationnel.**

Donc :
- ✅ On **conserve** "Ne sais pas" comme information exploitable
- ✅ On le **mesure séparément** (taux NSP)
- ❌ On ne le **mélange pas** dans le calcul du score (0-3)

---

## 1. Par Dimension (pour chaque service)

### A. Score moyen (0-3)
- **Numérateur** : somme des réponses **0-3** (tous répondants du service, sur les 8 questions de la dimension)
- **Dénominateur** : nombre de réponses **0-3** (mêmes périmètres)
- **Score %** : `(moyenne / 3) × 100`

**Formule :**
```
ScoreMoyen(S,D) = (Σ(0..3) / N(0..3)) ÷ 3 × 100
```

### B. Taux "Ne sais pas"
- **NSP_count** : nombre de réponses = 4
- **Total_count** : nombre total de réponses (0-3 + 4)
- **Taux NSP %** : `NSP_count / Total_count × 100`

**Formule :**
```
TauxNSP(S,D) = (N(4) / (N(0..3) + N(4))) × 100
```

➡️ **Résultat par dimension** : un couple **(Score, Taux NSP)**

---

## 2. Médiane par Dimension (pour chaque service)

### A. Score médian (personnes) — sur 0-3

Pour chaque répondant i du service S :

1. Sur la dimension D, prendre ses réponses 0-3 (parmi les 8 questions)
2. Calculer sa moyenne individuelle (si au moins 1 réponse 0-3)
3. Convertir en %

Puis :
- Trier les scores individuels
- Prendre la médiane (50e percentile)

**Formule :**
```
MedianeScore(S,D) = médiane({(x̄(i,D(0..3)) / 3) × 100})
```

---

## 3. Global par Service (toutes dimensions, 80 questions)

### A. Score moyen global (0-3)
- Somme de toutes les réponses **0-3** du service / nombre de réponses **0-3** du service
- Puis `/3 × 100`

### B. Taux NSP global service
- `Nb(4) / Nb(total)` sur les 80 questions × répondants du service × 100

### C. Médiane globale service (personnes)
- Pour chaque répondant i du service :
  - Moyenne individuelle sur ses réponses **0-3** (toutes dimensions)
- Médiane de ces scores individuels

---

## 4. Global Organisation (tous services)

Exactement les mêmes calculs, sans filtre service :

- Score moyen organisation (0-3)
- Taux NSP organisation
- Médiane des scores individuels (0-3)

---

## Structure des Données Retournées

### Par dimension (dans `dimensionScores`)
```json
{
  "dimension": "ambition",
  "score": 23.7,        // Score moyen (0-3) en %
  "nspRate": 5.2,       // Taux "Ne sais pas" en %
  "median": 25.0,       // Médiane des scores individuels
  "level": "low"
}
```

### Par service (dans `services`)
```json
{
  "id": 1,
  "name": "INNOVATION",
  "globalScore": 30.4,      // Score moyen global (0-3) en %
  "globalMedian": 29.0,     // Médiane des scores individuels globaux
  "globalNSPRate": 4.8,     // Taux "Ne sais pas" global en %
  "dimensionScores": [...]
}
```

### Organisation globale
```json
{
  "globalOrganizationAverage": 28.5,    // Score moyen global (0-3) en %
  "globalOrganizationMedian": 27.0,    // Médiane des scores individuels globaux
  "globalOrganizationNSPRate": 5.1     // Taux "Ne sais pas" global en %
}
```

---

## Points Importants

✅ **Scores (0-3) et "Ne sais pas" (4) sont calculés séparément**
✅ **Le taux NSP est un KPI d'action** (incertitude / non-maîtrise / non-exposition)
✅ **Les scores restent cohérents** (0-100%) car basés uniquement sur 0-3
✅ **"Ne sais pas" est exploitable** pour déclencher des actions spécifiques

