# Configuration OpenAI/ChatGPT pour les recommandations IA

## Vue d'ensemble

Par défaut, l'application génère des recommandations statiques basées sur les scores. Vous pouvez optionnellement configurer l'API OpenAI pour générer des recommandations personnalisées et intelligentes basées sur les résultats du diagnostic.

## Étape 1 : Créer un compte OpenAI

1. Allez sur <https://platform.openai.com>
2. Créez un compte ou connectez-vous
3. Vérifiez votre email

## Étape 2 : Obtenir votre clé API

1. Connectez-vous à <https://platform.openai.com>
2. Allez dans "API keys" (<https://platform.openai.com/api-keys>)
3. Cliquez sur "Create new secret key"
4. Donnez un nom à votre clé (ex: "Diagnostic Platform")
5. **Copiez la clé API** (commence par `sk-`)
   ⚠️ **Important** : Vous ne pourrez plus voir cette clé après. Sauvegardez-la.

## Étape 3 : Ajouter des crédits

1. Allez dans "Billing" → "Add payment method"
2. Ajoutez une méthode de paiement
3. Les crédits sont nécessaires pour utiliser l'API

## Étape 4 : Configurer les variables d'environnement

1. Ouvrez votre fichier `.env`
2. Ajoutez les variables OpenAI :

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-votre-cle-api-ici
OPENAI_MODEL=gpt-4o-mini
```

### Modèles disponibles

- **gpt-4o-mini** (recommandé) : Modèle économique, rapide, bon pour les recommandations
- **gpt-4o** : Plus puissant, plus cher
- **gpt-3.5-turbo** : Ancien modèle, moins cher mais moins performant

### Exemple complet

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
```

## Étape 5 : Vérification

1. Redémarrez le serveur : `npm run dev`
2. Complétez un questionnaire
3. Consultez les résultats
4. Les recommandations devraient être générées par IA si configuré

## Fonctionnement

### Avec OpenAI configuré

1. Les scores du diagnostic sont envoyés à l'API OpenAI
2. Un prompt personnalisé est généré avec les scores par dimension
3. L'IA génère 3-5 recommandations personnalisées
4. Les recommandations sont retournées en JSON

### Sans OpenAI (fallback)

1. Des recommandations statiques sont générées
2. Basées sur les dimensions avec les scores les plus bas
3. Recommandations prédéfinies par dimension

## Coûts OpenAI

### Modèle gpt-4o-mini (recommandé)

- **Input** : ~$0.15 par million de tokens
- **Output** : ~$0.60 par million de tokens
- **Estimation** : ~$0.001-0.005 par diagnostic (très économique)

### Modèle gpt-4o

- **Input** : ~$2.50 par million de tokens
- **Output** : ~$10.00 par million de tokens
- **Estimation** : ~$0.01-0.02 par diagnostic

### Limites

- **Plan gratuit** : $5 de crédits offerts (suffisant pour tester)
- **Plan payant** : Pay-as-you-go, pas d'abonnement minimum

## Personnalisation du prompt

Le prompt peut être modifié dans `server/utils/openai.js` pour :

- Changer le style des recommandations
- Ajouter plus de contexte
- Modifier le format de réponse
- Adapter au secteur d'activité

## Dépannage

### Erreur "OPENAI_API_KEY not configured"

- Vérifiez que `OPENAI_API_KEY` est défini dans `.env`
- Vérifiez qu'il n'y a pas d'espaces autour du `=`
- Redémarrez le serveur

### Erreur "Insufficient quota"

- Vérifiez votre solde sur <https://platform.openai.com/account/billing>
- Ajoutez des crédits si nécessaire

### Erreur "Invalid API key"

- Vérifiez que la clé API est correcte
- Vérifiez qu'elle commence par `sk-`
- Régénérez une nouvelle clé si nécessaire

### Recommandations non générées

- Vérifiez les logs du serveur pour les erreurs
- Le système bascule automatiquement sur les recommandations statiques en cas d'erreur
- Vérifiez que vous avez des crédits disponibles

### Réponses lentes

- L'API OpenAI peut prendre 2-5 secondes
- Utilisez `gpt-4o-mini` pour des réponses plus rapides
- Ajoutez un indicateur de chargement côté client

## Sécurité

⚠️ **Important** :

- Ne commitez JAMAIS votre clé API dans Git
- Le fichier `.env` est déjà dans `.gitignore`
- Limitez l'usage de la clé API en production
- Surveillez votre consommation sur <https://platform.openai.com/usage>

## Exemple de recommandations générées

**Avec IA** :

```json
{
  "recommendations": [
    {
      "title": "Créer un comité de gouvernance IA",
      "description": "Établissez un comité interdisciplinaire pour définir les politiques et standards d'utilisation de l'IA dans votre organisation."
    },
    {
      "title": "Lancer un programme de formation",
      "description": "Développez les compétences de vos équipes avec des formations pratiques sur les outils et méthodes IA."
    }
  ]
}
```

**Statiques (fallback)** :

```json
{
  "recommendations": [
    {
      "title": "Renforcer la stratégie IA",
      "description": "Développer une vision claire et partagée de l'IA dans votre organisation."
    }
  ]
}
```

## Améliorations possibles

- Cache des recommandations pour éviter les appels répétés
- Personnalisation par secteur d'activité
- Historique des recommandations
- A/B testing entre recommandations IA et statiques
