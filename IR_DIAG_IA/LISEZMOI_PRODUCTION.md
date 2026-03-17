# Guide de Mise en Production (IR_DIAG_IA)

Ce document décrit comment déployer l'application sur un serveur de production (Windows ou Linux).

## Prérequis

- **Node.js** (version 18 ou supérieure)
- Serveur accessible avec nom de domaine / sous-domaine
- Configuration pare-feu (pour autoriser le port 3000 au public, ou utiliser un reverse proxy comme Nginx/IIS)

## Ce qui a été configuré pour la production

1. **Compilation des Assets** : Le dossier `client/dist` est généré et servi statiquement de façon optimale par le backend Node.
2. **Gestion SPA (Single Page Application)** : Le backend sert correctement `index.html` pour les rechargements de pages et les routes enfants (pas d'erreurs 404).
3. **Sécurité et DB** :  Utilisation de variables d'environnement centralisées (`.env`) et protection avec SQLite synchronisée en local.

---

## Méthode 1 : Lancement simple sous Windows (Recommandé en local/RDP)

1. Assurez-vous que le fichier `.env` à la racine contient vos vraies clés de production et config (notamment `BASE_URL=https://votre-domaine.com`).
2. Double-cliquez simplement sur le fichier **`demarrage-production.bat`** qui vient d'être créé.
   - Ce script va installer les dépendances, compiler l'interface et lancer le réseau via `Node.js`.

---

## Méthode 2 : Lancement avec PM2 (Recommandé pour serveur permanent)

**PM2** permet à l'application de tourner en arrière-plan et de redémarrer automatiquement en cas de crash ou au redémarrage du serveur.

1. **Installer PM2 globalement** (en mode Administrateur) :
   ```bash
   npm install -g pm2
   ```

2. **Générer le front-end** :
   ```bash
   npm run build
   ```

3. **Lancer l'application** (depuis le dossier racine du projet) :
   ```bash
   pm2 start ecosystem.config.cjs
   ```

4. **Sauvegarder le profil (pour le redémarrage automatique)** :
   ```bash
   pm2 save
   ```

## Configuration du Reverse Proxy (Optionnel, ex: Nginx ou IIS)
Si vous exposez l'application via un domaine en port 80/443, configurez le serveur web pour relayer (reverse proxy) toutes les requêtes entrantes vers `http://localhost:3000`.

## Sauvegardes de la Base de Données
Votre base de données se trouve dans **`data/diagnostic.db`**.
Prenez soin d'inclure ce dossier (`/data`) dans vos règles automatisées de sauvegarde de fichiers sur votre serveur (Windows Server Backup, scripts, Veeam, etc...).
