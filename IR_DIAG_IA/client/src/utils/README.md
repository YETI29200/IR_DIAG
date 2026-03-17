# Utilitaires de l'Application

Ce dossier contient les utilitaires réutilisables pour garantir la robustesse et la maintenabilité de l'application.

## 📁 Structure

### `logger.ts`
Système de logging centralisé avec gestion automatique des environnements.

**Utilisation :**
```typescript
import logger from '@/utils/logger'

logger.debug('Message de debug (dev uniquement)')
logger.info('Information générale')
logger.warn('Avertissement')
logger.error('Erreur critique')
```

### `errorHandler.ts`
Gestion robuste des erreurs avec messages utilisateur conviviaux.

**Utilisation :**
```typescript
import { safeApiCall, getUserFriendlyError } from '@/utils/errorHandler'

const { data, error } = await safeApiCall(
  () => fetch('/api/data').then(r => r.json()),
  'Erreur lors du chargement'
)

if (error) {
  alert(getUserFriendlyError(error))
}
```

### `validation.ts`
Fonctions de validation pour les formulaires et données utilisateur.

**Utilisation :**
```typescript
import { isValidEmail, isValidPhone } from '@/utils/validation'

if (!isValidEmail(email)) {
  errors.email = 'Email invalide'
}
```

### `formatters.ts`
Formatage cohérent des données (dates, nombres, texte).

**Utilisation :**
```typescript
import { formatDate, formatPercentage } from '@/utils/formatters'

const formattedDate = formatDate(mission.createdAt) // "24/01/2026"
const progress = formatPercentage(75) // "75%"
```

## 🎯 Bonnes Pratiques

1. **Toujours utiliser `logger`** au lieu de `console.log` direct
2. **Utiliser `safeApiCall`** pour tous les appels API
3. **Valider les entrées utilisateur** avec les fonctions de `validation.ts`
4. **Formater les données** avec `formatters.ts` pour une cohérence visuelle

## 🔒 Sécurité

- Toutes les entrées utilisateur doivent être validées
- Utiliser `sanitizeString()` pour prévenir les attaques XSS
- Les erreurs ne doivent jamais exposer d'informations sensibles

## 📊 Performance

- Les fonctions sont optimisées pour la performance
- Pas de dépendances externes lourdes
- Utilisation de types TypeScript pour la sécurité au compile-time
