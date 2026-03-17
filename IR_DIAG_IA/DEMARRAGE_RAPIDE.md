# Guide de démarrage rapide

## 🚀 Pour démarrer l'application

### Option 1 : Démarrer le client uniquement (recommandé pour tester la page d'accueil)

```bash
npm run dev:client
```

Attendez de voir ce message :
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Option 2 : Démarrer le client ET le serveur API

```bash
npm run dev
```

## 🌐 Accéder à la page d'accueil

1. **Ouvrez votre navigateur** (Chrome, Firefox, Edge, etc.)
2. **Tapez dans la barre d'adresse** :
   ```
   http://localhost:5173/
   ```
3. **Appuyez sur Entrée**

## ⚠️ Si ça ne fonctionne pas

### Vérifier que le serveur est démarré
- Regardez votre terminal
- Vous devriez voir : `VITE v5.x.x  ready in xxx ms`
- Si vous voyez des erreurs, notez-les et partagez-les

### Vérifier le port
- Le serveur utilise le port **5173**
- Si ce port est déjà utilisé, Vite vous le dira dans le terminal

### Vider le cache du navigateur
- Appuyez sur `Ctrl + Shift + R` (ou `Cmd + Shift + R` sur Mac)
- Ou ouvrez en navigation privée

### Redémarrer le serveur
1. Arrêtez le serveur avec `Ctrl + C` dans le terminal
2. Relancez avec `npm run dev:client`

## 📋 Ce que vous devriez voir

- ✅ Logo Images & Réseaux en haut
- ✅ Titre "Diagnostic IA & Data"
- ✅ Deux cartes de diagnostic (Flash Diag et Maturity Assessment)
- ✅ Section "Comment ça marche ?" avec 5 étapes
- ✅ Footer avec logo et copyright

## 🆘 Besoin d'aide ?

Si rien ne fonctionne, partagez :
1. Les messages d'erreur du terminal
2. Les erreurs de la console du navigateur (F12)
3. Ce que vous voyez (ou ne voyez pas) à l'écran


