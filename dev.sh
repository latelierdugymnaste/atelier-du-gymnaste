#!/bin/bash

# Script de démarrage pour le développement local
# Définit les variables d'environnement avant de lancer Next.js

export DATABASE_URL="postgresql://neondb_owner:npg_qg4df8rMmRpi@ep-sweet-wildflower-agrplesm-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="votre-secret-super-securise-a-changer-en-production"

echo "🚀 Démarrage du serveur de développement..."
echo "📊 Variables d'environnement configurées:"
echo "   ✅ DATABASE_URL"
echo "   ✅ NEXTAUTH_URL"
echo "   ✅ NEXTAUTH_SECRET"
echo ""

npm run dev
