# Calculs Complets - Moyennes et Médianes

## Structure des Calculs

### 1. Par Dimension (pour chaque service)

#### Moyenne par dimension
- **Méthode** : Additionner toutes les valeurs brutes (0-3) de toutes les réponses pour cette dimension
- **Formule** : `moyenne = total_valeurs / nombre_réponses`
- **Score** : `(moyenne / 3) * 100`

**Exemple :**
- Dimension "ambition" : 27 valeurs brutes sur 38 réponses
- Moyenne = 27 / 38 = 0.71
- Score = (0.71 / 3) * 100 = **23.68%**

#### Médiane par dimension
- **Méthode** : Calculer le score de chaque répondant pour cette dimension, puis prendre la médiane
- **Étapes** :
  1. Pour chaque répondant : moyenne de ses réponses pour cette dimension → score individuel
  2. Trier tous les scores individuels
  3. Prendre la valeur médiane (ou moyenne des deux valeurs centrales si nombre pair)

**Exemple :**
- Scores individuels : [25%, 33.33%, 12.50%, 37.50%, 5.56%]
- Triés : [5.56%, 12.50%, 25%, 33.33%, 37.50%]
- Médiane = **25%** (valeur centrale)

---

### 2. Global par Service

#### Moyenne globale (par service)
- **Méthode** : Additionner TOUTES les valeurs brutes (0-3) de TOUTES les réponses de TOUTES les dimensions
- **Formule** : `moyenne_globale = total_toutes_valeurs / nombre_total_réponses`
- **Score global** : `(moyenne_globale / 3) * 100`

**Exemple :**
- Total valeurs brutes (toutes dimensions) : 300
- Nombre total de réponses : 1000
- Moyenne globale = 300 / 1000 = 0.30
- Score global = (0.30 / 3) * 100 = **10%**

#### Médiane globale (par service)
- **Méthode** : Médiane des scores individuels globaux
- **Étapes** :
  1. Pour chaque répondant : calculer son score global individuel (moyenne de toutes ses réponses)
  2. Trier tous les scores individuels globaux
  3. Prendre la valeur médiane (50e percentile)

**Exemple :**
- Scores individuels globaux : [22%, 25%, 28%, 30%, 35%]
- Triés : [22%, 25%, 28%, 30%, 35%]
- Médiane globale = **28%** (valeur centrale)

**⚠️ IMPORTANT :** Une médiane n'est pas additive. On ne peut PAS faire la moyenne des médianes de dimension pour obtenir la médiane globale. Il faut calculer la médiane des scores individuels globaux.

---

### 3. Global Organisation (tous services)

#### Moyenne globale organisation
- **Méthode** : Additionner TOUTES les valeurs brutes (0-3) de TOUTES les réponses de TOUS les services et TOUTES les dimensions
- **Formule** : `moyenne_org = total_toutes_valeurs_org / nombre_total_réponses_org`
- **Score global org** : `(moyenne_org / 3) * 100`

#### Médiane globale organisation
- **Méthode** : Médiane des scores individuels globaux (tous services confondus)
- **Étapes** :
  1. Pour chaque répondant (tous services) : calculer son score global individuel
  2. Trier tous les scores individuels globaux
  3. Prendre la valeur médiane (50e percentile)

**⚠️ IMPORTANT :** Même principe que pour la médiane globale par service, mais appliqué à tous les répondants de tous les services.

---

## Résumé des Calculs

| Niveau | Moyenne | Médiane |
|--------|---------|---------|
| **Par dimension (service)** | ✅ Addition valeurs brutes / count | ✅ Médiane des scores individuels |
| **Global service** | ✅ Addition toutes valeurs brutes / count total | ✅ Médiane des scores individuels globaux |
| **Global organisation** | ✅ Addition toutes valeurs brutes org / count total org | ✅ Médiane des scores individuels globaux (tous services) |

---

## Points Importants

✅ **Toujours utiliser les données brutes (0-3)** pour les moyennes
✅ **Médiane = valeur centrale** des scores individuels (pas moyenne)
✅ **Médiane globale = médiane des scores individuels globaux** (PAS moyenne des médianes de dimension)
✅ **Exclure "Ne sais pas" (valeur 4)** de tous les calculs

## ⚠️ Erreur Commune à Éviter

**❌ FAUX :** Médiane globale = moyenne des médianes de dimension
- Une médiane n'est pas additive comme une moyenne
- Faire la moyenne des médianes donne un indicateur différent, pas la médiane globale

**✅ CORRECT :** Médiane globale = médiane des scores individuels globaux
- Pour chaque répondant, calculer son score global individuel
- Prendre la médiane (50e percentile) de ces scores individuels

