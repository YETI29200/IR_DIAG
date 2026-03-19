# Guide de déploiement — IR_DIAG (pour l'informaticien)

> Application de diagnostic IR développée par Images & Réseaux.
> Stack : Node.js 20 + Vue.js 3 + SQLite. Conteneurisée avec Docker.

---

## Prérequis serveur

| Composant | Version minimale |
|-----------|-----------------|
| Docker | 24+ |
| Docker Compose | v2+ (`docker compose` sans tiret) |
| RAM | 512 Mo minimum |
| Disque | 2 Go minimum |
| OS | Linux (Ubuntu 22.04 recommandé) |

Ports nécessaires :
- `3000` (application) — ou adapter selon le reverse proxy

---

## 1. Récupérer le code

```bash
git clone https://github.com/YETI29200/IR_DIAG.git
cd IR_DIAG/IR_DIAG_IA
```

> Si le code vient d'une archive ZIP fournie par le client, extraire et se placer dans le dossier `IR_DIAG_IA/`.

---

## 2. Créer le fichier de configuration `.env`

```bash
cp ENV.example .env
nano .env
```

Renseigner les valeurs suivantes :

```env
# Obligatoire : clé API Anthropic (IA pour les rapports)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Email (SMTP) pour l'envoi des rapports
SMTP_HOST=smtp.votre-domaine.fr
SMTP_PORT=587
SMTP_USER=noreply@votre-domaine.fr
SMTP_PASS=motdepasse
SMTP_FROM=IR Diagnostic <noreply@votre-domaine.fr>

# Sécurité (changer cette valeur !)
SESSION_SECRET=une-chaine-aleatoire-longue-et-unique

# Port de l'application
PORT=3000
```

---

## 3. Premier démarrage (build + migration DB)

```bash
# Construire l'image et démarrer
docker compose up -d --build

# Vérifier que le conteneur est sain
docker compose ps
docker compose logs -f ir-diag
```

L'application sera disponible sur `http://localhost:3000`.

Le premier démarrage :
1. Compile le frontend Vue.js
2. Initialise la base de données SQLite (`/app/data/diagnostic.db` dans le volume)
3. Démarre le serveur Node.js

---

## 4. Vérifier le bon fonctionnement

```bash
curl http://localhost:3000/api/health
# Réponse attendue : {"status":"ok","database":"connected","timestamp":"..."}
```

---

## 5. Mise à jour de l'application

Quand le client (Images & Réseaux) pousse une nouvelle version sur GitHub :

```bash
# Récupérer la dernière version
git pull origin main   # ou la branche définie avec le client

# Reconstruire et redémarrer (les données sont préservées dans le volume)
docker compose up -d --build

# Vérifier
docker compose ps
curl http://localhost:3000/api/health
```

> ✅ **Les données (base SQLite) sont dans un volume Docker nommé `ir-diag-data`.**
> Elles ne sont PAS effacées lors d'une mise à jour ou d'un redémarrage.

---

## 6. Sauvegarde de la base de données

### Méthode A : Via l'interface admin (recommandée)
1. Se connecter à l'application avec un compte admin
2. Cliquer sur **💾 Sauvegarder BD** dans l'en-tête
3. La sauvegarde est créée dans le volume sous `/app/data/backups/`

### Méthode B : Copie manuelle depuis le volume

```bash
# Créer un dossier de backup sur l'hôte
mkdir -p /srv/backups/ir-diag

# Copier la DB depuis le conteneur
docker cp ir-diag:/app/data/diagnostic.db /srv/backups/ir-diag/diagnostic_$(date +%Y%m%d_%H%M%S).db
```

### Méthode C : Sauvegarde automatique (cron)

Ajouter dans `crontab -e` :

```cron
# Sauvegarde quotidienne à 2h du matin
0 2 * * * docker cp ir-diag:/app/data/diagnostic.db /srv/backups/ir-diag/diagnostic_$(date +\%Y\%m\%d).db
```

---

## 7. Restaurer une sauvegarde

```bash
# Arrêter l'application
docker compose stop

# Copier la sauvegarde dans le conteneur
docker cp /srv/backups/ir-diag/diagnostic_YYYYMMDD.db ir-diag:/app/data/diagnostic.db

# Supprimer les fichiers WAL/SHM pour forcer une réouverture propre
docker exec ir-diag sh -c "rm -f /app/data/diagnostic.db-wal /app/data/diagnostic.db-shm"

# Redémarrer
docker compose start
```

---

## 8. Reverse proxy (Nginx) — optionnel

Si l'application doit être accessible sur un domaine :

```nginx
server {
    listen 80;
    server_name ir-diag.votre-domaine.fr;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Pour HTTPS, utiliser **Certbot** :
```bash
certbot --nginx -d ir-diag.votre-domaine.fr
```

---

## 9. Commandes utiles

```bash
# Voir les logs en temps réel
docker compose logs -f ir-diag

# Redémarrer sans rebuild
docker compose restart ir-diag

# Ouvrir un shell dans le conteneur
docker exec -it ir-diag sh

# Arrêter complètement
docker compose down

# Arrêter ET supprimer les données (⚠️ irréversible !)
docker compose down -v
```

---

## 10. Comptes par défaut (à changer impérativement)

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@images-reseaux.fr | admin123 | Administrateur |
| consultant@images-reseaux.fr | consultant123 | Consultant |

> ⚠️ **Changer ces mots de passe dès le premier accès !**
> Via l'interface admin → Gestion des consultants.

---

## 11. Support

- Dépôt GitHub : https://github.com/YETI29200/IR_DIAG
- Contact client : Images & Réseaux — contact@images-et-reseaux.com
