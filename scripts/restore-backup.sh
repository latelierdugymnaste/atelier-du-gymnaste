#!/bin/bash

# Script de restauration de la base de données
# Usage: ./scripts/restore-backup.sh <fichier-backup>
# Exemple: ./scripts/restore-backup.sh ./backups/backup_prod_20241212_143022.sql.gz

if [ -z "$1" ]; then
    echo "❌ Erreur: Veuillez spécifier le fichier de sauvegarde"
    echo "Usage: ./scripts/restore-backup.sh <fichier-backup>"
    echo ""
    echo "Sauvegardes disponibles:"
    ls -lh ./backups/*.sql.gz 2>/dev/null || echo "Aucune sauvegarde trouvée"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Erreur: Le fichier $BACKUP_FILE n'existe pas"
    exit 1
fi

# URL de la base de données (modifie selon l'environnement)
read -p "⚠️  Voulez-vous restaurer sur PRODUCTION? (oui/non): " confirm
if [ "$confirm" != "oui" ]; then
    echo "❌ Restauration annulée"
    exit 0
fi

DATABASE_URL="postgresql://neondb_owner:npg_qg4df8rMmRpi@ep-sweet-wildflower-agrplesm-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

echo "🔄 Décompression du fichier..."
TEMP_FILE="${BACKUP_FILE%.gz}"
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

echo "🔄 Restauration de la base de données..."
echo "⚠️  ATTENTION: Cette opération va ÉCRASER toutes les données existantes!"
read -p "Êtes-vous ABSOLUMENT sûr? (tapez 'RESTAURER' pour confirmer): " final_confirm

if [ "$final_confirm" != "RESTAURER" ]; then
    echo "❌ Restauration annulée"
    rm "$TEMP_FILE"
    exit 0
fi

# Restaurer la base de données
psql "$DATABASE_URL" < "$TEMP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Restauration réussie!"
    rm "$TEMP_FILE"
else
    echo "❌ Erreur lors de la restauration"
    rm "$TEMP_FILE"
    exit 1
fi
