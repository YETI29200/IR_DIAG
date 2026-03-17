# Calcul des Scores - Détail

## Principe Simple

Le calcul est très simple en 3 étapes :

### 1. Pour chaque dimension
- On somme toutes les valeurs de réponses (0-3, en excluant "Ne sais pas" = 4)
- On compte le nombre de réponses valides
- On calcule la moyenne : `moyenne = total / count`
- On convertit en pourcentage : `score = (moyenne / 3) * 100`

**Exemple :**
- Dimension "ambition" : 27 réponses avec valeurs [0, 1, 2, 3, ...]
- Total = 27
- Count = 38
- Moyenne = 27 / 38 = 0.71
- Score = (0.71 / 3) * 100 = **23.68%**

### 2. Score global par service
- On fait la moyenne de tous les scores de dimension
- `scoreGlobal = (score1 + score2 + ... + score10) / 10`

**Exemple :**
- Scores : [23.68, 20.72, 42.11, 21.67, 33.33, 27.89, 31.58, 22.5, 31.5, 48.57]
- Somme = 303.55
- Score global = 303.55 / 10 = **30.35%**

### 3. Médiane
- Pour chaque dimension, on calcule le score de chaque répondant individuellement
- On prend la médiane de ces scores individuels
- La médiane globale = moyenne des médianes de dimension

## Ce qui NE doit PAS être fait

❌ Multiplier les scores par le nombre de questions (8)
❌ Multiplier les scores par maxScore (3)
❌ Multiplier les scores par questionCount
❌ Additionner les scores au lieu de faire la moyenne

## Logs de Debug

Après redémarrage du serveur, les logs afficheront :
- Pour chaque dimension : total, count, moyenne, score calculé
- Pour le score global : liste des scores, somme, moyenne

