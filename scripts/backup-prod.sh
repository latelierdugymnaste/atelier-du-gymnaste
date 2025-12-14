#!/bin/bash

# Script de sauvegarde de la base de données de production
# Usage: ./scripts/backup-prod.sh

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_prod_$TIMESTAMP.sql"

# Créer le dossier de sauvegarde s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# URL de la base de données de production
DATABASE_URL="postgresql://neondb_owner:npg_qg4df8rMmRpi@ep-sweet-wildflower-agrplesm-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

echo "🔄 Démarrage de la sauvegarde..."
echo "📁 Fichier: $BACKUP_FILE"

# Exporter la base de données
/opt/homebrew/opt/postgresql@17/bin/pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Compresser le fichier
    gzip "$BACKUP_FILE"
    echo "✅ Sauvegarde réussie: ${BACKUP_FILE}.gz"
    echo "📊 Taille: $(du -h ${BACKUP_FILE}.gz | cut -f1)"

    # Garder seulement les 10 dernières sauvegardes
    echo "🧹 Nettoyage des anciennes sauvegardes..."
    ls -t "$BACKUP_DIR"/backup_prod_*.sql.gz | tail -n +11 | xargs -r rm
    echo "✅ Nettoyage terminé"
else
    echo "❌ Erreur lors de la sauvegarde"
    exit 1
fi
