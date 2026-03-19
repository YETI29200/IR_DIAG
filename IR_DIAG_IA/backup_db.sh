#!/bin/bash
# ============================================================
# Script de sauvegarde de la base de données IR_DIAG
# Usage : ./backup_db.sh [--restore fichier.db]
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/data"
DB_FILE="$DATA_DIR/diagnostic.db"
BACKUP_DIR="$DATA_DIR/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/diagnostic_$DATE.db"
MAX_BACKUPS=10

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ---- RESTAURATION ----
if [ "$1" == "--restore" ]; then
  if [ -z "$2" ]; then
    echo -e "${RED}Usage: ./backup_db.sh --restore chemin/vers/sauvegarde.db${NC}"
    exit 1
  fi
  RESTORE_FILE="$2"
  if [ ! -f "$RESTORE_FILE" ]; then
    echo -e "${RED}Fichier introuvable : $RESTORE_FILE${NC}"
    exit 1
  fi
  echo -e "${YELLOW}⚠️  Restauration de la base depuis : $RESTORE_FILE${NC}"
  echo -e "${YELLOW}La base actuelle sera sauvegardée d'abord...${NC}"
  # Sauvegarder l'actuelle avant restauration
  mkdir -p "$BACKUP_DIR"
  cp "$DB_FILE" "$BACKUP_DIR/diagnostic_before_restore_$DATE.db" 2>/dev/null
  cp "$RESTORE_FILE" "$DB_FILE"
  # Supprimer les fichiers WAL/SHM pour forcer une réouverture propre
  rm -f "$DATA_DIR/diagnostic.db-wal" "$DATA_DIR/diagnostic.db-shm"
  echo -e "${GREEN}✅ Restauration réussie depuis $RESTORE_FILE${NC}"
  exit 0
fi

# ---- SAUVEGARDE ----
echo -e "${BLUE}=============================${NC}"
echo -e "${BLUE}  Sauvegarde IR_DIAG - $DATE${NC}"
echo -e "${BLUE}=============================${NC}"

# Vérifier que la DB existe
if [ ! -f "$DB_FILE" ]; then
  echo -e "${RED}❌ Base de données introuvable : $DB_FILE${NC}"
  exit 1
fi

# Créer le dossier de sauvegardes
mkdir -p "$BACKUP_DIR"

# Checkpoint WAL avant copie (pour inclure toutes les transactions en cours)
if command -v sqlite3 &> /dev/null; then
  echo -e "${YELLOW}📋 Checkpoint WAL...${NC}"
  sqlite3 "$DB_FILE" "PRAGMA wal_checkpoint(FULL);" 2>/dev/null
fi

# Copier la base
cp "$DB_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✅ Sauvegarde créée : $BACKUP_FILE${NC}"

# Vérifier la taille
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}   Taille : $SIZE${NC}"

# Vérifier l'intégrité
if command -v sqlite3 &> /dev/null; then
  INTEGRITY=$(sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" 2>/dev/null)
  if [ "$INTEGRITY" == "ok" ]; then
    echo -e "${GREEN}   Intégrité : OK${NC}"
  else
    echo -e "${RED}   ⚠️  Intégrité : $INTEGRITY${NC}"
  fi
fi

# Compter les enregistrements
if command -v sqlite3 &> /dev/null; then
  CONSULTANTS=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM consultants;" 2>/dev/null)
  MISSIONS=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM missions;" 2>/dev/null)
  FLASH=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM flash_diagnostics;" 2>/dev/null)
  echo -e "${BLUE}   Contenu : $CONSULTANTS consultants, $MISSIONS missions, $FLASH flash diagnostics${NC}"
fi

# Supprimer les anciennes sauvegardes (garder les MAX_BACKUPS dernières)
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/diagnostic_*.db 2>/dev/null | grep -v "before_restore" | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
  echo -e "${YELLOW}🧹 Nettoyage des anciennes sauvegardes (garde $MAX_BACKUPS)...${NC}"
  ls -1t "$BACKUP_DIR"/diagnostic_*.db 2>/dev/null | grep -v "before_restore" | tail -n +$((MAX_BACKUPS+1)) | xargs rm -f
fi

# Lister les sauvegardes disponibles
echo ""
echo -e "${BLUE}📦 Sauvegardes disponibles :${NC}"
ls -lh "$BACKUP_DIR"/diagnostic_*.db 2>/dev/null | awk '{print "   " $NF " (" $5 ")"}'

echo ""
echo -e "${GREEN}✅ Sauvegarde terminée avec succès !${NC}"
echo -e "${YELLOW}💡 Pour restaurer : ./backup_db.sh --restore $BACKUP_FILE${NC}"
