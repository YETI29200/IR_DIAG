#!/bin/bash
# Script de maintenance robuste - IR_DIAG_IA
# Ce script sécurise les données avant toute mise à jour ou manipulation

DB_PATH="./data/diagnostic.db"
BACKUP_DIR="./data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "===================================================="
echo "🛠️  ROUTINE DE MAINTENANCE - IR_DIAG_IA"
echo "===================================================="

# 1. Vérification du répertoire de backup
if [ ! -d "$BACKUP_DIR" ]; then
    echo "📁 Création du dossier de sauvegardes : $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# 2. Sécurisation physique des données (Flush WAL)
# Cela force le transfert des données du fichier .db-wal vers le fichier .db principal
echo "💾 Étape 1 : Sécurisation (WAL Checkpoint)..."
node -e "const db = require('better-sqlite3')('$DB_PATH'); db.pragma('wal_checkpoint(FULL)'); db.close();"

# 3. Sauvegarde préventive
echo "📦 Étape 2 : Création de la sauvegarde..."
BACKUP_FILE="$BACKUP_DIR/diagnostic_backup_$TIMESTAMP.db"
cp "$DB_PATH" "$BACKUP_FILE"
echo "✅ Sauvegarde créée : $BACKUP_FILE"

# 4. Vérification d'intégrité
echo "🔍 Étape 3 : Vérification de l'intégrité de la base..."
INTEGRITY=$(node -e "const db = require('better-sqlite3')('$DB_PATH'); console.log(db.prepare('PRAGMA integrity_check').get()['integrity_check']); db.close();")

if [ "$INTEGRITY" == "ok" ]; then
    echo "✅ État de la base : SAINE"
else
    echo "❌ ATTENTION : Problème d'intégrité détecté ! ($INTEGRITY)"
    echo "⚠️ Il est recommandé de restaurer la dernière sauvegarde valide."
fi

# 5. Nettoyage (Optionnel - garde les 10 dernières sauvegardes)
echo "🧹 Étape 4 : Nettoyage des anciennes sauvegardes..."
(cd "$BACKUP_DIR" && ls -tp | grep -v '/$' | tail -n +11 | xargs -I {} rm -- {}) 2>/dev/null

echo "===================================================="
echo "✨ Maintenance terminée avec succès !"
echo "===================================================="
